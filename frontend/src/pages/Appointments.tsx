import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Clock, MapPin, Filter } from 'lucide-react';
import { appointmentsApi, Appointment, AppointmentCategory } from '@/api/appointments';
import { childrenApi, Child } from '@/api/children';
import { formatDate, formatTime, getCategoryBgClass } from '@/lib/utils';

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const familyId = localStorage.getItem('familyId');

  const categories: AppointmentCategory[] = ['school', 'health', 'activity', 'personal'];

  useEffect(() => {
    const fetchData = async () => {
      if (!familyId) return;

      setIsLoading(true);
      try {
        const [appointmentsData, childrenData] = await Promise.all([
          appointmentsApi.getAll(familyId, {
            category: selectedCategory || undefined,
            child_id: selectedChild || undefined,
          }),
          childrenApi.getAll(familyId),
        ]);

        setAppointments(appointmentsData);
        setChildren(childrenData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [familyId, selectedCategory, selectedChild]);

  const filteredAppointments = appointments.filter((apt) =>
    apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    const date = formatDate(apt.start_time);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(apt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Link to="/appointments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Child Filter */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-500 flex items-center">
            <Filter className="h-4 w-4 mr-1" /> Filter by child:
          </span>
          <Button
            variant={selectedChild === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedChild(null)}
          >
            All
          </Button>
          {children.map((child) => (
            <Button
              key={child.child_id}
              variant={selectedChild === child.child_id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedChild(child.child_id)}
            >
              {child.name}
            </Button>
          ))}
        </div>
      )}

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No appointments found</p>
            <Link to="/appointments/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create your first appointment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
            <div key={date}>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">{date}</h3>
              <div className="space-y-3">
                {dayAppointments
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map((apt) => (
                    <Link
                      key={apt.appointment_id}
                      to={`/appointments/${apt.appointment_id}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-1 h-full min-h-[60px] rounded-full"
                              style={{
                                backgroundColor:
                                  apt.category === 'school' ? '#3B82F6' :
                                  apt.category === 'health' ? '#EF4444' :
                                  apt.category === 'activity' ? '#10B981' :
                                  '#8B5CF6'
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBgClass(apt.category)}`}>
                                  {apt.category}
                                </span>
                                {apt.child_name && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {apt.child_name}
                                  </span>
                                )}
                                {apt.status !== 'active' && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                    {apt.status}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-lg">{apt.title}</h4>
                              {apt.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {apt.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                                </span>
                                {apt.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {apt.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
