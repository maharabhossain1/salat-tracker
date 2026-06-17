import { redirect } from 'next/navigation';

import { auth } from '@/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen">
      {/* TODO: add sidebar / topbar with session */}
      <main className="p-6">{children}</main>
    </div>
  );
}
