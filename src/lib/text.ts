/** Plain-text excerpt like the old CMS: first N characters of the text followed by "..." */
export function excerptOf(html: string, n = 120): string {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.slice(0, n) + '...';
}

export const pageOf = (index: number, perPage: number) => Math.floor(index / perPage) + 1;
