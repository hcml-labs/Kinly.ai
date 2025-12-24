import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, UserPlus, Trash2 } from 'lucide-react';
import { familyApi, Family } from '@/api/family';
import { toast } from '@/hooks/use-toast';

const FamilyPage = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('view_only');

  const currentFamilyId = localStorage.getItem('familyId');

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const data = await familyApi.getAll();
      setFamilies(data);
      if (data.length > 0 && !currentFamilyId) {
        localStorage.setItem('familyId', data[0].family_id);
      }
    } catch (error) {
      console.error('Error fetching families:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFamily = await familyApi.create(newFamilyName);
      localStorage.setItem('familyId', newFamily.family_id);
      toast({ title: 'Family created successfully!' });
      fetchFamilies();
      setShowCreateForm(false);
      setNewFamilyName('');
    } catch (error) {
      toast({ title: 'Error creating family', variant: 'destructive' });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamilyId) return;
    try {
      await familyApi.inviteMember(currentFamilyId, inviteEmail, inviteRole);
      toast({ title: 'Member invited successfully!' });
      fetchFamilies();
      setShowInviteForm(false);
      setInviteEmail('');
    } catch (error: any) {
      toast({
        title: 'Error inviting member',
        description: error.response?.data?.detail || 'Could not invite member',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentFamilyId) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await familyApi.removeMember(currentFamilyId, memberId);
      toast({ title: 'Member removed successfully' });
      fetchFamilies();
    } catch (error) {
      toast({ title: 'Error removing member', variant: 'destructive' });
    }
  };

  const selectFamily = (familyId: string) => {
    localStorage.setItem('familyId', familyId);
    window.location.reload();
  };

  const currentFamily = families.find((f) => f.family_id === currentFamilyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Family</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Family
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Family</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Family</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Family Yet</h2>
            <p className="text-gray-500 mb-4">Create your family to start managing appointments.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your Family
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {families.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Families</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {families.map((family) => (
                    <Button
                      key={family.family_id}
                      variant={family.family_id === currentFamilyId ? 'default' : 'outline'}
                      onClick={() => selectFamily(family.family_id)}
                    >
                      {family.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentFamily && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{currentFamily.name}</CardTitle>
                <Button onClick={() => setShowInviteForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                {showInviteForm && (
                  <form onSubmit={handleInvite} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="member@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="view_only">View Only</option>
                          <option value="add_only">Can Add</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button type="submit">Invite</Button>
                        <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                )}

                <h3 className="font-semibold mb-4">Members</h3>
                <div className="space-y-3">
                  {currentFamily.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {member.user_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.user_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{member.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                          {member.role.replace('_', ' ')}
                        </span>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default FamilyPage;
