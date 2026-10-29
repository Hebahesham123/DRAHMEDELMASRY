import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { ChangePassword } from '@/components/admin/ChangePassword';

export const metadata: Metadata = { title: 'Change password' };

export default async function AccountPage() {
  const { user } = await getAdminSession();
  return (
    <>
      <div className="page-head">
        <div className="titles">
          <h1>Change my password</h1>
          <p>Signed in as {user?.email}</p>
        </div>
      </div>
      <div className="card card-body" style={{ maxWidth: 460 }}>
        <ChangePassword email={user?.email || ''} />
      </div>
    </>
  );
}
