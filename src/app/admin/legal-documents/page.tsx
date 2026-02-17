'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, FileText, Edit, Eye, Trash2, Calendar, ShieldCheck, FileCheck, ScrollText, History, Info } from 'lucide-react';

interface LegalDocument {
  id: number;
  title: string;
  type: 'terms' | 'privacy' | 'contract' | 'policy' | 'other';
  content: string;
  version: string;
  isActive: boolean;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DocumentForm {
  title: string;
  type: 'terms' | 'privacy' | 'contract' | 'policy' | 'other';
  content: string;
  version: string;
  isActive: boolean;
  isRequired: boolean;
}

export default function AdminLegalDocumentsPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<LegalDocument | null>(null);
  const [documentForm, setDocumentForm] = useState<DocumentForm>({
    title: '',
    type: 'terms',
    content: '',
    version: '1.0',
    isActive: true,
    isRequired: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, typeFilter, statusFilter]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/legal-documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== 'all') filtered = filtered.filter(doc => doc.type === typeFilter);
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') filtered = filtered.filter(doc => doc.isActive);
      else if (statusFilter === 'required') filtered = filtered.filter(doc => doc.isRequired);
    }
    setFilteredDocuments(filtered);
  };

  const resetForm = () => {
    setDocumentForm({
      title: '',
      type: 'terms',
      content: '',
      version: '1.0',
      isActive: true,
      isRequired: false,
    });
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/legal-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentForm),
      });
      if (response.ok) {
        await fetchDocuments();
        resetForm();
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDocument = (document: LegalDocument) => {
    setEditingDocument(document);
    setDocumentForm({
      title: document.title,
      type: document.type,
      content: document.content,
      version: document.version,
      isActive: document.isActive,
      isRequired: document.isRequired,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/legal-documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentForm),
      });
      if (response.ok) {
        await fetchDocuments();
        setIsEditDialogOpen(false);
        setEditingDocument(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDocument = (document: LegalDocument) => {
    setViewingDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Permanently delete this legal document?')) return;
    try {
      const response = await fetch(`/api/admin/legal-documents/${documentId}`, { method: 'DELETE' });
      if (response.ok) await fetchDocuments();
    } catch (error) { console.error(error); }
  };

  const formatDocumentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl shadow-sm"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-3xl shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Legal Center</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage agreements, policies, and regulatory documentation</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent forceLight className="sm:max-w-[800px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col bg-white text-gray-900">
            <div className="bg-gray-50/50 px-8 py-8 border-b border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900">Draft Legal Document</DialogTitle>
                <DialogDescription className="font-medium text-gray-500 italic">Create a new version of yours terms or privacy policies.</DialogDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleCreateDocument} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="docTitle" className="font-bold text-gray-700 ml-1">Document Title</Label>
                  <Input id="docTitle" value={documentForm.title} onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))} className="h-12 rounded-xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-medium" placeholder="Terms of Service" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docVersion" className="font-bold text-gray-700 ml-1">Version String</Label>
                  <Input id="docVersion" value={documentForm.version} onChange={(e) => setDocumentForm(prev => ({ ...prev, version: e.target.value }))} className="h-12 rounded-xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-medium" placeholder="1.0.0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docType" className="font-bold text-gray-700 ml-1">Categorization</Label>
                  <Select value={documentForm.type} onValueChange={(value: any) => setDocumentForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="terms">Terms of Service</SelectItem>
                      <SelectItem value="privacy">Privacy Policy</SelectItem>
                      <SelectItem value="contract">Service Contract</SelectItem>
                      <SelectItem value="policy">Internal Policy</SelectItem>
                      <SelectItem value="other">Compliance Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 flex gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="docActive"
                      checked={documentForm.isActive}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                    />
                    <Label htmlFor="docActive" className="font-bold text-gray-700 cursor-pointer">Active (Published)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="docRequired"
                      checked={documentForm.isRequired}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                    />
                    <Label htmlFor="docRequired" className="font-bold text-gray-700 cursor-pointer">Requires Signature</Label>
                  </div>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="docContent" className="font-bold text-gray-700 ml-1">Full Content</Label>
                  <Textarea id="docContent" value={documentForm.content} onChange={(e) => setDocumentForm(prev => ({ ...prev, content: e.target.value }))} className="rounded-2xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-medium py-4 min-h-[200px]" placeholder="Paste full markdown or textile content here..." required />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Publishing...' : 'Publish Document'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <ScrollText className="h-16 w-16 text-yellow-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Total Bundle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{documents.length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 w-fit px-2 py-1 rounded-full">Legal items</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-16 w-16 text-green-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{documents.filter(d => d.isActive).length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">Published & live</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <FileCheck className="h-16 w-16 text-rose-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Mandatory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{documents.filter(d => d.isRequired).length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-2 py-1 rounded-full">Required signature</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <History className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Latest Ver.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">
              {documents.length > 0 ? (Math.max(...documents.map(d => parseFloat(d.version) || 0)).toFixed(1)) : '0.0'}
            </div>
            <div className="flex items-center mt-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">Highest revision</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-lg shadow-gray-100 bg-white rounded-2xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                <Input placeholder="Search document titles or content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-bold" />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-bold text-xs uppercase tracking-widest">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                  <SelectItem value="all">Every Document</SelectItem>
                  <SelectItem value="terms">Terms of Service</SelectItem>
                  <SelectItem value="privacy">Privacy Policy</SelectItem>
                  <SelectItem value="contract">Rental Contracts</SelectItem>
                  <SelectItem value="policy">Internal Polices</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-bold text-xs uppercase tracking-widest">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                  <SelectItem value="all">Any Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="required">Mandatory Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50">
          <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Legal Documents</CardTitle>
          <CardDescription className="font-medium">{filteredDocuments.length} documents</CardDescription>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/30">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-fit mx-auto mb-6">
                  <ScrollText className="h-12 w-12 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No Documents Found</h3>
                <p className="text-gray-500 font-medium">No documents match your search.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-50">
                    <TableHead className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Title</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Type</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Version</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="px-8 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="group hover:bg-gray-50/50 border-gray-50 transition-colors">
                      <TableCell className="px-8 font-black text-gray-300 text-xs">#{doc.id}</TableCell>
                      <TableCell className="py-6 min-w-[300px]">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 group-hover:text-yellow-600 transition-all truncate">{doc.title}</span>
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Last Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-none px-2.5 py-1 rounded-lg ${doc.type === 'terms' ? 'bg-amber-50 text-amber-600' :
                            doc.type === 'privacy' ? 'bg-blue-50 text-blue-600' :
                              doc.type === 'contract' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {formatDocumentType(doc.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-gray-900 text-sm">v{doc.version}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className={`font-black uppercase tracking-widest text-[10px] border px-2 py-0.5 rounded-lg w-fit ${doc.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {doc.isActive ? 'Active' : 'Archived'}
                          </Badge>
                          {doc.isRequired && (
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                              <Info className="h-2 w-2" /> Signature Required
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc)} className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditDocument(doc)} className="h-9 w-9 rounded-xl hover:bg-yellow-50 hover:text-yellow-600 transition-all">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id)} className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent forceLight className="sm:max-w-[800px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] bg-white text-gray-900">
          <div className="bg-gray-50/50 px-8 py-8 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <ScrollText className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">{viewingDocument?.title}</DialogTitle>
                <DialogDescription className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mt-1">Version {viewingDocument?.version} • {viewingDocument?.type}</DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-10 overflow-y-auto bg-white">
            <div className="prose prose-sm prose-gray max-w-none text-gray-700 font-medium leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-xl p-6">{viewingDocument?.content}</pre>
            </div>
          </div>
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button onClick={() => setIsViewDialogOpen(false)} className="rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 transition-all shadow-sm">Dismiss Reader</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent forceLight className="sm:max-w-[800px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col bg-white text-gray-900">
          <div className="bg-gray-50/50 px-8 py-8 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900">Edit Document</DialogTitle>
              <DialogDescription className="font-medium text-gray-500">Update document content and version.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleUpdateDocument} className="p-8 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="editTitle" className="font-bold text-gray-700 ml-1">Title</Label>
                <Input id="editTitle" value={documentForm.title} onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))} className="h-12 rounded-xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-medium" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editVersion" className="font-bold text-gray-700 ml-1">Version</Label>
                <Input id="editVersion" value={documentForm.version} onChange={(e) => setDocumentForm(prev => ({ ...prev, version: e.target.value }))} className="h-12 rounded-xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-medium" required />
              </div>
              <div className="md:col-span-3 flex gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={documentForm.isActive}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <Label htmlFor="editActive" className="font-bold text-gray-700 cursor-pointer">Active (Published)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editRequired"
                    checked={documentForm.isRequired}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                  />
                  <Label htmlFor="editRequired" className="font-bold text-gray-700 cursor-pointer">Requires Signature</Label>
                </div>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="editContent" className="font-bold text-gray-700 ml-1">Content</Label>
                <Textarea id="editContent" value={documentForm.content} onChange={(e) => setDocumentForm(prev => ({ ...prev, content: e.target.value }))} className="rounded-2xl border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-400 transition-all font-medium py-4 min-h-[300px]" required />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg transition-all">
                {isSubmitting ? 'Updating...' : 'Update Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}