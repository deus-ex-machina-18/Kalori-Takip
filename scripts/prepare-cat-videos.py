"""Prepare existing clips, never generate a new character. Requires ffmpeg/ffprobe.
Usage: python3 scripts/prepare-cat-videos.py --source-dir /path/to/inputs
Inputs: idle.mp4, target-met.mp4, above-target.mp4, above-maintenance.mp4,
below-target.mp4. Originals remain outside the repository.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/cat-media'
NAMES = ['idle', 'target-met', 'above-target', 'above-maintenance', 'below-target']

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
source = args.parse_args().source_dir
OUT.mkdir(parents=True, exist_ok=True)
manifest = {'version': 1, 'method': 'existing AI-generated clips, re-encoded with a 0.25s dissolve to the canonical idle first frame',
            'source': 'User-provided idle and three Wan clips; previously generated free Wan target-met clip. No stock or paid assets added.',
            'knownVisualIssues': ['Below-target bowl appears and moves during the reaction; end dissolve only removes the final prop jump.',
                                  'Above-target side glance and head shake are weak.'],
            'clips': {}}
with tempfile.TemporaryDirectory() as temp:
    frame = pathlib.Path(temp) / 'idle-first.png'
    run('ffmpeg', '-v', 'error', '-y', '-i', str(source / 'idle.mp4'), '-frames:v', '1', '-vf', 'scale=640:640', str(frame))
    run('ffmpeg', '-v', 'error', '-y', '-i', str(frame), '-c:v', 'libwebp', '-quality', '88', str(OUT / 'poster.webp'))
    for name in NAMES:
        original = source / f'{name}.mp4'
        duration = float(probe(original)['format']['duration'])
        frames = int(duration * 24)
        duration = frames / 24
        # The common frame removes end-pose jumps and makes idle loop back cleanly.
        start = duration - 0.25
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
    poster = OUT / 'poster.webp'
    manifest['poster'] = {'file': poster.name, 'width': 640, 'height': 640,
                          'bytes': poster.stat().st_size, 'sha256': hashlib.sha256(poster.read_bytes()).hexdigest()}
    manifest['totalBytes'] = sum(c['bytes'] for c in manifest['clips'].values()) + poster.stat().st_size
    manifest['initialBytes'] = manifest['clips']['idle']['bytes'] + poster.stat().st_size
    (OUT / 'asset-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'totalBytes': manifest['totalBytes'], 'initialBytes': manifest['initialBytes']}))
