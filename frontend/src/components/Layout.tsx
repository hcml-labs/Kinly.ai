import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Home,
  Users,
  Baby,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Link as LinkIcon,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Appointments', href: '/appointments', icon: CalendarDays },
  { name: 'Children', href: '/children', icon: Baby },
  { name: 'Family', href: '/family', icon: Users },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Integrations', href: '/integrations', icon: LinkIcon },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div
          className="fixed inset-0 bg-gray-900/80"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">Kinly.ai</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          <div className="flex h-16 items-center px-4 border-b">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">Kinly.ai</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-white border-b px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-primary">Kinly.ai</span>
          </Link>
        </div>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
