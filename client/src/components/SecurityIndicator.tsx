import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SecurityIndicatorProps {
  level: 'classified' | 'secure' | 'encrypted' | 'protected';
  showDetails?: boolean;
}

export default function SecurityIndicator({ level, showDetails = false }: SecurityIndicatorProps) {
  const getSecurityConfig = (level: string) => {
    switch (level) {
      case 'classified':
        return {
          icon: Shield,
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          label: 'CLASSIFIED',
          description: 'Maximum security clearance required'
        };
      case 'secure':
        return {
          icon: Lock,
          color: 'bg-mission-green/20 text-mission-green border-mission-green/30',
          label: 'SECURE',
          description: 'End-to-end encrypted transmission'
        };
      case 'encrypted':
        return {
          icon: Eye,
          color: 'bg-mission-blue/20 text-mission-blue border-mission-blue/30',
          label: 'ENCRYPTED',
          description: 'Protected communication channel'
        };
      case 'protected':
        return {
          icon: AlertTriangle,
          color: 'bg-mission-gold/20 text-mission-gold border-mission-gold/30',
          label: 'PROTECTED',
          description: 'Agent authentication verified'
        };
      default:
        return {
          icon: Shield,
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          label: 'UNKNOWN',
          description: 'Security level undefined'
        };
    }
  };

  const config = getSecurityConfig(level);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="outline" className={`${config.color} font-mono text-xs px-2 py-1`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
      {showDetails && (
        <span className="text-xs text-mission-silver">
          {config.description}
        </span>
      )}
    </div>
  );
}