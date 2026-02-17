/**
 * Booking layout - applies light styling directly to the booking pages.
 * Since the booking form uses explicit colors (bg-white, text-gray-900, etc.),
 * we don't need to manipulate the theme context.
 */
export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
