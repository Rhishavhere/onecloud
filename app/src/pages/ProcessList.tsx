import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Users, Cpu, MemoryStick } from 'lucide-react';

interface Process {
  pid: number;
  name: string;
  username: string;
  cpu_percent: number;
  memory_mb: number;
  memory_percent: number;
  status: string;
  create_time_formatted: string;
}

interface ProcessData {
  processes: Process[];
  total_processes: number;
  sorted_by: string;
}

export default function ProcessList() {
  const { deviceId } = useParams();
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('memory');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [deviceId, sortBy, limit]);

  const fetchProcesses = async () => {
    try {
      const response = await fetch(
        `https://myspace.rhishav.com/${deviceId}/system/processes?sort=${sortBy}&limit=${limit}`
      );
      const data = await response.json();
      setProcessData(data);
    } catch (error) {
      console.error('Failed to fetch processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = processData?.processes.filter(process =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const deviceName = deviceId === 'desktop' ? 'Win11-Desktop' : 'Fedora-Laptop';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link to={`/device/${deviceId}/overview`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Running Processes</h1>
            <p className="text-muted-foreground">{deviceName} Process Monitor</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="metric-card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search processes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="memory">Memory</SelectItem>
                <SelectItem value="cpu">CPU</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="pid">PID</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Processes</p>
                <p className="text-3xl font-bold text-foreground">{processData?.total_processes || 0}</p>
              </div>
              <div className="p-3 rounded-xl gradient-primary">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Showing</p>
                <p className="text-3xl font-bold text-foreground">{filteredProcesses.length}</p>
              </div>
              <div className="p-3 rounded-xl gradient-secondary">
                <Search className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sorted By</p>
                <p className="text-lg font-bold text-foreground capitalize">{sortBy}</p>
              </div>
              <div className="p-3 rounded-xl gradient-success">
                {sortBy === 'memory' ? <MemoryStick className="h-6 w-6 text-white" /> : <Cpu className="h-6 w-6 text-white" />}
              </div>
            </div>
          </Card>
        </div>

        {/* Process List */}
        <Card className="metric-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground">PID</th>
                  <th className="text-left p-4 text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-muted-foreground">User</th>
                  <th className="text-left p-4 text-muted-foreground">CPU %</th>
                  <th className="text-left p-4 text-muted-foreground">Memory</th>
                  <th className="text-left p-4 text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <span className="text-muted-foreground">Loading processes...</span>
                    </td>
                  </tr>
                ) : (
                  filteredProcesses.map((process) => (
                    <tr key={process.pid} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-4 text-foreground font-mono">{process.pid}</td>
                      <td className="p-4 text-foreground font-medium">{process.name}</td>
                      <td className="p-4 text-muted-foreground">{process.username}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground">{process.cpu_percent?.toFixed(1) || '0.0'}%</span>
                          {(process.cpu_percent || 0) > 50 && (
                            <Badge variant="destructive" className="text-xs">High</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="text-foreground">{process.memory_mb.toFixed(1)} MB</span>
                          <div className="text-sm text-muted-foreground">
                            {process.memory_percent.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={process.status === 'running' ? 'default' : 'secondary'}
                          className={process.status === 'running' ? 'status-online' : ''}
                        >
                          {process.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{process.create_time_formatted}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}