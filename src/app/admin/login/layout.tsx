import { ForceLightMode } from '@/components/admin/force-light-mode';

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ForceLightMode />
      {children}
    </>
  );
}