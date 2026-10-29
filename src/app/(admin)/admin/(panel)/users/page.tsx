import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { UsersManager } from '@/components/admin/UsersManager';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage() {
  const { supabase, admin } = await getAdminSession();
  if (admin?.role !== 'owner') {
    return (
      <div className="card card-pad empty">
        <h2>Owners only</h2>
        <p>Only website owners can manage dashboard users.</p>
      </div>
    );
  }
  const { data } = await supabase.from('admins').select('user_id, email, role, created_at').order('created_at');
  return (
    <>
      <div className="page-head">
        <div className="titles">
          <h1>Dashboard users</h1>
          <p>People who can sign in to this dashboard. Owners can also manage users; editors can change all content.</p>
        </div>
      </div>
      <UsersManager users={data || []} me={admin.user_id} />
    </>
  );
}
