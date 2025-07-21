import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/MetricCard';
import { AIChat } from '@/components/AIChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Wifi, 
  Battery, 
  Thermometer,
  Activity,
  Users,
  Camera,
  MessageSquare,
  Power,
  RotateCcw
} from 'lucide-react';

interface SystemOverview {
  cpu: {
    usage_percent: number;
    physical_cores: number;
    total_cores: number;
    frequency: {
      current: number;
      max: number;
    };
  };
  memory: {
    virtual: {
      total_gb: number;
      used_gb: number;
      usage_percent: number;
    };
  };
  disk: {
    partitions: Array<{
      device: string;
      total_gb: number;
      used_gb: number;
      usage_percent: number;
    }>;
  };
  network: {
    io_counters: {
      bytes_sent: number;
      bytes_recv: number;
    };
  };
  battery?: {
    percent: number;
    power_plugged: boolean;
  };
  uptime: {
    formatted: string;
  };
}

export default function DeviceOverview() {
  const { deviceId } = useParams();
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 10000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const fetchOverview = async () => {
    try {
      const response = await fetch(`https://myspace.rhishav.com/${deviceId}/system/overview`);
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const takeScreenshot = async () => {
    try {
      const response = await fetch(`https://myspace.rhishav.com/${deviceId}/system/screenshot`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deviceId}_screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading device overview...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="metric-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Device Offline</h3>
          <p className="text-sm text-muted-foreground">Unable to connect to this device.</p>
        </Card>
      </div>
    );
  }

  const deviceName = deviceId === 'desktop' ? 'Win11-Desktop' : 'Fedora-Laptop';
  const totalDiskUsage = overview.disk.partitions.reduce((acc, partition) => acc + partition.usage_percent, 0) / overview.disk.partitions.length;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link to="/">
              <Button variant="outline" size="sm" className="text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={takeScreenshot} className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Screenshot
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-1">{deviceName}</h1>
            <p className="text-xs text-muted-foreground mb-2">System Overview & Control</p>
            <Badge variant="outline" className="status-online text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 text-xs">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="control" className="text-xs">Control</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="CPU Usage"
                value={`${overview.cpu.usage_percent}%`}
                subtitle={`${overview.cpu.physical_cores}C/${overview.cpu.total_cores}T @ ${overview.cpu.frequency.current}MHz`}
                percentage={overview.cpu.usage_percent}
                icon={Cpu}
                gradient="gradient-primary"
              />
              
              <MetricCard
                title="Memory"
                value={`${overview.memory.virtual.used_gb.toFixed(1)}GB`}
                subtitle={`of ${overview.memory.virtual.total_gb.toFixed(1)}GB total`}
                percentage={overview.memory.virtual.usage_percent}
                icon={MemoryStick}
                gradient="gradient-warning"
              />
              
              <MetricCard
                title="Storage"
                value={`${totalDiskUsage.toFixed(1)}%`}
                subtitle={`${overview.disk.partitions.length} partition${overview.disk.partitions.length > 1 ? 's' : ''}`}
                percentage={totalDiskUsage}
                icon={HardDrive}
                gradient="gradient-secondary"
              />
              
              {overview.battery ? (
                <MetricCard
                  title="Battery"
                  value={`${overview.battery.percent}%`}
                  subtitle={overview.battery.power_plugged ? 'Plugged In' : 'On Battery'}
                  percentage={overview.battery.percent}
                  icon={Battery}
                  gradient="gradient-success"
                />
              ) : (
                <MetricCard
                  title="Network"
                  value={`${(overview.network.io_counters.bytes_recv / (1024**3)).toFixed(1)}GB`}
                  subtitle="Data Received"
                  icon={Wifi}
                  gradient="gradient-success"
                />
              )}
            </div>

            {/* System Information */}
            <Card className="metric-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">System Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="text-foreground font-medium">{overview.uptime.formatted}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CPU Cores</span>
                  <span className="text-foreground font-medium">{overview.cpu.physical_cores}P/{overview.cpu.total_cores}L</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CPU Freq</span>
                  <span className="text-foreground font-medium">{overview.cpu.frequency.current}MHz</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Memory</span>
                  <span className="text-foreground font-medium">{overview.memory.virtual.total_gb.toFixed(1)} GB</span>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Storage Breakdown</h3>
              <div className="space-y-2">
                {overview.disk.partitions.slice(0, 3).map((partition, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate">{partition.device}</span>
                      <span className="text-foreground font-medium text-xs">
                        {partition.used_gb.toFixed(1)}/{partition.total_gb.toFixed(1)}GB
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full gradient-secondary" 
                        style={{ width: `${partition.usage_percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="metric-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Navigation</h3>
              <div className="grid grid-cols-3 gap-2">
                <Link to={`/device/${deviceId}/cpu`}>
                  <Button variant="outline" className="w-full p-2 h-auto flex-col space-y-1 text-xs">
                    <Cpu className="h-4 w-4" />
                    <span>CPU</span>
                  </Button>
                </Link>
                <Link to={`/device/${deviceId}/processes`}>
                  <Button variant="outline" className="w-full p-2 h-auto flex-col space-y-1 text-xs">
                    <Users className="h-4 w-4" />
                    <span>Processes</span>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full p-2 h-auto flex-col space-y-1 text-xs" onClick={takeScreenshot}>
                  <Camera className="h-4 w-4" />
                  <span>Screenshot</span>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="control" className="space-y-4">
            <Card className="metric-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">System Control</h3>
              <div className="space-y-3">
                <Button 
                  variant="destructive" 
                  className="w-full p-4 h-auto flex-col space-y-1 text-xs"
                  onClick={() => {
                    if (confirm('Are you sure you want to shutdown this device?')) {
                      fetch(`https://myspace.rhishav.com/${deviceId}/system/control/shutdown`, {
                        method: 'POST',
                        headers: {
                          'Authorization': 'Bearer default-token',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ delay: 30 })
                      });
                    }
                  }}
                >
                  <Power className="h-5 w-5" />
                  <span>Shutdown Device</span>
                  <span className="text-xs opacity-75">30 second delay</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full p-4 h-auto flex-col space-y-1 text-xs gradient-warning"
                  onClick={() => {
                    if (confirm('Are you sure you want to reboot this device?')) {
                      fetch(`https://myspace.rhishav.com/${deviceId}/system/control/reboot`, {
                        method: 'POST',
                        headers: {
                          'Authorization': 'Bearer default-token',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ delay: 30 })
                      });
                    }
                  }}
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Reboot Device</span>
                  <span className="text-xs opacity-75">30 second delay</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full p-4 h-auto flex-col space-y-1 text-xs gradient-success"
                  onClick={() => {
                    fetch(`https://myspace.rhishav.com/${deviceId}/system/control/cancel-shutdown`, {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer default-token'
                      }
                    });
                  }}
                >
                  <Activity className="h-5 w-5" />
                  <span>Cancel Operations</span>
                  <span className="text-xs opacity-75">Stop shutdown/reboot</span>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <AIChat deviceEndpoint={deviceId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}