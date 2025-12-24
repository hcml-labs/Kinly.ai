import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { appointmentsApi, CreateAppointmentData, AppointmentCategory } from '@/api/appointments';
import { childrenApi, Child } from '@/api/children';
import { toast } from '@/hooks/use-toast';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const { id: appointmentId } = useParams<{ id: string }>();
  const isEditMode = Boolean(appointmentId);

  const [children, setChildren] = useState<Child[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAppointmentData>>({
    category: 'personal',
  });

  const familyId = localStorage.getItem('familyId');
  const categories: AppointmentCategory[] = ['school', 'health', 'activity', 'personal'];

  // Load children
  useEffect(() => {
    if (familyId) {
      childrenApi.getAll(familyId).then(setChildren).catch(console.error);
    }
  }, [familyId]);

  // Load existing appointment if editing
  useEffect(() => {
    if (isEditMode && appointmentId) {
      appointmentsApi
        .getById(appointmentId)
        .then((appt) => {
          setFormData({
            title: appt.title,
            description: appt.description,
            category: appt.category,
            child_id: appt.child_id,
            start_time: appt.start_time,
            end_time: appt.end_time,
            location: appt.location,
            recurrence_rule: appt.recurrence_rule,
          });
        })
        .catch(() => {
          toast({ title: 'Failed to load appointment', variant: 'destructive' });
          navigate('/appointments');
        });
    }
  }, [appointmentId, isEditMode, navigate]);

  // Conflict check
  const checkConflicts = async () => {
    if (!familyId || !formData.start_time || !formData.end_time) return;
    try {
      const result = await appointmentsApi.checkConflicts(
        familyId,
        formData.start_time,
        formData.end_time,
        formData.child_id,
        appointmentId // ignore current appointment if editing
      );
      setConflicts(result.conflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      checkConflicts();
    }
  }, [formData.start_time, formData.end_time, formData.child_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) return;

    setIsSubmitting(true);

    try {
      if (isEditMode && appointmentId) {
        await appointmentsApi.update(appointmentId, {
          ...formData,
          family_id: familyId,
        });
        toast({ title: 'Appointment updated successfully!' });
      } else {
        await appointmentsApi.create({
          ...formData,
          family_id: familyId,
        } as CreateAppointmentData);
        toast({ title: 'Appointment created successfully!' });
      }

      navigate('/appointments');
    } catch {
      toast({
        title: isEditMode ? 'Error updating appointment' : 'Error creating appointment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!familyId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please create a family first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Appointment' : 'New Appointment'}</h1>
      </div>

      {conflicts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Schedule Conflict Detected</p>
                <p className="text-sm text-orange-700">
                  This time overlaps with {conflicts.length} existing appointment(s):
                </p>
                <ul className="text-sm text-orange-700 mt-1">
                  {conflicts.slice(0, 3).map((c) => (
                    <li key={c.appointment_id}>• {c.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Doctor's appointment, Soccer practice..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category || 'personal'}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as AppointmentCategory })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="child">Child (optional)</Label>
                <select
                  id="child"
                  value={formData.child_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, child_id: e.target.value || undefined })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Family-wide</option>
                  {children.map((child) => (
                    <option key={child.child_id} value={child.child_id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Time *</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start_time ? new Date(formData.start_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const localDate = new Date(e.target.value);
                    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                    setFormData({ ...formData, start_time: utcDate.toISOString() });
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">End Time *</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end_time ? new Date(formData.end_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const localDate = new Date(e.target.value);
                    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                    setFormData({ ...formData, end_time: utcDate.toISOString() });
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="123 Main St, City..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence (iCal format)</Label>
              <Input
                id="recurrence"
                value={formData.recurrence_rule || ''}
                onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                placeholder="FREQ=WEEKLY;BYDAY=TU"
              />
              <p className="text-xs text-gray-500">
                Examples: FREQ=WEEKLY;BYDAY=MO (every Monday), FREQ=MONTHLY (monthly)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isEditMode
                  ? isSubmitting
                    ? 'Saving...'
                    : 'Save Changes'
                  : isSubmitting
                  ? 'Creating...'
                  : 'Create Appointment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentForm;
