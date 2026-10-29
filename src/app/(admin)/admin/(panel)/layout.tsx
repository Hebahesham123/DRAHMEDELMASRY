import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { signOut } from '@/lib/admin/actions';
import { Shell } from '@/components/admin/Shell';
import { UiProvider } from '@/components/admin/ui';
import { Icon } from '@/components/admin/Icon';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, admin } = await getAdminSession();
  if (!user) redirect('/admin/login');
  if (!admin) {
    return (
      <div className="auth-wrap">
        <div className="card auth-card stack">
          <h1>No access</h1>
          <p className="muted">
            You are signed in as <b>{user.email}</b>, but this account does not have access to the dashboard. Ask the website owner to add you.
          </p>
          <form action={signOut}>
            <button className="btn btn-block" type="submit">
              <Icon name="logout" /> Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }
  const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false);
  return (
    <UiProvider>
      <Shell email={user.email} role={admin.role} unread={count ?? 0} signOut={signOut}>
        {children}
      </Shell>
    </UiProvider>
  );
}
