'use client';

import React from 'react';
import { Typography, Segmented, Button } from 'antd';
import { ThunderboltOutlined, PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';

const { Text } = Typography;

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
      <Text type="secondary">Mode:</Text>
      <Segmented
        value={mode}
        onChange={onModeChange}
        options={[
          {
            label: (
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ThunderboltOutlined />
                <span>Normal</span>
              </div>
            ),
            value: 'normal',
          },
          {
            label: (
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlayCircleOutlined />
                <span>Replay</span>
              </div>
            ),
            value: 'replay',
          },
        ]}
      />
      <Button
        icon={<SettingOutlined />}
        onClick={onConfigClick}
        title="Configuration"
      >
        Configuration
      </Button>
    </div>
  );
};
