import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  FileText,
  Upload,
} from 'lucide-react';
import { appointmentsApi, AppointmentWithDetails } from '@/api/appointments';
import { formatDate, formatTime, getCategoryBgClass } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (id) fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    if (!id) return;
    try {
      const data = await appointmentsApi.getById(id);
      setAppointment(data);
    } catch (error) {
      toast({ title: 'Error loading appointment', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await appointmentsApi.delete(id);
      toast({ title: 'Appointment deleted' });
      navigate('/appointments');
    } catch (error) {
      toast({ title: 'Error deleting appointment', variant: 'destructive' });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;
    try {
      await appointmentsApi.addNote(id, newNote);
      toast({ title: 'Note added' });
      setNewNote('');
      fetchAppointment();
    } catch (error) {
      toast({ title: 'Error adding note', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.[0]) return;
    try {
      await appointmentsApi.uploadDocument(id, e.target.files[0]);
      toast({ title: 'Document uploaded' });
      fetchAppointment();
    } catch (error) {
      toast({ title: 'Error uploading document', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!appointment) {
    return <div className="text-center py-12 text-gray-500">Appointment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm px-3 py-1 rounded-full ${getCategoryBgClass(appointment.category)}`}>
                  {appointment.category}
                </span>
                {appointment.child_name && (
                  <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                    {appointment.child_name}
                  </span>
                )}
                <span className={`text-sm px-3 py-1 rounded-full ${
                  appointment.status === 'active' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
              <CardTitle className="text-2xl">{appointment.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Link to={`/appointments/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" className="text-red-600" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {appointment.description && (
            <p className="text-gray-600">{appointment.description}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span>{formatDate(appointment.start_time)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="h-5 w-5" />
              <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
            </div>
            {appointment.location && (
              <div className="flex items-center gap-3 text-gray-600 md:col-span-2">
                <MapPin className="h-5 w-5" />
                <span>{appointment.location}</span>
              </div>
            )}
          </div>

          {appointment.recurrence_rule && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Recurring:</strong> {appointment.recurrence_rule}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1"
            />
            <Button type="submit">Add Note</Button>
          </form>
          {appointment.notes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {appointment.notes.map((note) => (
                <div key={note.note_id} className="p-3 bg-gray-50 rounded-lg">
                  <p>{note.note_text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(note.created_at)} at {formatTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload a document</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          {appointment.documents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No documents attached</p>
          ) : (
            <div className="grid gap-2">
              {appointment.documents.map((doc) => (
                <a
                  key={doc.document_id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="flex-1 truncate">{doc.file_name}</span>
                  <span className="text-xs text-gray-500">{doc.file_type}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentDetail;
