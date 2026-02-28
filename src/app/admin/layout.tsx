import { AdminAuthProvider } from '@/lib/admin/auth-context';
import { ProtectedRoute } from '@/components/admin/protected-route';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { Toaster } from '@/components/ui/toaster';
import { ForceLightMode } from '@/components/admin/force-light-mode';
import { AdminThemeProvider } from '@/components/admin/admin-theme-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <ForceLightMode />
      <AdminAuthProvider>
        <ProtectedRoute>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ProtectedRoute>
      </AdminAuthProvider>
      <Toaster />
    </AdminThemeProvider>
  );
}
