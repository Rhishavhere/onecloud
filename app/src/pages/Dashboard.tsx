import { DeviceCard } from '@/components/DeviceCard';
import { AIChat } from '@/components/AIChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Laptop, MessageSquare, Activity, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const [showChat, setShowChat] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'laptop'>('desktop');

  const devices = [
    {
      name: 'Win11-Desktop',
      type: 'desktop' as const,
      endpoint: 'desktop'
    },
    {
      name: 'Fedora-Laptop',
      type: 'laptop' as const,
      endpoint: 'laptop'
    }
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              RhishDesk
            </h1>
            <p className="text-sm text-muted-foreground mb-3">
              Device Management Dashboard
            </p>
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Badge variant="outline" className="status-online text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                AI
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="metric-card">
            <div className="text-center">
              <div className="p-2 rounded-lg gradient-primary w-fit mx-auto mb-2">
                <Monitor className="h-4 w-4 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground">{devices.length}</p>
              <p className="text-xs text-muted-foreground">Devices</p>
            </div>
          </Card>
          
          <Card className="metric-card">
            <div className="text-center">
              <div className="p-2 rounded-lg gradient-success w-fit mx-auto mb-2">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground">2</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </Card>
          
          <Card className="metric-card">
            <div className="text-center">
              <div className="p-2 rounded-lg gradient-secondary w-fit mx-auto mb-2">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground">AI</p>
              <p className="text-xs text-muted-foreground">Ready</p>
            </div>
          </Card>
        </div>

        {/* Devices Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Devices</h2>
            <Button variant="outline" size="sm" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </div>
          
          <div className="space-y-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.endpoint}
                deviceName={device.name}
                deviceType={device.type}
                apiEndpoint={device.endpoint}
              />
            ))}
          </div>
        </div>

        {/* AI Chat Panel */}
        {showChat ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
              <div className="flex space-x-1">
                <Button
                  variant={selectedDevice === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDevice('desktop')}
                  className={selectedDevice === 'desktop' ? 'gradient-primary text-xs' : 'text-xs'}
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Desktop
                </Button>
                <Button
                  variant={selectedDevice === 'laptop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDevice('laptop')}
                  className={selectedDevice === 'laptop' ? 'gradient-secondary text-xs' : 'text-xs'}
                >
                  <Laptop className="h-3 w-3 mr-1" />
                  Laptop
                </Button>
              </div>
            </div>
            <AIChat deviceEndpoint={selectedDevice} />
          </div>
        ) : (
          <Card className="metric-card p-6 text-center">
            <div className="p-3 rounded-lg gradient-primary w-fit mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">AI Assistant</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get help with system monitoring and troubleshooting.
            </p>
            <Button 
              onClick={() => setShowChat(true)}
              className="gradient-primary text-xs"
              size="sm"
            >
              Start Chat
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}