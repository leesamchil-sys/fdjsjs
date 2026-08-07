export function isVersionOlder(currentVersion: string, requiredVersion: string): boolean {
  try {
    const parse = (v: string) => v.replace(/^v/i, '').split('.').map(Number);
    const c = parse(currentVersion);
    const r = parse(requiredVersion);
    
    for (let i = 0; i < Math.max(c.length, r.length); i++) {
      const cv = c[i] || 0;
      const rv = r[i] || 0;
      if (cv < rv) return true;
      if (cv > rv) return false;
    }
    return false;
  } catch (e) {
    return false;
  }
}
