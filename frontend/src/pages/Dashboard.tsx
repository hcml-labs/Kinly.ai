import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Plus,
  Users,
  Baby,
  Bell,
  TrendingUp,
  Clock,
  MapPin,
} from 'lucide-react';
import { appointmentsApi, Appointment } from '@/api/appointments';
import { childrenApi, Child } from '@/api/children';
import { aiApi, WeeklySummary } from '@/api/ai';
import { formatDate, formatTime, getCategoryBgClass } from '@/lib/utils';
import { QuickActions } from '@/components/dashboard/QuickActions';

const Dashboard = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const familyId = localStorage.getItem('familyId');

  useEffect(() => {
    const fetchData = async () => {
      if (!familyId) {
        setIsLoading(false);
        return;
      }

      try {
        const [appointmentsData, childrenData, summaryData] = await Promise.all([
          appointmentsApi.getAll(familyId, {
            start_date: new Date().toISOString(),
            status: 'active',
          }),
          childrenApi.getAll(familyId),
          aiApi.getWeeklySummary(familyId),
        ]);

        // Sort by start_time ascending and take first 5
        const sortedAppointments = appointmentsData
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          .slice(0, 5);
        setUpcomingAppointments(sortedAppointments);
        setChildren(childrenData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [familyId]);

  if (!familyId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome to Kinly.ai!</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Create Your Family</h2>
            <p className="text-gray-600 mb-6">
              Get started by creating your family to begin managing appointments.
            </p>
            <Link to="/family">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Family
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/appointments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_appointments || 0}</div>
            <p className="text-xs text-muted-foreground">appointments scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">profiles created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Busiest Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.busiest_day || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.busiest_day_count || 0} appointments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.conflicts_detected || 0}</div>
            <p className="text-xs text-muted-foreground">detected this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Link to="/appointments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <Link
                    key={apt.appointment_id}
                    to={`/appointments/${apt.appointment_id}`}
                    className="block"
                  >
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div
                        className="w-1 h-full min-h-[60px] rounded-full"
                        style={{ backgroundColor: apt.color || getCategoryBgClass(apt.category) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBgClass(apt.category)}`}>
                            {apt.category}
                          </span>
                          {apt.child_name && (
                            <span className="text-xs text-gray-500">{apt.child_name}</span>
                          )}
                        </div>
                        <h4 className="font-medium truncate">{apt.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(apt.start_time)} at {formatTime(apt.start_time)}
                          </span>
                          {apt.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              {apt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-6">
                {/* Category Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">By Category</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(summary.appointments_by_category).map(([category, count]) => (
                      <div
                        key={category}
                        className={`p-3 rounded-lg ${getCategoryBgClass(category)}`}
                      >
                        <div className="text-lg font-bold">{count}</div>
                        <div className="text-sm capitalize">{category}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {summary.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Suggestions</h4>
                    <ul className="space-y-2">
                      {summary.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Children Quick View */}
      {children.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Children</CardTitle>
            <Link to="/children">
              <Button variant="ghost" size="sm">Manage</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <div
                  key={child.child_id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {child.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{child.name}</h4>
                    <p className="text-sm text-gray-500">
                      {child.school || 'No school set'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
