import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Baby } from 'lucide-react';
import { childrenApi, Child, CreateChildData } from '@/api/children';
import { toast } from '@/hooks/use-toast';

const Children = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState<Partial<CreateChildData>>({});

  const familyId = localStorage.getItem('familyId');

  useEffect(() => {
    fetchChildren();
  }, [familyId]);

  const fetchChildren = async () => {
    if (!familyId) return;
    try {
      const data = await childrenApi.getAll(familyId);
      setChildren(data);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) return;

    try {
      if (editingChild) {
        await childrenApi.update(editingChild.child_id, formData);
        toast({ title: 'Child updated successfully' });
      } else {
        await childrenApi.create({ ...formData, family_id: familyId } as CreateChildData);
        toast({ title: 'Child added successfully' });
      }
      fetchChildren();
      resetForm();
    } catch (error) {
      toast({ title: 'Error saving child', variant: 'destructive' });
    }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child profile?')) return;
    try {
      await childrenApi.delete(childId);
      toast({ title: 'Child deleted successfully' });
      fetchChildren();
    } catch (error) {
      toast({ title: 'Error deleting child', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingChild(null);
    setFormData({});
  };

  const startEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      date_of_birth: child.date_of_birth,
      school: child.school,
      grade: child.grade,
      activities: child.activities,
      medical_notes: child.medical_notes,
    });
    setShowForm(true);
  };

  if (!familyId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please create a family first to add children.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Children</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingChild ? 'Edit Child' : 'Add New Child'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={formData.school || ''}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="activities">Activities</Label>
                  <Input
                    id="activities"
                    value={formData.activities || ''}
                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    placeholder="Soccer, Piano, Dance..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medical">Medical Notes (schedule-related only)</Label>
                  <Input
                    id="medical"
                    value={formData.medical_notes || ''}
                    onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                    placeholder="Allergies, regular appointments..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingChild ? 'Update' : 'Add'} Child</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No children added yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card key={child.child_id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-2xl">
                      {child.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{child.name}</h3>
                    {child.school && <p className="text-sm text-gray-600">{child.school}</p>}
                    {child.grade && <p className="text-sm text-gray-500">Grade: {child.grade}</p>}
                    {child.activities && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{child.activities}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => startEdit(child)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(child.child_id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Children;
