import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, CheckCheck, Calendar, Clock, MapPin } from 'lucide-react';
import { notificationsApi, Notification } from '@/api/notifications';
import { appointmentsApi, Appointment } from '@/api/appointments';
import { formatDate, formatTime, getCategoryBgClass } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'appointments'>('all');

  const familyId = localStorage.getItem('familyId');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  useEffect(() => {
    fetchWeekAppointments();
  }, [familyId]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getAll(filter === 'unread');
      console.log('Fetched notifications:', data);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({ 
        title: 'Error loading notifications', 
        description: error instanceof Error ? error.message : 'Failed to load notifications',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeekAppointments = async () => {
    if (!familyId) return;
    
    setIsLoadingAppointments(true);
    try {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      
      const data = await appointmentsApi.getAll(familyId, {
        start_date: now.toISOString(),
        end_date: weekEnd.toISOString(),
        status: 'active',
      });
      
      // Sort by start_time ascending
      const sorted = data.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      setWeekAppointments(sorted);
    } catch (error) {
      console.error('Error fetching week appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      toast({ title: 'Error marking as read', variant: 'destructive' });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      toast({ title: 'All notifications marked as read' });
      fetchNotifications();
    } catch (error) {
      toast({ title: 'Error marking all as read', variant: 'destructive' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      toast({ title: 'Notification deleted' });
      fetchNotifications();
    } catch (error) {
      toast({ title: 'Error deleting notification', variant: 'destructive' });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return 'bg-blue-100 text-blue-800';
      case 'conflict': return 'bg-orange-100 text-orange-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'summary': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Notifications & Reminders</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-sm px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && activeTab === 'all' && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          <Bell className="h-4 w-4 mr-2" />
          All Notifications
        </Button>
        <Button
          variant={activeTab === 'appointments' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Upcoming Appointments
          {weekAppointments.length > 0 && (
            <span className="ml-2 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
              {weekAppointments.length}
            </span>
          )}
        </Button>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {isLoadingAppointments ? (
            <div className="text-center py-12 text-gray-500">Loading appointments...</div>
          ) : weekAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments this week</p>
                <Link to="/appointments/new">
                  <Button className="mt-4">Schedule Appointment</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {weekAppointments.map((apt) => (
                <Link
                  key={apt.appointment_id}
                  to={`/appointments/${apt.appointment_id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 h-full min-h-[50px] rounded-full"
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
                          </div>
                          <h4 className="font-medium text-lg">{apt.title}</h4>
                          {apt.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {apt.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(apt.start_time)} at {formatTime(apt.start_time)}
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
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'all' && (
        <>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No notifications</p>
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.notification_id}
                  className={notification.read ? 'opacity-60' : ''}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(notification.notification_type)}`}>
                            {notification.notification_type}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(notification.notify_at)} at {formatTime(notification.notify_at)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.notification_id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => deleteNotification(notification.notification_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;
