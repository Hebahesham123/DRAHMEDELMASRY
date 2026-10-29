import type { ItemExtra } from '@/lib/types';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Article body exactly as the old CMS printed it: an outer <p>, the table of
 * contents (if any), a spacer, then the content.
 */
export function articleHtml(body: string, extra: ItemExtra | undefined, tocFallbackTitle: string) {
  const toc = extra?.toc;
  let tocHtml = '';
  if (toc && toc.entries?.length) {
    const links = toc.entries
      .map((e) => `<a class="art-link" style='cursor:hand'  onclick="scrollToElement('${esc(e.id)}');">${esc(e.text)}</a>                    <br/>`)
      .join('\n');
    tocHtml = `
<div class="article-content">
    <div class="row">
        <div class="col-lg-12 col-12">
            <div class="article-content-card">
                <h5 class="post-title dsn-bg title-block goldencolor">${esc(toc.title || tocFallbackTitle)}</h5>
${links}
            </div>
        </div>
    </div>
</div>
                                        <div>&nbsp;</div>
`;
  }
  return `<p>${tocHtml}${body}
                                    </p>`;
}
