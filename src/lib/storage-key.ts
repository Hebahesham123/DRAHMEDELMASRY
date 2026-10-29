// Supabase Storage only accepts ASCII object names, but most of the original
// files have Arabic names. Each path segment is URL-encoded and "%" is swapped
// for "!" (literal "!" is escaped first) so the mapping is reversible.
// Keep in sync with scripts/import.mjs
export function storageKey(path: string): string {
  return path
    .split('/')
    .map((seg) => encodeURIComponent(seg).replace(/!/g, '%21').replace(/%/g, '!'))
    .join('/');
}

export function fromStorageKey(key: string): string {
  return key
    .split('/')
    .map((seg) => {
      try {
        return decodeURIComponent(seg.replace(/!/g, '%'));
      } catch {
        return seg;
      }
    })
    .join('/');
}
