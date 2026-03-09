'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/lib/admin/auth-context';
import { NotificationSettings } from '@/components/admin/notification-settings';
import { PaymentSettingsForm } from '@/components/admin/payment-settings-form';
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Save,
  Loader2,
  Globe,
  Settings2,
  BellRing,
  CreditCard,
  Truck,
  Percent,
  CalendarDays,
  User,
  Key,
  Calendar,
  ShieldCheck,
  Fingerprint,
  Smartphone,
  HardDrive,
  Info,
  Moon,
  Sun,
  Palette
} from 'lucide-react';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const defaultBusinessHours: BusinessHours = {
  monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
  sunday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
};

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

interface BusinessSettings {
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyPhone?: string;
  companyEmail?: string;
  businessHours?: BusinessHours;
  baseDeliveryFee?: number;
  taxRate?: number;
  maxAdvanceBookingDays?: number;
  serviceRadiusMiles?: number;
  booking_auto_confirmation?: string;
}

interface AdminProfile {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface ProfileForm {
  username: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>({
    businessHours: defaultBusinessHours,
  });
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    username: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSettings();
    if (user) {
      setProfile(user as AdminProfile);
      setProfileForm({
        username: user.username,
        email: user.email,
      });
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        // Parse businessHours if it's a string (legacy format)
        if (typeof data.businessHours === 'string') {
          data.businessHours = defaultBusinessHours;
        } else if (!data.businessHours) {
          data.businessHours = defaultBusinessHours;
        }
        setSettings(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof BusinessSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateBusinessHours = (day: keyof BusinessHours, field: keyof DayHours, value: any) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...(prev.businessHours || defaultBusinessHours),
        [day]: {
          ...(prev.businessHours?.[day] || defaultBusinessHours[day]),
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setHasChanges(false);
        toast({
          title: "Settings saved",
          description: "Your business settings have been updated successfully.",
        });
      } else {
        toast({
          title: "Error saving settings",
          description: "There was a problem saving your settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: profile.id,
          username: profileForm.username,
          email: profileForm.email,
        }),
      });
      if (response.ok) {
        setProfile(await response.json());
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: profile?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (response.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="space-y-8">
            <div className="h-64 bg-gray-100 rounded-3xl"></div>
            <div className="h-64 bg-gray-100 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Business, payment, and account settings</p>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-[700px]">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={!hasChanges || isSaving}
              variant="default"
              size="sm"
              className="shadow-xl shadow-yellow-500/20 border-none transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Navigation / Side Info */}
            <div className="xl:col-span-4 space-y-6">
              <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl p-8 sticky top-10">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-yellow-600" />
                  Settings
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Company Info', icon: Building, color: 'text-amber-600' },
                    { label: 'Business Hours', icon: Clock, color: 'text-blue-600' },
                    { label: 'Pricing & Tax', icon: DollarSign, color: 'text-green-600' },
                    { label: 'Service Area', icon: Globe, color: 'text-indigo-600' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className={`h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center ${item.color} group-hover:bg-white group-hover:shadow-md transition-all`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-8 opacity-50" />
                <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100/50">
                  <div className="flex items-center gap-3 text-yellow-800 font-black text-xs uppercase tracking-widest mb-2">
                    <BellRing className="h-4 w-4" />
                    Note
                  </div>
                  <p className="text-xs text-yellow-700/70 font-medium leading-relaxed">Changes here affect the public website and billing.</p>
                </div>
              </Card>
            </div>

            {/* Settings Area */}
            <div className="xl:col-span-8 space-y-10">
              {/* Company Information */}
              <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-8">
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Building className="h-6 w-6 text-yellow-600" />
                    Company Information
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-medium">Your business contact information.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 text-sm">
                      <Label htmlFor="companyName" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">Company Name</Label>
                      <Input id="companyName" value={settings.companyName || ''} onChange={(e) => updateSetting('companyName', e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold" placeholder="Alley Cat Dumpsters" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <Label htmlFor="companyPhone" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">Phone</Label>
                      <Input id="companyPhone" value={settings.companyPhone || ''} onChange={(e) => updateSetting('companyPhone', e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold" placeholder="(555) 123-4567" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <Label htmlFor="companyEmail" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">Email</Label>
                    <Input id="companyEmail" value={settings.companyEmail || ''} onChange={(e) => updateSetting('companyEmail', e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold" placeholder="info@alleycatdumpsters.com" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <Label htmlFor="companyAddress" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">Address</Label>
                    <Input id="companyAddress" value={settings.companyAddress || ''} onChange={(e) => updateSetting('companyAddress', e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold" placeholder="123 Industrial Dr." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2 text-sm">
                      <Label htmlFor="companyCity" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">City</Label>
                      <Input id="companyCity" value={settings.companyCity || ''} onChange={(e) => updateSetting('companyCity', e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold" placeholder="Effingham" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <Label htmlFor="companyState" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">State</Label>
                      <Select value={settings.companyState || ''} onValueChange={(value) => updateSetting('companyState', value)}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-bold">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 text-sm">
                      <Label htmlFor="companyZip" className="font-black text-gray-700 ml-1 uppercase tracking-tighter">ZIP Code</Label>
                      <Input id="companyZip" value={settings.companyZip || ''} onChange={(e) => updateSetting('companyZip', e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold" placeholder="62401" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-8">
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                    Business Hours
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-medium">Set your operating hours for each day of the week.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
                      const dayHours = settings.businessHours?.[day] || defaultBusinessHours[day];
                      return (
                        <div key={day} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <div className="w-28">
                            <span className="font-black text-gray-700 capitalize">{day}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={dayHours.isOpen}
                              onCheckedChange={(checked) => updateBusinessHours(day, 'isOpen', checked)}
                            />
                            <span className={`text-sm font-semibold ${dayHours.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                              {dayHours.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>
                          {dayHours.isOpen && (
                            <div className="flex items-center gap-2 ml-auto">
                              <Input
                                type="time"
                                value={dayHours.openTime}
                                onChange={(e) => updateBusinessHours(day, 'openTime', e.target.value)}
                                className="h-10 w-32 rounded-xl border-gray-200 bg-white font-semibold text-center"
                              />
                              <span className="text-gray-400 font-bold">to</span>
                              <Input
                                type="time"
                                value={dayHours.closeTime}
                                onChange={(e) => updateBusinessHours(day, 'closeTime', e.target.value)}
                                className="h-10 w-32 rounded-xl border-gray-200 bg-white font-semibold text-center"
                              />
                            </div>
                          )}
                          {!dayHours.isOpen && (
                            <div className="ml-auto text-sm text-gray-400 font-medium italic">
                              Not accepting bookings
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Settings */}
              <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-8">
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-green-600" />
                    Pricing & Tax
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-medium">Default delivery fee and tax rate.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 mb-2 ml-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <Label htmlFor="baseDeliveryFee" className="font-black text-gray-700 uppercase tracking-tighter">Delivery Fee</Label>
                      </div>
                      <NumberInput id="baseDeliveryFee" value={settings.baseDeliveryFee || 0} onChange={(value) => updateSetting('baseDeliveryFee', value)} allowDecimals={true} decimalPlaces={2} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-black text-xl" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 mb-2 ml-1">
                        <Percent className="h-4 w-4 text-orange-600" />
                        <Label htmlFor="taxRate" className="font-black text-gray-700 uppercase tracking-tighter">Tax Rate (%)</Label>
                      </div>
                      <NumberInput id="taxRate" value={settings.taxRate || 0} onChange={(value) => updateSetting('taxRate', value)} allowDecimals={true} decimalPlaces={2} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-black text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operational Settings */}
              <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-8">
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Truck className="h-6 w-6 text-indigo-600" />
                    Service Area
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-medium">Booking window and service radius.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 ml-1">
                        <CalendarDays className="h-4 w-4 text-indigo-600" />
                        <Label htmlFor="maxAdvanceBookingDays" className="font-black text-gray-700 uppercase tracking-tighter text-sm">Max Advance Booking (Days)</Label>
                      </div>
                      <NumberInput id="maxAdvanceBookingDays" value={settings.maxAdvanceBookingDays || 90} onChange={(value) => updateSetting('maxAdvanceBookingDays', value)} allowDecimals={false} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-black text-xl" />
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-1">How far in advance customers can book</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 ml-1">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        <Label htmlFor="serviceRadiusMiles" className="font-black text-gray-700 uppercase tracking-tighter text-sm">Service Radius (Miles)</Label>
                      </div>
                      <NumberInput id="serviceRadiusMiles" value={settings.serviceRadiusMiles || 25} onChange={(value) => updateSetting('serviceRadiusMiles', value)} allowDecimals={false} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-black text-xl" />
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-1">Maximum delivery distance from your location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Operations */}
              <Card className="rounded-3xl border-0 shadow-lg shadow-gray-100/80 bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-2">
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                    Booking Operations
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-medium">Automation settings for new bookings.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                    <div className="space-y-1">
                      <Label className="font-black text-gray-700 uppercase tracking-tighter text-sm">Auto-Confirm New Bookings</Label>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">When enabled, new bookings skip &quot;Pending&quot; and start as &quot;Scheduled&quot; immediately</p>
                    </div>
                    <Switch
                      checked={settings.booking_auto_confirmation === 'true'}
                      onCheckedChange={(checked) => updateSetting('booking_auto_confirmation', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Floating Save Button */}
          {hasChanges && (
            <div className="fixed bottom-10 right-10 z-50 animate-in fade-in slide-in-from-bottom-5">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-gray-900 hover:bg-black text-white font-black h-16 px-10 rounded-2xl shadow-2xl transition-all active:scale-95 group"
              >
                {isSaving ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <div className="flex flex-col items-start mr-4">
                      <span className="text-[10px] uppercase tracking-widest text-yellow-500 mb-0.5 leading-none">Global Sync</span>
                      <span className="text-sm font-black">Commit All Settings</span>
                    </div>
                    <Save className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments" className="space-y-4">
          <PaymentSettingsForm />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-8">
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Palette className="h-6 w-6 text-yellow-500" />
                Website Appearance
              </CardTitle>
              <CardDescription className="text-gray-400 font-medium">
                Theme configuration for your website and admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Website Theme */}
                  <div className="rounded-2xl border-2 border-slate-700 bg-slate-800 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Moon className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-black text-white">Customer Website</h3>
                        <p className="text-sm text-slate-400">Public-facing pages</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4 text-slate-300">
                      <p>• Homepage</p>
                      <p>• Booking page</p>
                      <p>• Services & Contact pages</p>
                      <p>• Customer portal</p>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-4 py-2">
                        <Moon className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-bold text-white">Dark Mode</span>
                        <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-none text-xs">Active</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Admin Dashboard Theme */}
                  <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Sun className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Admin Dashboard</h3>
                        <p className="text-sm text-gray-500">Management interface</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4 text-gray-600">
                      <p>• Dashboard & Reports</p>
                      <p>• Bookings & Jobs management</p>
                      <p>• Customer management</p>
                      <p>• Settings & Configuration</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                        <Sun className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-bold text-gray-900">Light Mode</span>
                        <Badge className="ml-auto bg-yellow-500/20 text-yellow-700 border-none text-xs">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Fixed Theme Configuration</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        The customer-facing website uses dark mode for a modern, premium look.
                        The admin dashboard uses light mode for optimal readability during extended work sessions.
                        These themes are optimized for their respective use cases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Profile Overview */}
              <div className="lg:col-span-1">
                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden sticky top-10">
                  <div className="h-24 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                  <CardContent className="pt-0 relative">
                    <div className="flex flex-col items-center -mt-12">
                      <div className="h-24 w-24 rounded-3xl bg-white p-1 shadow-2xl">
                        <div className="h-full w-full rounded-2xl bg-gray-900 flex items-center justify-center text-yellow-500">
                          <User className="h-10 w-10" />
                        </div>
                      </div>
                      <h2 className="mt-4 text-xl font-black text-gray-900">{profile.username}</h2>
                      <Badge className="mt-1 bg-yellow-500/10 text-yellow-700 border-none font-black text-[10px] uppercase tracking-widest px-3">Primary Admin</Badge>
                    </div>

                    <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700 truncate">{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">Signed on {new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                      {profile.lastLoginAt && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50">
                          <ShieldCheck className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">Validated {new Date(profile.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-8 opacity-50" />

                    <div className="space-y-2 pb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-3">Administrative Role</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <Fingerprint className="h-4 w-4 text-yellow-600" />
                        <span>Full admin access</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Settings */}
              <div className="lg:col-span-2 space-y-10">
                {/* Account Information */}
                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-6">
                    <CardTitle className="text-xl font-black text-gray-900">Account Information</CardTitle>
                    <CardDescription className="font-medium text-gray-400">Update your account details.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="font-bold text-gray-700 ml-1">Username</Label>
                          <Input
                            id="username"
                            value={profileForm.username}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-bold text-gray-700 ml-1">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isUpdatingProfile} className="bg-yellow-500 hover:bg-yellow-600 text-black font-black h-12 px-8 rounded-xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95">
                          {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Password Change */}
                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-6">
                    <CardTitle className="flex items-center text-xl font-black text-gray-900">
                      <Key className="h-5 w-5 mr-3 text-yellow-600" />
                      Change Password
                    </CardTitle>
                    <CardDescription className="font-medium text-gray-400">
                      Update your password to keep your account secure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2 max-w-md">
                        <Label htmlFor="currentPassword" className="font-bold text-gray-700 ml-1">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="font-bold text-gray-700 ml-1">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                            required
                            minLength={8}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="font-bold text-gray-700 ml-1">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                            required
                            minLength={8}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">Complexity: Minimum 8 characters required</p>
                        <Button type="submit" disabled={isChangingPassword} className="bg-gray-900 hover:bg-black text-white font-black h-12 px-8 rounded-xl shadow-xl transition-all active:scale-95">
                          {isChangingPassword ? 'Updating...' : 'Change Password'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Account Security */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-none shadow-lg shadow-gray-100 bg-white rounded-3xl p-6 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900">Multi-Factor</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expansion Pending</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="border-none shadow-lg shadow-gray-100 bg-white rounded-3xl p-6 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <HardDrive className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900">Session Vault</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expansion Pending</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
