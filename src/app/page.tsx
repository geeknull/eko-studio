'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessage } from '@/store/chatStore';
import { useConfigStore } from '@/store';
import { JsonViewModal } from '@/components/base/JsonViewModal';
import { ConfigModal } from '@/components/home/ConfigModal';
import { HeaderControls } from '@/components/home/HeaderControls';
import { AgentChat } from '@/components/home/AgentChat';
import { ThemeToggle } from '@/components/theme-toggle';

function App() {
  const [selectedMessage, setSelectedMessage] = React.useState<ChatMessage | null>(null);
  const [showConfig, setShowConfig] = React.useState(false);
  const { mode, setMode } = useConfigStore();

  // Callback for viewing JSON
  const handleViewJson = React.useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
  }, []);

  // Close JSON view modal
  const handleCloseJsonModal = React.useCallback(() => {
    setSelectedMessage(null);
  }, []);

  // Handle mode change - no auto popup
  const handleModeChange = (value: string | number) => {
    const newMode = value as 'normal' | 'replay';
    setMode(newMode);
  };

  // Handle unified config confirm
  const handleConfigConfirm = () => {
    setShowConfig(false);
    const currentMode = useConfigStore.getState().mode;
    toast.success(`${currentMode === 'normal' ? 'Normal' : 'Replay'} mode configuration saved`);
  };

  // Handle config cancel
  const handleConfigCancel = () => {
    setShowConfig(false);
  };

  return (
    <>
      <div className="flex h-screen flex-col">
        <header className="flex h-16 flex-shrink-0 items-center border-b border-border bg-background px-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                <Bot className="size-5 text-white" />
              </div>
              <h1 className="m-0 text-lg font-semibold text-foreground">
                Eko Studio
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <HeaderControls
                mode={mode}
                onModeChange={handleModeChange}
                onConfigClick={() => setShowConfig(true)}
              />
            </div>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          <AgentChat
            onViewJson={handleViewJson}
            onConfigRequired={() => setShowConfig(true)}
          />
        </main>
      </div>

      {/* JSON View Modal */}
      <JsonViewModal
        open={!!selectedMessage}
        message={selectedMessage}
        onClose={handleCloseJsonModal}
      />

      {/* Unified Config Modal */}
      <ConfigModal
        open={showConfig}
        onConfirm={handleConfigConfirm}
        onCancel={handleConfigCancel}
      />
    </>
  );
}

export default App;
