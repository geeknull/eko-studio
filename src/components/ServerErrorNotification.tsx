'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function ServerErrorNotification() {
  useEffect(() => {
    // Only run in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI?.onServerError) {
      return;
    }

    const unsubscribe = window.electronAPI.onServerError((_event, error) => {
      toast.error('Server Error', {
        description: (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
            {error}
          </pre>
        ),
        duration: Infinity, // Don't auto-close
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

export default ServerErrorNotification;
