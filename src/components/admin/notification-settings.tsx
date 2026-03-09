'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Smartphone,
  Save,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  BellRing,
  Settings2,
  History,
  MessageSquare,
} from 'lucide-react';

interface NotificationTemplate {
  id: number;
  eventType: string;
  name: string;
  description: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  availableVariables: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationLogEntry {
  id: number;
  eventType: string;
  channel: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subject: string | null;
  body: string;
  status: string;
  errorMessage: string | null;
  bookingId: number | null;
  jobId: number | null;
  swapRequestId: number | null;
  createdAt: string;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  booking_confirmed: { label: 'Booking Confirmed', color: 'bg-green-100 text-green-700', icon: '📦' },
  job_scheduled: { label: 'Job Scheduled', color: 'bg-blue-100 text-blue-700', icon: '📅' },
  driver_en_route: { label: 'Driver En Route', color: 'bg-yellow-100 text-yellow-700', icon: '🚛' },
  job_completed: { label: 'Job Completed', color: 'bg-purple-100 text-purple-700', icon: '✅' },
  swap_request_update: { label: 'Swap Request Update', color: 'bg-orange-100 text-orange-700', icon: '🔄' },
};

export function NotificationSettings() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Provider config state
  const [providerConfig, setProviderConfig] = useState({
    sendgrid_api_key: '',
    sendgrid_from_email: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_from_number: '',
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
    fetchProviderConfig();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/notifications/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        if (data.length > 0 && !activeTemplate) {
          setActiveTemplate(data[0].eventType);
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/notifications/log?limit=20');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification logs:', error);
    }
  };

  const fetchProviderConfig = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setProviderConfig({
          sendgrid_api_key: data.sendgrid_api_key || '',
          sendgrid_from_email: data.sendgrid_from_email || '',
          twilio_account_sid: data.twilio_account_sid || '',
          twilio_auth_token: data.twilio_auth_token || '',
          twilio_from_number: data.twilio_from_number || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch provider config:', error);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerConfig),
      });

      if (response.ok) {
        toast({
          title: 'Provider settings saved',
          description: 'SendGrid and Twilio credentials have been updated.',
        });
      } else {
        toast({
          title: 'Error saving settings',
          description: 'Failed to save provider settings.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error saving settings',
        description: 'Failed to save provider settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const updateTemplate = (eventType: string, field: keyof NotificationTemplate, value: any) => {
    setTemplates(prev =>
      prev.map(t => (t.eventType === eventType ? { ...t, [field]: value } : t))
    );
    setHasChanges(true);
  };

  const handleSaveTemplates = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/notifications/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templates: templates.map(t => ({
            id: t.id,
            emailEnabled: t.emailEnabled,
            smsEnabled: t.smsEnabled,
            emailSubject: t.emailSubject,
            emailBody: t.emailBody,
            smsBody: t.smsBody,
          })),
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        toast({
          title: 'Templates saved',
          description: 'Notification templates have been updated.',
        });
      } else {
        toast({
          title: 'Error saving templates',
          description: 'Failed to save notification templates.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error saving templates',
        description: 'Failed to save notification templates.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async (eventType: string) => {
    if (!testEmail && !testPhone) {
      toast({
        title: 'Missing recipient',
        description: 'Enter an email or phone number to send a test notification.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingTest(eventType);
    try {
      const response = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          email: testEmail || undefined,
          phone: testPhone || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Test sent!',
          description: `Test notification sent for "${EVENT_TYPE_LABELS[eventType]?.label || eventType}".`,
        });
        // Refresh logs
        setTimeout(fetchLogs, 2000);
      } else {
        toast({
          title: 'Test failed',
          description: 'Failed to send test notification.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Test failed',
        description: 'Failed to send test notification.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(null);
    }
  };

  const currentTemplate = templates.find(t => t.eventType === activeTemplate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[450px]">
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <History className="h-4 w-4" />
            Log
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Notification Templates</h3>
              <p className="text-sm text-gray-500">Configure email and SMS templates for each event type.</p>
            </div>
            <Button
              onClick={handleSaveTemplates}
              disabled={!hasChanges || isSaving}
              size="sm"
              className="shadow-lg shadow-yellow-500/20"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Template List */}
            <div className="xl:col-span-4 space-y-2">
              {templates.map(template => {
                const meta = EVENT_TYPE_LABELS[template.eventType];
                const isActive = activeTemplate === template.eventType;
                return (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.eventType)}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-xl'
                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta?.icon || '📨'}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {template.name}
                        </h4>
                        <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>
                          {template.description}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {template.emailEnabled && (
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-blue-50'}`}>
                            <Mail className={`h-3 w-3 ${isActive ? 'text-blue-400' : 'text-blue-500'}`} />
                          </div>
                        )}
                        {template.smsEnabled && (
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-green-50'}`}>
                            <Smartphone className={`h-3 w-3 ${isActive ? 'text-green-400' : 'text-green-500'}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Template Editor */}
            <div className="xl:col-span-8">
              {currentTemplate ? (
                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3">
                          <span className="text-2xl">{EVENT_TYPE_LABELS[currentTemplate.eventType]?.icon}</span>
                          {currentTemplate.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 font-medium mt-1">
                          {currentTemplate.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {/* Channel Toggles */}
                    <div className="flex gap-6">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex-1">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <span className="font-bold text-gray-900 text-sm">Email</span>
                        </div>
                        <Switch
                          checked={currentTemplate.emailEnabled}
                          onCheckedChange={(checked) =>
                            updateTemplate(currentTemplate.eventType, 'emailEnabled', checked)
                          }
                        />
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50/50 border border-green-100/50 flex-1">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <span className="font-bold text-gray-900 text-sm">SMS</span>
                        </div>
                        <Switch
                          checked={currentTemplate.smsEnabled}
                          onCheckedChange={(checked) =>
                            updateTemplate(currentTemplate.eventType, 'smsEnabled', checked)
                          }
                        />
                      </div>
                    </div>

                    {/* Available Variables */}
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Variables</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentTemplate.availableVariables.split(',').map(v => (
                          <code
                            key={v}
                            className="text-xs bg-white px-2 py-1 rounded-lg border border-gray-200 text-gray-700 font-mono cursor-pointer hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${v.trim()}}}`);
                              toast({ title: 'Copied!', description: `{{${v.trim()}}} copied to clipboard.` });
                            }}
                          >
                            {`{{${v.trim()}}}`}
                          </code>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Click a variable to copy it.</p>
                    </div>

                    {/* Email Template */}
                    {currentTemplate.emailEnabled && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          Email Template
                        </h4>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">Subject Line</Label>
                          <Input
                            value={currentTemplate.emailSubject}
                            onChange={(e) =>
                              updateTemplate(currentTemplate.eventType, 'emailSubject', e.target.value)
                            }
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium"
                            placeholder="Email subject..."
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">Email Body (HTML)</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowPreview(showPreview === currentTemplate.eventType ? null : currentTemplate.eventType)
                              }
                              className="text-xs gap-1"
                            >
                              {showPreview === currentTemplate.eventType ? (
                                <><EyeOff className="h-3 w-3" /> Hide Preview</>
                              ) : (
                                <><Eye className="h-3 w-3" /> Preview</>
                              )}
                            </Button>
                          </div>
                          <textarea
                            value={currentTemplate.emailBody}
                            onChange={(e) =>
                              updateTemplate(currentTemplate.eventType, 'emailBody', e.target.value)
                            }
                            rows={8}
                            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                            placeholder="<div>Your email HTML here...</div>"
                          />
                          {showPreview === currentTemplate.eventType && (
                            <div className="border rounded-2xl p-6 bg-white">
                              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Email Preview</p>
                              <div
                                className="text-sm"
                                dangerouslySetInnerHTML={{ __html: currentTemplate.emailBody }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SMS Template */}
                    {currentTemplate.smsEnabled && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-600" />
                          SMS Template
                        </h4>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">Message Body</Label>
                          <textarea
                            value={currentTemplate.smsBody}
                            onChange={(e) =>
                              updateTemplate(currentTemplate.eventType, 'smsBody', e.target.value)
                            }
                            rows={3}
                            maxLength={320}
                            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                            placeholder="SMS message text..."
                          />
                          <p className="text-xs text-gray-400 text-right">
                            {currentTemplate.smsBody.length}/320 characters
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Test Section */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Send className="h-4 w-4 text-yellow-600" />
                        Send Test Notification
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentTemplate.emailEnabled && (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500">Test Email</Label>
                            <Input
                              type="email"
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              placeholder="admin@example.com"
                              className="h-10 rounded-xl"
                            />
                          </div>
                        )}
                        {currentTemplate.smsEnabled && (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500">Test Phone</Label>
                            <Input
                              type="tel"
                              value={testPhone}
                              onChange={(e) => setTestPhone(e.target.value)}
                              placeholder="+1 (555) 123-4567"
                              className="h-10 rounded-xl"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSendTest(currentTemplate.eventType)}
                        disabled={isSendingTest === currentTemplate.eventType}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {isSendingTest === currentTemplate.eventType ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  Select a template to edit
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SendGrid Config */}
            <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b border-blue-50 px-8 py-6">
                <CardTitle className="text-lg font-black text-gray-900 flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  SendGrid (Email)
                </CardTitle>
                <CardDescription className="text-gray-400 font-medium">
                  Configure your SendGrid API key for email notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">API Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets['sendgrid_api_key'] ? 'text' : 'password'}
                      value={providerConfig.sendgrid_api_key}
                      onChange={(e) => setProviderConfig(prev => ({ ...prev, sendgrid_api_key: e.target.value }))}
                      className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-mono text-sm pr-12"
                      placeholder="SG.xxxxx..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(prev => ({ ...prev, sendgrid_api_key: !prev.sendgrid_api_key }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['sendgrid_api_key'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">From Email</Label>
                  <Input
                    type="email"
                    value={providerConfig.sendgrid_from_email}
                    onChange={(e) => setProviderConfig(prev => ({ ...prev, sendgrid_from_email: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium"
                    placeholder="noreply@alleycatdumpsters.com"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {providerConfig.sendgrid_api_key ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-700 font-medium">API key configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-700 font-medium">No API key — emails will log to console</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Twilio Config */}
            <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-green-50/50 border-b border-green-50 px-8 py-6">
                <CardTitle className="text-lg font-black text-gray-900 flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  Twilio (SMS)
                </CardTitle>
                <CardDescription className="text-gray-400 font-medium">
                  Configure your Twilio credentials for SMS notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">Account SID</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets['twilio_account_sid'] ? 'text' : 'password'}
                      value={providerConfig.twilio_account_sid}
                      onChange={(e) => setProviderConfig(prev => ({ ...prev, twilio_account_sid: e.target.value }))}
                      className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-mono text-sm pr-12"
                      placeholder="ACxxxxx..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(prev => ({ ...prev, twilio_account_sid: !prev.twilio_account_sid }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['twilio_account_sid'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">Auth Token</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets['twilio_auth_token'] ? 'text' : 'password'}
                      value={providerConfig.twilio_auth_token}
                      onChange={(e) => setProviderConfig(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                      className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-mono text-sm pr-12"
                      placeholder="Auth token..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(prev => ({ ...prev, twilio_auth_token: !prev.twilio_auth_token }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['twilio_auth_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-xs uppercase tracking-wider">From Number</Label>
                  <Input
                    value={providerConfig.twilio_from_number}
                    onChange={(e) => setProviderConfig(prev => ({ ...prev, twilio_from_number: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium"
                    placeholder="+15551234567"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {providerConfig.twilio_account_sid && providerConfig.twilio_auth_token ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-700 font-medium">Twilio configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-700 font-medium">Not configured — SMS will log to console</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="shadow-lg shadow-yellow-500/20"
            >
              {isSavingConfig ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Provider Settings
            </Button>
          </div>
        </TabsContent>

        {/* Log Tab */}
        <TabsContent value="log" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Notification Log</h3>
              <p className="text-sm text-gray-500">Recent notification delivery history.</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <History className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {logs.length === 0 ? (
            <Card className="border-none shadow-lg bg-white rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BellRing className="h-12 w-12 text-gray-200 mb-4" />
                <h4 className="font-bold text-gray-400">No notifications sent yet</h4>
                <p className="text-sm text-gray-300 mt-1">Notifications will appear here once they are sent.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const meta = EVENT_TYPE_LABELS[log.eventType];
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${
                      log.channel === 'email' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {log.channel === 'email' ? (
                        <Mail className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${meta?.color || 'bg-gray-100 text-gray-600'}`}>
                          {meta?.label || log.eventType}
                        </Badge>
                        <Badge
                          variant={log.status === 'sent' ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          {log.status === 'sent' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {log.recipientEmail || log.recipientPhone}
                        {log.subject && ` — ${log.subject}`}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5">{log.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
