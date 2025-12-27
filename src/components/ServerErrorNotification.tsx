'use client';

import { useEffect } from 'react';
import { notification } from 'antd';

export function ServerErrorNotification() {
  useEffect(() => {
    // Only run in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI?.onServerError) {
      return;
    }

    const unsubscribe = window.electronAPI.onServerError((_event, error) => {
      // Show notification
      notification.error({
        message: 'Server Error',
        description: (
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            <pre style={{
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
              fontFamily: 'Monaco, Menlo, monospace'
            }}>
              {error}
            </pre>
          </div>
        ),
        duration: 0, // Don't auto-close
        placement: 'bottomRight',
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
