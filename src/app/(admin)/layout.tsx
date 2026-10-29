import type { Metadata, Viewport } from 'next';
import '@/components/admin/admin.css';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s · Dashboard' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

/** Root layout of the admin dashboard (separate from the public site's root layout). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="adm">{children}</body>
    </html>
  );
}
