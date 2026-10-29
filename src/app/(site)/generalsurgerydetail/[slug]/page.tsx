import DetailArticle from '@/components/site/DetailArticle';
import { itemMetadata, loadItemOr404, type SlugParams } from '@/lib/detail';

export const generateMetadata = ({ params }: SlugParams) => itemMetadata('general', params);

export default async function Page({ params }: SlugParams) {
  const item = await loadItemOr404('general', params);
  return <DetailArticle item={item} />;
}
