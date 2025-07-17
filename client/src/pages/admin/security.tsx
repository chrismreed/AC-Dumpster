import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Key, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SecurityPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/admin/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      setPasswordChanged(true);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and authentication settings.
          </p>
        </div>

        {/* Security Warning */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Security Notice:</strong> If you're using the default password "admin123", 
            please change it immediately for security reasons.
          </AlertDescription>
        </Alert>

        {/* Password Change Success */}
        {passwordChanged && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Password changed successfully! Your account is now more secure.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure. Use a strong password 
                with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your current password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your new password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters with uppercase, lowercase, numbers, and special characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your new password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Changing Password..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Security Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use a unique password that you don't use for other accounts</li>
                <li>• Include a mix of uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid using personal information like names or birthdays</li>
                <li>• Consider using a password manager to generate and store secure passwords</li>
                <li>• Log out of the admin panel when finished working</li>
                <li>• Regularly update your password for maximum security</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}