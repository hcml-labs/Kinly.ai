import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
} from 'lucide-react';
import { appointmentsApi, Appointment } from '@/api/appointments';
import { childrenApi, Child } from '@/api/children';
import { formatTime, getCategoryBgClass } from '@/lib/utils';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const familyId = localStorage.getItem('familyId');

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchData = async () => {
      if (!familyId) return;

      setIsLoading(true);
      try {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const [appointmentsData, childrenData] = await Promise.all([
          appointmentsApi.getAll(familyId, {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            child_id: selectedChild || undefined,
          }),
          childrenApi.getAll(familyId),
        ]);

        setAppointments(appointmentsData);
        setChildren(childrenData);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [familyId, currentDate, selectedChild]);

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <Link to="/appointments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedChild === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedChild(null)}
        >
          All
        </Button>
        {children.map((child) => (
          <Button
            key={child.child_id}
            variant={selectedChild === child.child_id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChild(child.child_id)}
          >
            {child.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[100px] bg-gray-50 rounded-lg" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayAppointments = getAppointmentsForDay(day);

              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-2 rounded-lg border ${
                    isToday(day) ? 'border-primary bg-primary/5' : 'border-gray-100'
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday(day) ? 'text-primary' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <Link
                        key={apt.appointment_id}
                        to={`/appointments/${apt.appointment_id}`}
                        className={`block text-xs p-1 rounded truncate text-white ${
                          apt.category === 'school' ? 'bg-blue-500' :
                          apt.category === 'health' ? 'bg-red-500' :
                          apt.category === 'activity' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}
                      >
                        {formatTime(apt.start_time)} {apt.title}
                      </Link>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              {appointments
                .filter((apt) => {
                  const aptDate = new Date(apt.start_time);
                  return (
                    aptDate.getDate() === today.getDate() &&
                    aptDate.getMonth() === today.getMonth() &&
                    aptDate.getFullYear() === today.getFullYear()
                  );
                })
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .map((apt) => (
                  <Link
                    key={apt.appointment_id}
                    to={`/appointments/${apt.appointment_id}`}
                    className="block"
                  >
                    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold">{formatTime(apt.start_time)}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBgClass(apt.category)}`}>
                            {apt.category}
                          </span>
                          {apt.child_name && (
                            <span className="text-xs text-gray-500">{apt.child_name}</span>
                          )}
                        </div>
                        <h4 className="font-medium">{apt.title}</h4>
                        {apt.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {apt.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              {appointments.filter((apt) => {
                const aptDate = new Date(apt.start_time);
                return (
                  aptDate.getDate() === today.getDate() &&
                  aptDate.getMonth() === today.getMonth() &&
                  aptDate.getFullYear() === today.getFullYear()
                );
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No appointments scheduled for today
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;
