import BookPage from '@/components/site/BookPage';
import { getPage } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return buildMetadata((await getPage('book_nutrition', 'en')).seo);
}

export default function Page() {
  return <BookPage pageKey="book_nutrition" lang="en" />;
}
