
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldX } from 'lucide-react';
import { RiskLevel } from '@/types';

interface StatusBadgeProps {
  riskLevel: RiskLevel;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ riskLevel, confidenceLevel }) => {
  // Helper function to determine status colors
  const getStatusColor = () => {
    switch (riskLevel) {
      case 'scam':
        return 'bg-status-scam';
      case 'suspicious':
        // Check if this is a high suspicion case based on confidence level
        return confidenceLevel === 'high'
                ? 'bg-amber-600' // darker orange/amber for higher suspicion
                : 'bg-status-suspicious'; // regular orange
      case 'safe':
        return 'bg-status-safe';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Helper function to get risk level text
  const getRiskLevelText = () => {
    // Determine if it's a higher level of suspicious based on confidence
    if (riskLevel === 'suspicious' && confidenceLevel === 'high') {
      return 'HIGH SUSPICION';
    }
    
    switch (riskLevel) {
      case 'scam':
        return 'SCAM';
      case 'suspicious':
        return 'SUSPICIOUS';
      case 'safe':
        return 'SAFE';
      default:
        return 'UNKNOWN';
    }
  };
  
  // Helper function to get appropriate icon based on risk level
  const getStatusIcon = () => {
    if (riskLevel === 'scam') {
      return <ShieldX className="h-4 w-4 mr-1" />;
    } else if (riskLevel === 'suspicious') {
      return confidenceLevel === 'high' 
        ? <ShieldAlert className="h-4 w-4 mr-1" />
        : <Shield className="h-4 w-4 mr-1" />;
    } else {
      return <Shield className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <Badge className={`${getStatusColor()} text-white font-bold flex items-center`}>
      {getStatusIcon()}
      {getRiskLevelText()}
    </Badge>
  );
};

export default StatusBadge;
