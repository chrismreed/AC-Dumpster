import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, Key, Copy, Check, UserCheck, UserX } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CustomerAccount {
  id: number;
  email: string;
  companyName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NewAccountResponse extends CustomerAccount {
  plainAccessCode: string;
}

export default function CustomerAccountsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: accounts, isLoading } = useQuery<CustomerAccount[]>({
    queryKey: ["/api/admin/customer-accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async ({ email, companyName }: { email: string; companyName?: string }) => {
      const response = await apiRequest("POST", "/api/admin/customer-accounts", {
        email,
        companyName,
      });
      return response.json() as Promise<NewAccountResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-accounts"] });
      setIsCreateDialogOpen(false);
      setEmail("");
      setCompanyName("");
      setNewAccountCode(data.plainAccessCode);
      setNewAccountEmail(data.email);
      setIsCodeDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const toggleAccountMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/customer-accounts/${id}`, {
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-accounts"] });
      toast({
        title: "Account Updated",
        description: "Account status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/customer-accounts/${id}/regenerate-code`);
      return response.json() as Promise<{ accessCode: string; email: string }>;
    },
    onSuccess: (data) => {
      setNewAccountCode(data.accessCode);
      setNewAccountEmail(data.email);
      setIsCodeDialogOpen(true);
      toast({
        title: "Code Regenerated",
        description: "A new access code has been generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to regenerate code",
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = () => {
    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    createAccountMutation.mutate({ email: email.trim(), companyName: companyName.trim() || undefined });
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(newAccountCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeCount = accounts?.filter(a => a.isActive).length || 0;
  const totalCount = accounts?.length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Customer Accounts</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-account">
            <Plus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card data-testid="card-total-accounts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Customer portal accounts</p>
            </CardContent>
          </Card>
          <Card data-testid="card-active-accounts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Can access portal</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !accounts || accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No customer accounts yet. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                      <TableCell className="font-medium">{account.email}</TableCell>
                      <TableCell>{account.companyName || "-"}</TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(account.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => regenerateCodeMutation.mutate(account.id)}
                            disabled={regenerateCodeMutation.isPending}
                            data-testid={`button-regenerate-${account.id}`}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            New Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAccountMutation.mutate({ 
                              id: account.id, 
                              isActive: !account.isActive 
                            })}
                            disabled={toggleAccountMutation.isPending}
                            data-testid={`button-toggle-${account.id}`}
                          >
                            {account.isActive ? (
                              <><UserX className="h-4 w-4 mr-1" />Deactivate</>
                            ) : (
                              <><UserCheck className="h-4 w-4 mr-1" />Activate</>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create Customer Account</DialogTitle>
              <DialogDescription>
                Create a new portal login for a commercial customer. An access code will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@company.com"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name (optional)</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Construction"
                  data-testid="input-company-name"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAccount}
                disabled={createAccountMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createAccountMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Access Code Generated</DialogTitle>
              <DialogDescription>
                Share this code securely with the customer. They'll use it along with their email to log into the portal.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="text-sm font-medium">{newAccountEmail}</div>
              </div>
              <div>
                <Label>Access Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-md">
                    {newAccountCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    data-testid="button-copy-code"
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <strong>Important:</strong> This code will not be shown again. Make sure to save or share it now.
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsCodeDialogOpen(false)} data-testid="button-close-code-dialog">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
