'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAdminAuth } from '@/lib/admin/auth-context';
import { User, Mail, Key, Save, Shield, Calendar, ShieldCheck, Fingerprint, LogOut, HardDrive, Smartphone } from 'lucide-react';

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

export default function AdminProfilePage() {
  const { user } = useAdminAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    if (user) {
      setProfile(user as AdminProfile);
      setProfileForm({
        username: user.username,
        email: user.email,
      });
      setIsLoading(false);
    }
  }, [user]);

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
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="h-96 bg-gray-100 rounded-3xl"></div>
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 bg-gray-100 rounded-3xl"></div>
              <div className="h-64 bg-gray-100 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="mb-3 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage your account and security settings</p>
      </div>

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
    </div>
  );
}