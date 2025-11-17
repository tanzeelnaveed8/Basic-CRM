'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
  });

  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        email: profile.email,
      });
      loadOrganization();
    }
  }, [profile]);

  const loadOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile?.organization_id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setOrganization(data);
        setOrgForm({
          name: data.name,
          slug: data.slug,
        });
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgForm.name,
        })
        .eq('id', organization?.id);

      if (error) throw error;
      toast.success('Organization updated successfully');
      loadOrganization();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">Manage your account and organization settings</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="organization">Organization</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-slate-50"
                      />
                      <p className="text-xs text-slate-500">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        {profile?.role}
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>Manage your organization details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateOrganization} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="org_name">Organization Name</Label>
                      <Input
                        id="org_name"
                        value={orgForm.name}
                        onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org_slug">Organization Slug</Label>
                      <Input
                        id="org_slug"
                        value={orgForm.slug}
                        disabled
                        className="bg-slate-50"
                      />
                      <p className="text-xs text-slate-500">Organization slug cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Created</Label>
                      <p className="text-sm text-slate-600">
                        {organization?.created_at && new Date(organization.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>View team members in your organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{profile?.full_name || 'You'}</p>
                        <p className="text-sm text-slate-600">{profile?.email}</p>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {profile?.role}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">
                      Team member management coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
