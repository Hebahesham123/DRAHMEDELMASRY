import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const { admin } = await getAdminSession();
  if (admin) redirect('/admin');
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand">
          <span className="brand-mark">AM</span>
          <span>
            Dr. Ahmed El Masry
            <small>Website dashboard</small>
          </span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
