import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Reminders</p>
              <p className="text-sm text-gray-500">Receive appointment reminders via email</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">Browser push notifications</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Summary</p>
              <p className="text-sm text-gray-500">Weekly email with upcoming appointments</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
          <div className="pt-4 border-t">
            <Button variant="destructive">Delete Account</Button>
            <p className="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
