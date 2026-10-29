import { SuccessStories } from '@/components/site/ListPages';
import { getPage, getSessionLang } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const lang = await getSessionLang();
  return buildMetadata((await getPage('successstories', lang)).seo);
}

export default async function Page() {
  return <SuccessStories lang={await getSessionLang()} />;
}
