'use client';

import React from 'react';
import { Form, Select, InputNumber, Space, Typography } from 'antd';
import { isDevelopment } from '@/utils/env';
import type { ReplayConfigFormValues } from '@/types';

const { Text } = Typography;

interface ReplayConfigFormProps {
  form: ReturnType<typeof Form.useForm>[0]
  initialValues?: ReplayConfigFormValues
  formKey?: number
  playbackMode: 'realtime' | 'fixed'
  onPlaybackModeChange: (mode: 'realtime' | 'fixed') => void
}

export const ReplayConfigForm: React.FC<ReplayConfigFormProps> = ({
  form,
  initialValues,
  formKey,
  playbackMode,
  onPlaybackModeChange,
}) => {
  // Only fixedInterval is environment-dependent, speed remains constant
  const getDefaultValues = (): ReplayConfigFormValues => {
    const isDev = isDevelopment();
    if (playbackMode === 'fixed') {
      return {
        playbackMode: 'fixed',
        speed: initialValues?.speed ?? 1.0,
        fixedInterval: initialValues?.fixedInterval ?? (isDev ? 1 : 30),
      };
    }
    // realtime mode - speed doesn't depend on environment
    return {
      playbackMode: 'realtime',
      speed: initialValues?.speed ?? 1.0,
      fixedInterval: initialValues?.fixedInterval ?? 100,
    };
  };

  return (
    <Form
      key={`replay-${formKey}`}
      form={form}
      layout="vertical"
      name="replayConfig"
      initialValues={getDefaultValues()}
      preserve={false}
    >
      <Form.Item
        name="playbackMode"
        label="Playback Mode"
        rules={[{ required: true, message: 'Please select playback mode' }]}
      >
        <Select
          onChange={value => onPlaybackModeChange(value)}
          options={[
            { value: 'realtime', label: 'realtime - Play with original time intervals' },
            { value: 'fixed', label: 'fixed - Play with fixed time intervals' },
          ]}
        />
      </Form.Item>

      {playbackMode === 'realtime' && (
        <Form.Item
          name="speed"
          label={(
            <Space>
              <span>Playback Speed</span>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                (0.1 - 100x)
              </Text>
            </Space>
          )}
          rules={[
            { required: true, message: 'Please enter playback speed' },
            { type: 'number', min: 0.1, max: 100, message: 'Speed must be between 0.1 and 100' },
          ]}
        >
          <InputNumber
            min={0.1}
            max={100}
            step={0.1}
            precision={1}
            style={{ width: '100%' }}
            placeholder="Enter playback speed"
          />
        </Form.Item>
      )}

      {playbackMode === 'fixed' && (
        <Form.Item
          name="fixedInterval"
          label={(
            <Space>
              <span>Fixed Interval</span>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                (0 - 60000 ms)
              </Text>
            </Space>
          )}
          rules={[
            { required: true, message: 'Please enter fixed interval' },
            { type: 'number', min: 0, max: 60000, message: 'Interval must be between 0 and 60000 ms' },
          ]}
        >
          <InputNumber
            min={0}
            max={60000}
            step={1}
            style={{ width: '100%' }}
            placeholder="Enter fixed interval (ms)"
          />
        </Form.Item>
      )}

      <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Description:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>
              <strong>Realtime Mode:</strong>
              {' '}
              Play with original time intervals recorded in logs, can be accelerated or decelerated via speed parameter
            </li>
            <li>
              <strong>Fixed Mode:</strong>
              {' '}
              Play each message with fixed time intervals, ignoring original timestamps
            </li>
          </ul>
        </Text>
      </div>
    </Form>
  );
};
