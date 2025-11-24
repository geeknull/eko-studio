"use client"

import React from 'react'
import { Modal, Form, Select, InputNumber, Space, Typography } from 'antd'

const { Text } = Typography

export interface ReplayConfig {
  playbackMode: 'realtime' | 'fixed'
  speed: number
  fixedInterval: number
}

interface ReplayConfigModalProps {
  open: boolean
  onConfirm: (config: ReplayConfig) => void
  onCancel: () => void
}

export const ReplayConfigModal: React.FC<ReplayConfigModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [form] = Form.useForm()
  const [playbackMode, setPlaybackMode] = React.useState<'realtime' | 'fixed'>('realtime')

  const handleOk = () => {
    form.validateFields().then((values) => {
      onConfirm(values as ReplayConfig)
      form.resetFields()
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="Replay Configuration"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={500}
      okText="Confirm"
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          playbackMode: 'realtime',
          speed: 1.0,
          fixedInterval: 100,
        }}
      >
        <Form.Item
          name="playbackMode"
          label="Playback Mode"
          rules={[{ required: true, message: 'Please select playback mode' }]}
        >
          <Select
            onChange={(value) => setPlaybackMode(value)}
            options={[
              { value: 'realtime', label: 'Realtime - Play with original time intervals' },
              { value: 'fixed', label: 'Fixed - Play with fixed time intervals' },
            ]}
          />
        </Form.Item>

        {playbackMode === 'realtime' && (
          <Form.Item
            name="speed"
            label={
              <Space>
                <span>Playback Speed</span>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  (0.1 - 100x)
                </Text>
              </Space>
            }
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
            label={
              <Space>
                <span>Fixed Interval</span>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  (10 - 60000 ms)
                </Text>
              </Space>
            }
            rules={[
              { required: true, message: 'Please enter fixed interval' },
              { type: 'number', min: 10, max: 60000, message: 'Interval must be between 10 and 60000 ms' },
            ]}
          >
            <InputNumber
              min={10}
              max={60000}
              step={10}
              style={{ width: '100%' }}
              placeholder="Enter fixed interval (ms)"
            />
          </Form.Item>
        )}

        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Description:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><strong>Realtime Mode:</strong> Play with original time intervals recorded in logs, can be accelerated or decelerated via speed parameter</li>
              <li><strong>Fixed Mode:</strong> Play each message with fixed time intervals, ignoring original timestamps</li>
            </ul>
          </Text>
        </div>
      </Form>
    </Modal>
  )
}

