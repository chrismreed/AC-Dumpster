import { ReactNode } from "react";
import { AdminNav } from "./admin-nav";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">You don't have permission to access the admin dashboard.</p>
        <a href="/" className="text-primary hover:underline">Return to Home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray flex">
      <AdminNav />
      <div className="flex-1 p-8 admin-content">
        {children}
      </div>
    </div>
  );
}
