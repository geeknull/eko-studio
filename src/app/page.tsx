'use client';

import React from 'react';
import { ConfigProvider, Layout, Typography, message } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { ChatMessage } from '@/store/chatStore';
import { useConfigStore } from '@/store';
import { JsonViewModal } from '@/components/base/JsonViewModal';
import { ConfigModal } from '@/components/home/ConfigModal';
import { HeaderControls } from '@/components/home/HeaderControls';
import { AgentChat } from '@/components/home/AgentChat';

const { Header, Content } = Layout;
const { Title } = Typography;

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
    message.success(`${currentMode === 'normal' ? 'Normal' : 'Replay'} mode configuration saved`);
  };

  // Handle config cancel
  const handleConfigCancel = () => {
    setShowConfig(false);
  };

  return (
    <ConfigProvider>
      <Layout className="h-screen flex flex-col">
        <Header
          className="bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0 h-16"
          style={{ backgroundColor: '#ffffff', paddingLeft: '24px', paddingRight: '24px' }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <RobotOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
              <Title level={4} className="!mb-0 !text-gray-800" style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Eko Studio
              </Title>
            </div>
            <HeaderControls
              mode={mode}
              onModeChange={handleModeChange}
              onConfigClick={() => setShowConfig(true)}
            />
          </div>
        </Header>
        <Content className="flex-1 flex flex-col overflow-hidden p-6 min-h-0" style={{ minHeight: 0 }}>
          <AgentChat
            onViewJson={handleViewJson}
            onConfigRequired={() => setShowConfig(true)}
          />
        </Content>
      </Layout>

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
    </ConfigProvider>
  );
}

export default App;
