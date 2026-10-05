const paths: Record<string, string> = {
  paw: '<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><path d="M7 19c-3-3 1-8 5-8s8 5 5 8c-2 2-3 0-5 0s-3 2-5 0Z"/>',
  journal:
    '<rect x="5" y="3" width="15" height="18" rx="3"/><path d="M3 7h4M3 12h4M3 17h4M11 8h5M11 12h5"/>',
  plan: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 11h16m-12 4 2 2 5-3"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',
  settings:
    '<path d="m9 3-1 3-3 1 1 4-1 3 3 2 1 4h5l1-4 3-2-1-3 1-4-3-1-1-3Z"/><circle cx="11.5" cy="11.5" r="3"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
  leaf: '<path d="M5 19C-1 7 10 3 21 3c0 12-4 19-14 14M4 21 15 10"/>',
  scale:
    '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M8 7a5 5 0 0 1 8 0l-4 5Z"/>',
};
export const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.paw}</svg>`;
