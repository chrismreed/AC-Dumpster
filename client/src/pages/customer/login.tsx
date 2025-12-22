import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Truck, Lock, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; accessCode: string }) => {
      const response = await apiRequest("POST", "/api/customer/login", credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
      setLocation("/customer/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !accessCode) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and access code.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, accessCode });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-[#f7c948]/10 rounded-full w-fit">
            <Truck className="h-8 w-8 text-[#f7c948]" />
          </div>
          <CardTitle className="text-2xl font-bold">Customer Portal</CardTitle>
          <CardDescription>
            Sign in to manage your dumpster rentals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                Access Code
              </Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="6-digit code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                maxLength={6}
                data-testid="input-access-code"
              />
              <p className="text-xs text-gray-500">
                Enter the 6-digit access code provided by the rental company
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#f7c948] text-black hover:bg-[#f7c948]/90"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Don't have an access code?</p>
            <p className="mt-1">
              Contact us at <a href="tel:(217)994-2582" className="text-[#f7c948] hover:underline">(217) 994-2582</a> to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
