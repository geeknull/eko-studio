'use client';

import React from 'react';
import { Form, Select, InputNumber, Space, Typography } from 'antd';
import { getFixedIntervalConfig, getSpeedConfig, getDefaultReplayConfig } from '@/config/replayConfig';
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
  // Use centralized config for default values
  const getDefaultValues = (): ReplayConfigFormValues => {
    const defaultConfig = getDefaultReplayConfig(playbackMode);

    return {
      playbackMode,
      speed: initialValues?.speed ?? defaultConfig.speed,
      fixedInterval: initialValues?.fixedInterval ?? defaultConfig.fixedInterval,
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

      {playbackMode === 'realtime' && (() => {
        const speedConfig = getSpeedConfig();
        return (
          <Form.Item
            name="speed"
            label={(
              <Space>
                <span>Playback Speed</span>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {`(${speedConfig.min} - ${speedConfig.max}x)`}
                </Text>
              </Space>
            )}
            rules={[
              { required: true, message: 'Please enter playback speed' },
              {
                type: 'number',
                min: speedConfig.min,
                max: speedConfig.max,
                message: `Speed must be between ${speedConfig.min} and ${speedConfig.max}`,
              },
            ]}
          >
            <InputNumber
              min={speedConfig.min}
              max={speedConfig.max}
              step={speedConfig.step}
              precision={speedConfig.precision}
              style={{ width: '100%' }}
              placeholder="Enter playback speed"
            />
          </Form.Item>
        );
      })()}

      {playbackMode === 'fixed' && (() => {
        const fixedIntervalConfig = getFixedIntervalConfig();
        return (
          <Form.Item
            name="fixedInterval"
            label={(
              <Space>
                <span>Fixed Interval</span>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  (
                  {fixedIntervalConfig.min}
                  {' '}
                  -
                  {' '}
                  {fixedIntervalConfig.max}
                  {' '}
                  ms)
                </Text>
              </Space>
            )}
            rules={[
              { required: true, message: 'Please enter fixed interval' },
              {
                type: 'number',
                min: fixedIntervalConfig.min,
                max: fixedIntervalConfig.max,
                message: `Interval must be between ${fixedIntervalConfig.min} and ${fixedIntervalConfig.max} ms`,
              },
            ]}
          >
            <InputNumber
              min={fixedIntervalConfig.min}
              max={fixedIntervalConfig.max}
              step={fixedIntervalConfig.step}
              style={{ width: '100%' }}
              placeholder="Enter fixed interval (ms)"
            />
          </Form.Item>
        );
      })()}

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
