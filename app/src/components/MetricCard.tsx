import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  percentage?: number;
  icon: LucideIcon;
  gradient?: string;
  trend?: 'up' | 'down' | 'stable';
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  percentage, 
  icon: Icon, 
  gradient = 'gradient-primary',
  trend 
}: MetricCardProps) {
  return (
    <Card className="metric-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${gradient}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      
      {percentage !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Usage</span>
            <span className="text-foreground font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-1.5"
          />
        </div>
      )}
      
      {trend && (
        <div className="flex items-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            trend === 'up' ? 'bg-red-500' : 
            trend === 'down' ? 'bg-green-500' : 
            'bg-yellow-500'
          }`} />
          <span className="text-xs text-muted-foreground">
            {trend === 'up' ? 'Increasing' : 
             trend === 'down' ? 'Decreasing' : 
             'Stable'}
          </span>
        </div>
      )}
    </Card>
  );
}