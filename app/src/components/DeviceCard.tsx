import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Laptop, Activity, Cpu, HardDrive, Wifi, Battery } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DeviceStatus {
  online: boolean;
  hostname: string;
  os: string;
  uptime: {
    formatted: string;
  };
}

interface DeviceCardProps {
  deviceName: string;
  deviceType: 'desktop' | 'laptop';
  apiEndpoint: string;
}

export function DeviceCard({ deviceName, deviceType, apiEndpoint }: DeviceCardProps) {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeviceStatus();
    const interval = setInterval(fetchDeviceStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const response = await fetch(`https://myspace.rhishav.com/${apiEndpoint}/status`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Offline');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const DeviceIcon = deviceType === 'desktop' ? Monitor : Laptop;
  const isOnline = status?.online && !error;

  return (
    <Card className="metric-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${isOnline ? 'gradient-success' : 'bg-muted'}`}>
            <DeviceIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{deviceName}</h3>
            <p className="text-xs text-muted-foreground">{status?.os || 'Unknown OS'}</p>
          </div>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"} className={isOnline ? 'status-online text-xs' : 'text-xs'}>
          {loading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {status && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Hostname</span>
            <span className="text-foreground font-medium truncate ml-2">{status.hostname}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Uptime</span>
            <span className="text-foreground font-medium">{status.uptime.formatted}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Link to={`/device/${apiEndpoint}/overview`}>
          <Button variant="secondary" size="sm" className="w-full text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Overview
          </Button>
        </Link>
        <Link to={`/device/${apiEndpoint}/control`}>
          <Button variant="secondary" size="sm" className="w-full text-xs">
            <Monitor className="h-3 w-3 mr-1" />
            Control
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <Link to={`/device/${apiEndpoint}/cpu`}>
          <Button variant="ghost" size="sm" className="p-2">
            <Cpu className="h-3 w-3" />
          </Button>
        </Link>
        <Link to={`/device/${apiEndpoint}/disk`}>
          <Button variant="ghost" size="sm" className="p-2">
            <HardDrive className="h-3 w-3" />
          </Button>
        </Link>
        <Link to={`/device/${apiEndpoint}/network`}>
          <Button variant="ghost" size="sm" className="p-2">
            <Wifi className="h-3 w-3" />
          </Button>
        </Link>
        <Link to={`/device/${apiEndpoint}/battery`}>
          <Button variant="ghost" size="sm" className="p-2">
            <Battery className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}