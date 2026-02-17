import { AdminAuthProvider } from '@/lib/admin/auth-context';
import { ProtectedRoute } from '@/components/admin/protected-route';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { ForceLightMode } from '@/components/admin/force-light-mode';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ForceLightMode />
      <AdminAuthProvider>
        <ProtectedRoute>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ProtectedRoute>
      </AdminAuthProvider>
      <Toaster />
    </Providers>
  );
}