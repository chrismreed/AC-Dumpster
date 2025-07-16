import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LegalDocument, insertLegalDocumentSchema } from "@shared/schema";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit3, Trash2, FileText, Shield, Eye, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

// Create form schema without the date transformation for form handling
const formSchema = z.object({
  type: z.enum(["terms_of_service", "privacy_policy"]),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  version: z.string().min(1, "Version is required"),
  isActive: z.boolean().default(true),
  effectiveDate: z.string().min(1, "Effective date is required"),
  createdBy: z.number().default(1), // Will be set to current user ID
});

type LegalDocumentFormData = z.infer<typeof formSchema>;

export default function LegalDocumentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<LegalDocument[]>({
    queryKey: ["/api/legal-documents"],
  });

  const form = useForm<LegalDocumentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "terms_of_service",
      title: "",
      content: "",
      version: "1.0",
      isActive: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      createdBy: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LegalDocumentFormData) => {
      // Validate with the proper schema before sending
      const validatedData = insertLegalDocumentSchema.parse(data);
      const response = await apiRequest("POST", "/api/legal-documents", validatedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      setIsDialogOpen(false);
      setEditingDocument(null);
      form.reset();
      toast({ title: "Success", description: "Legal document created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LegalDocumentFormData) => {
      // Validate with the proper schema before sending
      const validatedData = insertLegalDocumentSchema.parse(data);
      const response = await apiRequest("PUT", `/api/legal-documents/${editingDocument?.id}`, validatedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      setIsDialogOpen(false);
      setEditingDocument(null);
      form.reset();
      toast({ title: "Success", description: "Legal document updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/legal-documents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({ title: "Success", description: "Legal document deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (data: LegalDocumentFormData) => {
    if (editingDocument) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (document: LegalDocument) => {
    setEditingDocument(document);
    form.reset({
      type: document.type as "terms_of_service" | "privacy_policy",
      title: document.title,
      content: document.content,
      version: document.version,
      isActive: document.isActive,
      effectiveDate: new Date(document.effectiveDate).toISOString().split('T')[0],
      createdBy: document.createdBy,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this legal document?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewDocument = () => {
    setEditingDocument(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "terms_of_service":
        return <FileText className="h-4 w-4" />;
      case "privacy_policy":
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "terms_of_service":
        return "Terms of Service";
      case "privacy_policy":
        return "Privacy Policy";
      default:
        return type;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Legal Documents</h2>
            <p className="text-neutral-600">Manage terms of service and privacy policy</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewDocument} className="bg-[#f7c948] text-[#2c2c2c] hover:bg-[#e6b93d]">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? "Edit Legal Document" : "Add New Legal Document"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="terms_of_service">Terms of Service</SelectItem>
                            <SelectItem value="privacy_policy">Privacy Policy</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1.0, 2.1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Terms of Service" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effectiveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter the legal document content..."
                          className="min-h-[300px] resize-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-[#f7c948] text-[#2c2c2c] hover:bg-[#e6b93d]"
                  >
                    {editingDocument ? "Update Document" : "Create Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <Card key={document.id} className="border-neutral-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(document.type)}
                    <CardTitle className="text-lg font-semibold text-neutral-800">
                      {document.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={document.isActive ? "default" : "secondary"}>
                      {document.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">v{document.version}</Badge>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">
                  {getDocumentTypeLabel(document.type)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <Calendar className="h-4 w-4" />
                    <span>Effective: {new Date(document.effectiveDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    <div className="max-h-16 overflow-hidden">
                      {document.content.substring(0, 100)}...
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(document)}
                        className="border-neutral-200 hover:bg-neutral-50"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <Card className="border-dashed border-2 border-neutral-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-600 mb-2">
              No legal documents found
            </h3>
            <p className="text-neutral-500 text-center mb-4">
              Create your first legal document to get started
            </p>
            <Button onClick={handleNewDocument} className="bg-[#f7c948] text-[#2c2c2c] hover:bg-[#e6b93d]">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  );
}