/** Links are stored exactly like the old site wrote them (spaces/Arabic unencoded). */
export function href(h: string | undefined | null): string {
  if (!h) return '#0';
  return h;
}

/** Image/file reference → src. Stored values are site paths (/ApplicationImages/…) or full URLs. */
export function src(p: string | undefined | null): string {
  if (!p) return '';
  return p;
}
