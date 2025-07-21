import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Cpu, Activity, Zap } from 'lucide-react';

interface CPUInfo {
  physical_cores: number;
  total_cores: number;
  usage_percent: number;
  usage_per_core: number[];
  frequency: {
    current: number;
    min: number;
    max: number;
  };
  times: {
    user: number;
    system: number;
    idle: number;
  };
}

export default function CPUDetails() {
  const { deviceId } = useParams();
  const [cpuInfo, setCpuInfo] = useState<CPUInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCPUInfo();
    const interval = setInterval(fetchCPUInfo, 2000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const fetchCPUInfo = async () => {
    try {
      const response = await fetch(`https://myspace.rhishav.com/${deviceId}/system/cpu`);
      const data = await response.json();
      setCpuInfo(data);
    } catch (error) {
      console.error('Failed to fetch CPU info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CPU details...</p>
        </div>
      </div>
    );
  }

  const deviceName = deviceId === 'desktop' ? 'Win11-Desktop' : 'Fedora-Laptop';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link to={`/device/${deviceId}/overview`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">CPU Details</h1>
            <p className="text-muted-foreground">{deviceName} Processor Information</p>
          </div>
        </div>

        {cpuInfo && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Usage</p>
                    <p className="text-3xl font-bold text-foreground">{cpuInfo.usage_percent}%</p>
                  </div>
                  <div className="p-3 rounded-xl gradient-primary">
                    <Cpu className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Progress value={cpuInfo.usage_percent} className="mt-4" />
              </Card>

              <Card className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="text-3xl font-bold text-foreground">{cpuInfo.frequency.current.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">MHz</p>
                  </div>
                  <div className="p-3 rounded-xl gradient-secondary">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cores</p>
                    <p className="text-3xl font-bold text-foreground">{cpuInfo.physical_cores}</p>
                    <p className="text-sm text-muted-foreground">{cpuInfo.total_cores} Logical</p>
                  </div>
                  <div className="p-3 rounded-xl gradient-success">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Per-Core Usage */}
            <Card className="metric-card">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Per-Core Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cpuInfo.usage_per_core.map((usage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Core {index}</span>
                      <span className="text-foreground font-medium">{usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={usage} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="metric-card">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Frequency Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current</span>
                    <span className="text-foreground font-medium">{cpuInfo.frequency.current.toFixed(2)} MHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum</span>
                    <span className="text-foreground font-medium">{cpuInfo.frequency.min?.toFixed(2) || 'N/A'} MHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maximum</span>
                    <span className="text-foreground font-medium">{cpuInfo.frequency.max?.toFixed(2) || 'N/A'} MHz</span>
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <h3 className="text-lg font-semibold mb-4 text-foreground">CPU Time</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User Time</span>
                    <span className="text-foreground font-medium">{cpuInfo.times.user.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">System Time</span>
                    <span className="text-foreground font-medium">{cpuInfo.times.system.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Idle Time</span>
                    <span className="text-foreground font-medium">{cpuInfo.times.idle.toFixed(2)}s</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}