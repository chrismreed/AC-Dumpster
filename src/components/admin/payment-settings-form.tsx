'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Zap,
  Lock,
  AlertTriangle,
} from 'lucide-react';

interface PaymentSettings {
  payment_provider: string;
  payment_test_mode: string;
  payment_currency: string;
  payment_stripe_enabled: string;
  payment_square_enabled: string;
  // Stripe
  payment_stripe_secret_key: string;
  payment_stripe_publishable_key: string;
  payment_stripe_webhook_secret: string;
  has_payment_stripe_secret_key?: boolean;
  has_payment_stripe_webhook_secret?: boolean;
  stripe_secret_key_source?: string;
  stripe_publishable_key_source?: string;
  stripe_webhook_secret_source?: string;
  // Square
  payment_square_access_token: string;
  payment_square_application_id: string;
  payment_square_location_id: string;
  payment_square_environment: string;
  has_payment_square_access_token?: boolean;
}

const CURRENCIES = [
  { value: 'usd', label: 'USD - US Dollar' },
  { value: 'cad', label: 'CAD - Canadian Dollar' },
  { value: 'gbp', label: 'GBP - British Pound' },
  { value: 'eur', label: 'EUR - Euro' },
  { value: 'aud', label: 'AUD - Australian Dollar' },
];

export function PaymentSettingsForm() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PaymentSettings>({
    payment_provider: 'stripe',
    payment_test_mode: 'false',
    payment_currency: 'usd',
    payment_stripe_enabled: 'false',
    payment_square_enabled: 'false',
    payment_stripe_secret_key: '',
    payment_stripe_publishable_key: '',
    payment_stripe_webhook_secret: '',
    payment_square_access_token: '',
    payment_square_application_id: '',
    payment_square_location_id: '',
    payment_square_environment: 'sandbox',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch payment settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (validate = false) => {
    // Pre-flight: ensure credentials exist before testing connection
    if (validate) {
      const provider = settings.payment_provider || 'stripe';
      const hasReal = (val: string) => val && !val.includes('••••');

      if (provider === 'stripe' && !hasReal(settings.payment_stripe_secret_key)) {
        toast({
          title: 'Missing credentials',
          description: 'Please enter your Stripe secret key before testing the connection.',
          variant: 'destructive',
        });
        return;
      }
      if (provider === 'square' && !hasReal(settings.payment_square_access_token)) {
        toast({
          title: 'Missing credentials',
          description: 'Please enter your Square access token before testing the connection.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (validate) {
      setIsTesting(true);
    } else {
      setIsSaving(true);
    }

    try {
      const response = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, validate }),
      });

      const data = await response.json();

      if (response.ok) {
        setHasChanges(false);
        toast({
          title: validate ? 'Connection verified & saved' : 'Payment settings saved',
          description: validate
            ? 'Your payment credentials are valid and have been saved.'
            : 'Payment configuration has been updated successfully.',
        });
        // Refresh to get masked values
        fetchSettings();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save payment settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save payment settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const stripeEnabled = settings.payment_stripe_enabled === 'true';
  const squareEnabled = settings.payment_square_enabled === 'true';
  const isTestMode = settings.payment_test_mode === 'true';
  const noneEnabled = !stripeEnabled && !squareEnabled;
  const bothEnabled = stripeEnabled && squareEnabled;

  // Auto-set primary provider when only one is enabled
  const effectiveProvider = (() => {
    if (noneEnabled) return 'none';
    if (stripeEnabled && !squareEnabled) return 'stripe';
    if (squareEnabled && !stripeEnabled) return 'square';
    return settings.payment_provider || 'stripe';
  })();

  // Show config sections for enabled providers
  const showStripeConfig = stripeEnabled;
  const showSquareConfig = squareEnabled;

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-8">
          <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-green-600" />
            Payment Providers
          </CardTitle>
          <CardDescription className="text-gray-400 font-medium">
            Enable or disable payment providers. You can configure credentials for each without activating them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {/* No providers enabled warning */}
          {noneEnabled && (
            <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 text-sm mb-1">No Payment Provider Enabled</h3>
                  <p className="text-xs text-amber-700">
                    Online payments are disabled. Customers will not be able to pay on the booking page.
                    Enable at least one provider to accept payments.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe Card */}
            <div
              className={`p-6 rounded-2xl border-2 transition-all ${
                stripeEnabled
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                  : 'border-gray-300 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    stripeEnabled ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`font-black ${stripeEnabled ? 'text-gray-900' : 'text-gray-500'}`}>Stripe</h3>
                    <p className="text-xs text-gray-500">Cards, ACH, Wallets</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {stripeEnabled && effectiveProvider === 'stripe' && (
                    <Badge className="bg-indigo-500 text-white text-xs">Primary</Badge>
                  )}
                  <Switch
                    checked={stripeEnabled}
                    className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400 data-[state=checked]:bg-indigo-500"
                    onCheckedChange={(checked) => {
                      updateField('payment_stripe_enabled', checked ? 'true' : 'false');
                      // If enabling and it's the only one, make it primary
                      if (checked && !squareEnabled) {
                        updateField('payment_provider', 'stripe');
                      }
                      // If disabling and Square is enabled, switch primary to Square
                      if (!checked && squareEnabled) {
                        updateField('payment_provider', 'square');
                      }
                    }}
                  />
                </div>
              </div>
              <p className={`text-sm ${stripeEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                Accept credit cards, debit cards, ACH transfers, and digital wallets.
              </p>
            </div>

            {/* Square Card */}
            <div
              className={`p-6 rounded-2xl border-2 transition-all ${
                squareEnabled
                  ? 'border-green-500 bg-green-50/50 shadow-lg shadow-green-100'
                  : 'border-gray-300 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    squareEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`font-black ${squareEnabled ? 'text-gray-900' : 'text-gray-500'}`}>Square</h3>
                    <p className="text-xs text-gray-500">Cards, Invoices, POS</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {squareEnabled && effectiveProvider === 'square' && (
                    <Badge className="bg-green-500 text-white text-xs">Primary</Badge>
                  )}
                  <Switch
                    checked={squareEnabled}
                    className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400 data-[state=checked]:bg-green-500"
                    onCheckedChange={(checked) => {
                      updateField('payment_square_enabled', checked ? 'true' : 'false');
                      if (checked && !stripeEnabled) {
                        updateField('payment_provider', 'square');
                      }
                      if (!checked && stripeEnabled) {
                        updateField('payment_provider', 'stripe');
                      }
                    }}
                  />
                </div>
              </div>
              <p className={`text-sm ${squareEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                Accept payments with Square including in-person POS and online.
              </p>
            </div>
          </div>

          {/* Primary provider selector — only when both are enabled */}
          {bothEnabled && (
            <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-gray-50/50">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm mb-3 block">
                Primary Provider (used at checkout)
              </Label>
              <Select
                value={settings.payment_provider || 'stripe'}
                onValueChange={(v) => updateField('payment_provider', v)}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode & Currency */}
      <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-6">
          <CardTitle className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Shield className="h-5 w-5 text-orange-500" />
            Payment Mode & Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Test Mode Toggle */}
            <div className="space-y-3">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Environment</Label>
              <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                isTestMode ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
              }`}>
                <Switch
                  checked={!isTestMode}
                  className="data-[state=unchecked]:bg-orange-400 data-[state=checked]:bg-green-500"
                  onCheckedChange={(checked) => updateField('payment_test_mode', checked ? 'false' : 'true')}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">
                      {isTestMode ? 'Test Mode' : 'Live Mode'}
                    </span>
                    <Badge variant="secondary" className={
                      isTestMode ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                    }>
                      {isTestMode ? 'Testing' : 'Production'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isTestMode
                      ? 'No real charges will be processed. Use test credentials.'
                      : 'Real payments will be processed. Use live credentials.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-3">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Currency</Label>
              <Select value={settings.payment_currency} onValueChange={(v) => updateField('payment_currency', v)}>
                <SelectTrigger className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:ring-green-500/20 font-bold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Configuration */}
      {showStripeConfig && (
        <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100/50 px-8 py-8">
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              Stripe Configuration
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Enter your Stripe API credentials. Find them at{' '}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 underline">dashboard.stripe.com/apikeys</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Publishable Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Publishable Key</Label>
                {settings.payment_stripe_publishable_key && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-semibold">
                      Configured{settings.stripe_publishable_key_source === 'env' ? ' (env var)' : ''}
                    </span>
                  </div>
                )}
              </div>
              <Input
                type="text"
                value={settings.payment_stripe_publishable_key}
                onChange={(e) => updateField('payment_stripe_publishable_key', e.target.value)}
                placeholder="pk_test_..."
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white font-mono text-sm"
              />
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Secret Key
                </Label>
                {settings.has_payment_stripe_secret_key && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-semibold">
                      Configured{settings.stripe_secret_key_source === 'env' ? ' (env var)' : ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showSecrets['stripe_secret'] ? 'text' : 'password'}
                  value={settings.payment_stripe_secret_key}
                  onChange={(e) => updateField('payment_stripe_secret_key', e.target.value)}
                  placeholder="sk_test_..."
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white font-mono text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('stripe_secret')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets['stripe_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Webhook Secret
                </Label>
                {settings.has_payment_stripe_webhook_secret && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-semibold">
                      Configured{settings.stripe_webhook_secret_source === 'env' ? ' (env var)' : ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showSecrets['stripe_webhook'] ? 'text' : 'password'}
                  value={settings.payment_stripe_webhook_secret}
                  onChange={(e) => updateField('payment_stripe_webhook_secret', e.target.value)}
                  placeholder="whsec_..."
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white font-mono text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('stripe_webhook')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets['stripe_webhook'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-indigo-900 text-sm mb-1">Encrypted Storage</h3>
                  <p className="text-xs text-indigo-700">
                    Secret keys are encrypted with AES-256-GCM before being stored in the database.
                    They are never displayed in full after saving.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Square Configuration */}
      {showSquareConfig && (
        <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-green-50/50 border-b border-green-100/50 px-8 py-8">
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-500 text-white flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              Square Configuration
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Enter your Square API credentials. Find them at{' '}
              <a href="https://developer.squareup.com/apps" target="_blank" rel="noopener noreferrer"
                className="text-green-600 underline">developer.squareup.com</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Application ID */}
            <div className="space-y-2">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Application ID</Label>
              <Input
                type="text"
                value={settings.payment_square_application_id}
                onChange={(e) => updateField('payment_square_application_id', e.target.value)}
                placeholder="sandbox-sq0idb-..."
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white font-mono text-sm"
              />
            </div>

            {/* Access Token */}
            <div className="space-y-2">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" /> Access Token
              </Label>
              <div className="relative">
                <Input
                  type={showSecrets['square_token'] ? 'text' : 'password'}
                  value={settings.payment_square_access_token}
                  onChange={(e) => updateField('payment_square_access_token', e.target.value)}
                  placeholder="EAAAl..."
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white font-mono text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('square_token')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets['square_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Location ID */}
            <div className="space-y-2">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Location ID</Label>
              <Input
                type="text"
                value={settings.payment_square_location_id}
                onChange={(e) => updateField('payment_square_location_id', e.target.value)}
                placeholder="L..."
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white font-mono text-sm"
              />
            </div>

            {/* Square Environment */}
            <div className="space-y-2">
              <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Environment</Label>
              <Select
                value={settings.payment_square_environment}
                onValueChange={(v) => updateField('payment_square_environment', v)}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Security Notice */}
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-900 text-sm mb-1">Encrypted Storage</h3>
                  <p className="text-xs text-green-700">
                    Access tokens are encrypted with AES-256-GCM before being stored in the database.
                    They are never displayed in full after saving.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={isTesting || isSaving}
            className="h-12 px-6 rounded-xl font-bold"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Test Connection & Save
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving || isTesting}
            className="h-12 px-8 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
