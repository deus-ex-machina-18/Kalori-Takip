const paths: Record<string, string> = {
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 10v7M12 6v1"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 10h18"/>',
  plus: '<path d="M12 3v18M3 12h18"/>',
  users:
    '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3Zm-2-6a4 4 0 0 0-2 4m22-4a4 4 0 0 1 2 4"/><circle cx="3" cy="9" r="2"/><circle cx="21" cy="9" r="2"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/>',
  flag: '<path d="M4 22V3c5-4 10 4 16 0v11c-6 4-11-4-16 0"/>',
  image:
    '<rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="7" cy="8" r="2"/><path d="m3 19 6-8 4 5 3-4 5 7"/>',
  cat: '<path d="M6 20C0 14 5 9 6 5L5 2l4 2 3-2 3 4 4 1-2 3c-3 1-3 4 0 7 3 4-4 6-8 3-4-3-4-8-1-11M5 20c-3-3-5-6-3-10"/><path stroke="#c6893d" d="M16 2c5 3 8 11 4 16"/>',

  paw: '<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><path d="M7 19c-3-3 1-8 5-8s8 5 5 8c-2 2-3 0-5 0s-3 2-5 0Z"/>',
  journal:
    '<rect x="5" y="3" width="15" height="18" rx="3"/><path d="M3 7h4M3 12h4M3 17h4M11 8h5M11 12h5"/>',
  plan: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 11h16m-12 4 2 2 5-3"/>',
  chart:
    '<path d="M3 21h18M5 20v-6h4v6m3 0V9h4v11m3 0V3h3v17"/><path stroke="#c6893d" d="m4 8 1-2 1 2 2 1-2 1-1 2-1-2-2-1Z"/>',
  settings:
    '<path d="m9 3-1 3-3 1 1 4-1 3 3 2 1 4h5l1-4 3-2-1-3 1-4-3-1-1-3Z"/><circle cx="11.5" cy="11.5" r="3"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
  leaf: '<path d="M5 19C-1 7 10 3 21 3c0 12-4 19-14 14M4 21 15 10"/>',
  scale:
    '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M8 7a5 5 0 0 1 8 0l-4 5Z"/>',
};
export const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.paw}</svg>`;
