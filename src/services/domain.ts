// Minimal normalization helpers to keep logic consistent across RU/EN UI strings

export function normalizeCompoundForm(form: string | undefined | null): string {
  const f = (form || '').toString().toLowerCase();
  if (f.includes('инъек')) return 'Injection';
  if (f.includes('таблет')) return 'Tablet';
  if (f.includes('капсул')) return 'Capsule';
  if (f.includes('гель')) return 'Gel';
  if (f.includes('патч') || f.includes('пластыр')) return 'Patch';
  switch (f) {
    case 'injection': return 'Injection';
    case 'tablet': return 'Tablet';
    case 'capsule': return 'Capsule';
    case 'gel': return 'Gel';
    case 'patch': return 'Patch';
  }
  return form || '';
}

export function isInjectionForm(form: string | undefined | null): boolean {
  return normalizeCompoundForm(form) === 'Injection';
}

export function isTabletForm(form: string | undefined | null): boolean {
  return normalizeCompoundForm(form) === 'Tablet';
}

export function normalizeStatus(status: string | undefined | null): string {
  const s = (status || '').toString().toLowerCase();
  // RU to EN
  if (s.includes('актив')) return 'active';
  if (s.includes('заверш')) return 'completed';
  if (s.includes('приоста')) return 'paused';
  if (s.includes('отмен')) return 'cancelled';
  if (s.includes('план')) return 'planned';
  // EN passthrough
  if (['active','completed','paused','cancelled','planned'].includes(s)) return s;
  return s;
}
