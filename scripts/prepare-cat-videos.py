"""Prepare existing clips, never generate a new character. Requires ffmpeg/ffprobe.
Usage: python3 scripts/prepare-cat-videos.py --source-dir /path/to/inputs
Use --clips touch play stretch sleep to add only the four interaction clips.
The source directory must also contain the original idle.mp4 for the shared frame.
Unselected output clips and the poster are preserved. Originals stay outside git.
"""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/cat-media'
NAMES = ['idle', 'target-met', 'above-target', 'above-maintenance', 'below-target', 'touch', 'play', 'stretch', 'sleep']

def run(*args):
    return subprocess.check_output(args)

def probe(path):
    return json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)))

def info(path):
    data = probe(path)
    s = data['streams'][0]
    return {'file': path.name, 'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'width': s['width'], 'height': s['height'], 'fps': s['avg_frame_rate'],
            'durationSeconds': float(data['format']['duration']), 'codec': s['codec_name'],
            'profile': s['profile'], 'pixelFormat': s['pix_fmt'], 'silent': len(data['streams']) == 1}

args = argparse.ArgumentParser()
args.add_argument('--source-dir', required=True, type=pathlib.Path)
args.add_argument('--clips', nargs='+', default=NAMES)
options = args.parse_args()
if any(not re.fullmatch(r'[a-z]+(?:-[a-z]+)*', name) for name in options.clips):
    args.error('Clip names must contain only lowercase letters and hyphens.')
source = options.source_dir
OUT.mkdir(parents=True, exist_ok=True)
manifest = {'version': 1, 'method': 'existing AI-generated clips, re-encoded with a 0.25s dissolve to the canonical idle first frame',
            'source': 'User-provided idle and three Wan clips; previously generated free Wan target-met clip. No stock or paid assets added.',
            'knownVisualIssues': ['Below-target bowl appears and moves during the reaction; end dissolve only removes the final prop jump.',
                                  'Above-target side glance and head shake are weak.'],
            'clips': {}}
if (OUT / 'asset-manifest.json').exists():
    manifest = json.loads((OUT / 'asset-manifest.json').read_text())
if any(name in options.clips for name in ['touch', 'play', 'stretch', 'sleep']):
    manifest['version'] = max(2, manifest['version'])
    manifest['interactionSource'] = 'Four user-provided free Wan clips: touch, tail play, stretch, seated doze. No new generation.'
    manifest['knownInteractionVisualIssues'] = [
        'Play ends with a different tail position; the final dissolve restores the canonical idle frame.',
        'Stretch moves forward before sitting; the final dissolve restores the canonical idle frame.',
        'Sleep ears fold more than the prompt requested.']
with tempfile.TemporaryDirectory() as temp:
    frame = pathlib.Path(temp) / 'idle-first.png'
    run('ffmpeg', '-v', 'error', '-y', '-i', str(source / 'idle.mp4'), '-frames:v', '1', '-vf', 'scale=640:640', str(frame))
    if 'idle' in options.clips or not (OUT / 'poster.webp').exists():
        run('ffmpeg', '-v', 'error', '-y', '-i', str(frame), '-c:v', 'libwebp', '-quality', '88', str(OUT / 'poster.webp'))
    for name in options.clips:
        original = source / f'{name}.mp4'
        duration = float(probe(original)['format']['duration'])
        frames = int(duration * 24)
        duration = frames / 24
        # The common frame removes end-pose jumps and makes idle loop back cleanly.
        start = (frames - 1) / 24 - 0.25
        filters = (f'[0:v]fps=24,scale=640:640,setsar=1,trim=end_frame={frames},setpts=PTS-STARTPTS,format=yuv420p[v];'
                   f'[1:v]fps=24,setsar=1,format=yuv420p[p];'
                   f"[v][p]blend=all_expr='A*(1-min(1,max(0,(T-{start})/0.25)))+B*min(1,max(0,(T-{start})/0.25))':shortest=1[out]")
        path = OUT / f'{name}.mp4'
        run('ffmpeg', '-v', 'error', '-y', '-i', str(original), '-loop', '1', '-i', str(frame),
            '-filter_complex', filters, '-map', '[out]', '-an', '-frames:v', str(frames),
            '-c:v', 'libx264', '-profile:v', 'baseline', '-level:v', '3.0', '-pix_fmt', 'yuv420p',
            '-preset', 'medium', '-crf', '23', '-movflags', '+faststart', str(path))
        entry = info(path)
        entry['sourceSha256'] = hashlib.sha256(original.read_bytes()).hexdigest()
        entry['sourceBytes'] = original.stat().st_size
        manifest['clips'][name] = entry
    ordered = dict.fromkeys([*NAMES, *manifest['clips']])
    manifest['clips'] = {name: manifest['clips'][name] for name in ordered if name in manifest['clips']}
    poster = OUT / 'poster.webp'
    manifest['poster'] = {'file': poster.name, 'width': 640, 'height': 640,
                          'bytes': poster.stat().st_size, 'sha256': hashlib.sha256(poster.read_bytes()).hexdigest()}
    manifest['totalBytes'] = sum(c['bytes'] for c in manifest['clips'].values()) + poster.stat().st_size
    manifest['initialBytes'] = manifest['clips']['idle']['bytes'] + poster.stat().st_size
    (OUT / 'asset-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'totalBytes': manifest['totalBytes'], 'initialBytes': manifest['initialBytes']}))
