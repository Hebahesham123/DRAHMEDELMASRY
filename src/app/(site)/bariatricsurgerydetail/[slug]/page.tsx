import DetailArticle from '@/components/site/DetailArticle';
import { itemMetadata, loadItemOr404, type SlugParams } from '@/lib/detail';

export const generateMetadata = ({ params }: SlugParams) => itemMetadata('bariatric', params);

export default async function Page({ params }: SlugParams) {
  const item = await loadItemOr404('bariatric', params);
  return <DetailArticle item={item} />;
}
