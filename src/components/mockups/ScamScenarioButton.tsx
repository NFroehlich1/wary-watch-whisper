
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import ScamScenarioDialog from './ScamScenarioDialog';

const ScamScenarioButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant="outline"
        className="mt-4 flex items-center gap-2" 
        onClick={() => setIsDialogOpen(true)}
      >
        <AlertCircle className="h-4 w-4" />
        <span>View Scam Examples</span>
      </Button>
      
      <ScamScenarioDialog 
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default ScamScenarioButton;
