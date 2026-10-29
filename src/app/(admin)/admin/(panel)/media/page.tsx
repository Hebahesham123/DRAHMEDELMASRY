import type { Metadata } from 'next';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

export const metadata: Metadata = { title: 'Media library' };

export default function MediaPage() {
  return (
    <>
      <div className="page-head">
        <div className="titles">
          <h1>Media library</h1>
          <p>All images and files used on the website. Click a file to copy its address or delete it.</p>
        </div>
      </div>
      <div className="card">
        <MediaLibrary mode="page" />
      </div>
    </>
  );
}
