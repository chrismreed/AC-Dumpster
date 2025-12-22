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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Users, Key, Copy, Check, UserCheck, UserX, Mail } from "lucide-react";
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

interface UniqueCustomer {
  email: string;
  name: string;
  bookingCount: number;
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
  const [createMode, setCreateMode] = useState<"picker" | "manual">("picker");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [newAccountId, setNewAccountId] = useState<number | null>(null);

  const { data: accounts, isLoading } = useQuery<CustomerAccount[]>({
    queryKey: ["/api/admin/customer-accounts"],
  });

  const { data: uniqueCustomers } = useQuery<UniqueCustomer[]>({
    queryKey: ["/api/admin/unique-customers"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unique-customers"] });
      setIsCreateDialogOpen(false);
      setEmail("");
      setCompanyName("");
      setSelectedCustomer("");
      setNewAccountCode(data.plainAccessCode);
      setNewAccountEmail(data.email);
      setNewAccountId(data.id);
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
      setNewAccountId(accounts?.find(a => a.email === data.email)?.id || null);
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

  const sendCredentialsMutation = useMutation({
    mutationFn: async ({ id, accessCode }: { id: number; accessCode: string }) => {
      const response = await apiRequest("POST", `/api/admin/customer-accounts/${id}/send-credentials`, {
        accessCode,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Account credentials have been sent to the customer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send credentials email",
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = () => {
    let accountEmail = "";
    let accountCompanyName = "";
    
    if (createMode === "picker") {
      if (!selectedCustomer) {
        toast({
          title: "Validation Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }
      const customer = uniqueCustomers?.find(c => c.email === selectedCustomer);
      accountEmail = selectedCustomer;
      accountCompanyName = customer?.name || "";
    } else {
      if (!email.trim()) {
        toast({
          title: "Validation Error",
          description: "Email is required",
          variant: "destructive",
        });
        return;
      }
      accountEmail = email.trim();
      accountCompanyName = companyName.trim();
    }
    
    createAccountMutation.mutate({ 
      email: accountEmail, 
      companyName: accountCompanyName || undefined 
    });
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
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Create Customer Account</DialogTitle>
              <DialogDescription>
                Create a portal login for a customer. An access code will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "picker" | "manual")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="picker" data-testid="tab-picker">Select Customer</TabsTrigger>
                <TabsTrigger value="manual" data-testid="tab-manual">Enter Manually</TabsTrigger>
              </TabsList>
              
              <TabsContent value="picker" className="space-y-4 mt-4">
                {uniqueCustomers && uniqueCustomers.length > 0 ? (
                  <div>
                    <Label htmlFor="customerSelect">Select from past customers</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger id="customerSelect" data-testid="select-customer">
                        <SelectValue placeholder="Choose a customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueCustomers.map((customer) => (
                          <SelectItem key={customer.email} value={customer.email}>
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              <span className="text-xs text-muted-foreground">{customer.email} ({customer.bookingCount} booking{customer.bookingCount > 1 ? 's' : ''})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only shows customers who don't have an account yet.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>All customers already have accounts, or no bookings yet.</p>
                    <p className="text-sm mt-1">Switch to "Enter Manually" to add a new email.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4 mt-4">
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
              </TabsContent>
            </Tabs>
            
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
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (newAccountId) {
                    sendCredentialsMutation.mutate({ id: newAccountId, accessCode: newAccountCode });
                  }
                }}
                disabled={sendCredentialsMutation.isPending || !newAccountId}
                data-testid="button-send-credentials"
              >
                {sendCredentialsMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Mail className="h-4 w-4 mr-2" />Send to Customer</>
                )}
              </Button>
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
