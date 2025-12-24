import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Check, RefreshCw, X } from 'lucide-react';
import { integrationsApi, Integration } from '@/api/integrations';
import { toast } from '@/hooks/use-toast';

const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const familyId = localStorage.getItem('familyId');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const data = await integrationsApi.getAll();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const { auth_url } = await integrationsApi.getGoogleCalendarAuthUrl();
      window.location.href = auth_url;
    } catch (error) {
      toast({ title: 'Error connecting Google Calendar', variant: 'destructive' });
    }
  };

  const syncGoogleCalendar = async () => {
    if (!familyId) return;
    setIsSyncing(true);
    try {
      const result = await integrationsApi.syncGoogleCalendar(familyId);
      toast({
        title: 'Sync completed',
        description: `Imported ${result.imported} events, exported ${result.exported} events`,
      });
      fetchIntegrations();
    } catch (error) {
      toast({ title: 'Error syncing', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!confirm('Disconnect Google Calendar?')) return;
    try {
      await integrationsApi.disconnectGoogleCalendar();
      toast({ title: 'Google Calendar disconnected' });
      fetchIntegrations();
    } catch (error) {
      toast({ title: 'Error disconnecting', variant: 'destructive' });
    }
  };

  const googleCalendar = integrations.find((i) => i.integration_type === 'google_calendar');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LinkIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Integrations</h1>
      </div>

      <p className="text-gray-600">Connect external services to sync your family calendar.</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">G</div>
                Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {googleCalendar ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span>Connected</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Last synced: {googleCalendar.last_sync ? new Date(googleCalendar.last_sync).toLocaleString() : 'Never'}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={syncGoogleCalendar} disabled={isSyncing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="outline" onClick={disconnectGoogleCalendar}>
                      <X className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Sync appointments with Google Calendar.</p>
                  <Button onClick={connectGoogleCalendar}>Connect Google Calendar</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-400 rounded flex items-center justify-center text-white font-bold text-sm">A</div>
                Apple Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Integrations;
