'use client';

import React from 'react';
import { PlayCircle, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderControlsProps {
  mode: 'normal' | 'replay'
  onModeChange: (value: string | number) => void
  onConfigClick: () => void
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  mode,
  onModeChange,
  onConfigClick,
}) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Mode:</span>
      <div className="flex items-center gap-0.5 rounded-md border p-0.5">
        <Button
          className="gap-1.5"
          onClick={() => onModeChange('normal')}
          size="sm"
          variant={mode === 'normal' ? 'default' : 'ghost'}
        >
          <Zap className="size-4" />
          Normal
        </Button>
        <Button
          className="gap-1.5"
          onClick={() => onModeChange('replay')}
          size="sm"
          variant={mode === 'replay' ? 'default' : 'ghost'}
        >
          <PlayCircle className="size-4" />
          Replay
        </Button>
      </div>
      <Button className="gap-1.5" onClick={onConfigClick} variant="outline">
        <Settings className="size-4" />
        Configuration
      </Button>
    </div>
  );
};
