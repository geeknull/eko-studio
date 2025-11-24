"use client"

import React from 'react'
import { Modal, Tabs, Form, Select, Input, InputNumber, Checkbox, Space, Typography, Collapse, Row, Col } from 'antd'
import { ReplayConfig } from './ReplayConfigModal'
import { NormalConfig, LLMProvider } from './NormalConfigModal'

const { Text } = Typography

interface ConfigModalProps {
  open: boolean
  currentMode: 'normal' | 'replay'
  normalConfig: NormalConfig | null
  replayConfig: ReplayConfig
  onConfirm: (mode: 'normal' | 'replay', normalConfig: NormalConfig | null, replayConfig: ReplayConfig) => void
  onCancel: () => void
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  currentMode,
  normalConfig,
  replayConfig,
  onConfirm,
  onCancel,
}) => {
  const [normalForm] = Form.useForm()
  const [replayForm] = Form.useForm()
  const [activeTab, setActiveTab] = React.useState<'normal' | 'replay'>(currentMode)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [playbackMode, setPlaybackMode] = React.useState<'realtime' | 'fixed'>(replayConfig.playbackMode)
  const [formKey, setFormKey] = React.useState(0)

  // Calculate initial values
  const normalInitialValues = React.useMemo(() => {
    if (normalConfig) {
      return {
        provider: normalConfig.llm.provider,
        model: Array.isArray(normalConfig.llm.model) ? normalConfig.llm.model : [normalConfig.llm.model],
        apiKey: normalConfig.llm.apiKey,
        baseURL: normalConfig.llm.config?.baseURL,
        temperature: normalConfig.llm.config?.temperature,
        topP: normalConfig.llm.config?.topP,
        topK: normalConfig.llm.config?.topK,
        maxTokens: normalConfig.llm.config?.maxTokens,
        agents: normalConfig.agents,
      }
    }
    return {
      provider: 'openrouter',
      model: ['openai/gpt-5-nano'],
      apiKey: '',
      baseURL: 'https://openrouter.ai/api/v1',
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      agents: ['BrowserAgent', 'FileAgent'],
    }
  }, [normalConfig])

  const replayInitialValues = React.useMemo(() => ({
    playbackMode: replayConfig.playbackMode,
    speed: replayConfig.speed,
    fixedInterval: replayConfig.fixedInterval,
  }), [replayConfig])

  // Initialize form values and state
  React.useEffect(() => {
    if (open) {
      setActiveTab(currentMode)
      setPlaybackMode(replayConfig.playbackMode)
      // Update key each time modal opens to force Form remount
      setFormKey(prev => prev + 1)
    }
  }, [open, currentMode, replayConfig.playbackMode])

  const handleOk = () => {
    // Validate the corresponding form based on current tab
    const formToValidate = activeTab === 'normal' ? normalForm : replayForm
    
    formToValidate.validateFields().then(() => {
      // Get values from both forms
      const normalValues = normalForm.getFieldsValue()
      const replayValues = replayForm.getFieldsValue()
      
      let normalConfigResult: NormalConfig | null = null
      let replayConfigResult: ReplayConfig

      // Build Normal config
      if (normalValues.provider && normalValues.model && normalValues.apiKey) {
        // Handle model field: if array, take first element; if string, use directly
        const modelValue = Array.isArray(normalValues.model) 
          ? normalValues.model[0] || normalValues.model 
          : normalValues.model
        
        normalConfigResult = {
          llm: {
            provider: normalValues.provider,
            model: modelValue,
            apiKey: normalValues.apiKey,
            config: {
              baseURL: normalValues.baseURL,
              temperature: normalValues.temperature,
              topP: normalValues.topP,
              topK: normalValues.topK,
              maxTokens: normalValues.maxTokens,
            },
          },
          agents: normalValues.agents || [],
        }
      } else if (normalConfig) {
        // Keep existing config
        normalConfigResult = normalConfig
      }

      // Build Replay config
      replayConfigResult = {
        playbackMode: replayValues.playbackMode || replayConfig.playbackMode,
        speed: replayValues.speed || replayConfig.speed,
        fixedInterval: replayValues.fixedInterval || replayConfig.fixedInterval,
      }

      onConfirm(activeTab, normalConfigResult, replayConfigResult)
    })
  }

  const handleCancel = () => {
    normalForm.resetFields()
    replayForm.resetFields()
    onCancel()
  }

  // Get common models based on provider
  const getModelOptions = (provider: LLMProvider) => {
    const modelsByProvider: Record<LLMProvider, string[]> = {
      openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      aws: ['anthropic.claude-v2', 'anthropic.claude-instant-v1'],
      openrouter: ['openai/gpt-5-nano', 'anthropic/claude-sonnet-4.5', 'openai/gpt-5.1'],
      'openai-compatible': [],
      modelscope: [],
    }
    return modelsByProvider[provider] || []
  }

  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'aws', label: 'AWS Bedrock' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'openai-compatible', label: 'OpenAI Compatible' },
    { value: 'modelscope', label: 'ModelScope' },
  ]

  const agentOptions = [
    { value: 'BrowserAgent', label: 'Browser Agent - Browser automation capabilities' },
    { value: 'FileAgent', label: 'File Agent - File system operation capabilities' },
  ]

  return (
    <Modal
      title="Configuration"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={700}
      okText="Confirm"
      cancelText="Cancel"
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'normal' | 'replay')}
        items={[
          {
            key: 'normal',
            label: 'Normal Mode',
            children: (
              <Form
                key={`normal-${formKey}`}
                form={normalForm}
                layout="vertical"
                name="normalConfig"
                initialValues={normalInitialValues}
                preserve={false}
              >
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  LLM Configuration
                </Typography.Title>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="provider"
                      label="Provider"
                      rules={[{ required: true, message: 'Please select a Provider' }]}
                    >
                      <Select
                        options={providerOptions}
                        onChange={(value) => {
                          const models = getModelOptions(value)
                          if (models.length > 0) {
                            normalForm.setFieldValue('model', models[0])
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Model"
                      shouldUpdate={(prevValues, currentValues) => prevValues?.provider !== currentValues?.provider}
                    >
                      {({ getFieldValue }) => {
                        const provider = getFieldValue('provider') as LLMProvider | undefined
                        return (
                          <Form.Item
                            name="model"
                            rules={[{ required: true, message: 'Please enter model name' }]}
                            noStyle
                          >
                            <Select
                              mode="tags"
                              maxCount={1}
                              placeholder="Select or enter model name"
                              options={
                                provider ? getModelOptions(provider).map(m => ({ value: m, label: m })) : []
                              }
                            />
                          </Form.Item>
                        )
                      }}
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="apiKey"
                  label="API Key"
                  rules={[{ required: true, message: 'Please enter API Key' }]}
                >
                  <Input.Password placeholder="Enter API Key" autoComplete="new-password" />
                </Form.Item>

                <Form.Item
                  name="baseURL"
                  label="Base URL"
                  extra="Custom API base URL (optional)"
                >
                  <Input placeholder="e.g., https://openrouter.ai/api/v1" />
                </Form.Item>

                <Collapse
                  ghost
                  onChange={(keys) => setShowAdvanced(keys.length > 0)}
                  items={[
                    {
                      key: '1',
                      label: 'Advanced Configuration',
                      children: (
                        <>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="temperature"
                                label={
                                  <Space>
                                    <span>Temperature</span>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      (0.0 - 2.0)
                                    </Text>
                                  </Space>
                                }
                                rules={[
                                  { type: 'number', min: 0, max: 2, message: 'Range: 0.0 - 2.0' },
                                ]}
                              >
                                <InputNumber
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  precision={1}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name="topP"
                                label={
                                  <Space>
                                    <span>Top P</span>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      (0.0 - 1.0)
                                    </Text>
                                  </Space>
                                }
                                rules={[
                                  { type: 'number', min: 0, max: 1, message: 'Range: 0.0 - 1.0' },
                                ]}
                              >
                                <InputNumber
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  precision={1}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="topK"
                                label="Top K"
                                extra="Supported by some providers"
                              >
                                <InputNumber
                                  min={1}
                                  max={100}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name="maxTokens"
                                label="Max Tokens"
                              >
                                <InputNumber
                                  min={1}
                                  max={128000}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ),
                    },
                  ]}
                />

                <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
                  Agents Configuration
                </Typography.Title>

                <Form.Item
                  name="agents"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value || value.length === 0) {
                          return Promise.reject(new Error('Please select at least one Agent'))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      {agentOptions.map((option) => (
                        <Checkbox key={option.value} value={option.value}>
                          {option.label}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Form.Item>

                <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <strong>Description:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      <li><strong>Browser Agent:</strong> Provides browser automation capabilities, can access web pages, click, fill forms, etc.</li>
                      <li><strong>File Agent:</strong> Provides file system operation capabilities, can read/write files, create directories, etc.</li>
                    </ul>
                  </Text>
                </div>
              </Form>
            ),
          },
          {
            key: 'replay',
            label: 'Replay Mode',
            children: (
              <Form
                key={`replay-${formKey}`}
                form={replayForm}
                layout="vertical"
                name="replayConfig"
                initialValues={replayInitialValues}
                preserve={false}
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
            ),
          },
        ]}
      />
    </Modal>
  )
}

