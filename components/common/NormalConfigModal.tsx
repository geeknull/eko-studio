"use client"

import React from 'react'
import { Modal, Form, Select, Input, InputNumber, Checkbox, Space, Typography, Collapse, Row, Col } from 'antd'

const { Text } = Typography

export type LLMProvider = "openai" | "anthropic" | "google" | "aws" | "openrouter" | "openai-compatible" | "modelscope"

export type AgentType = 'BrowserAgent' | 'FileAgent'

export interface NormalConfig {
  // LLM Configuration
  llm: {
    provider: LLMProvider
    model: string
    apiKey: string
    config?: {
      baseURL?: string
      temperature?: number
      topP?: number
      topK?: number
      maxTokens?: number
    }
  }
  // Agents Configuration
  agents: AgentType[]
}

interface NormalConfigModalProps {
  open: boolean
  onConfirm: (config: NormalConfig) => void
  onCancel: () => void
}

export const NormalConfigModal: React.FC<NormalConfigModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [form] = Form.useForm()
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Handle model field: if array, take first element; if string, use directly
      const modelValue = Array.isArray(values.model) 
        ? values.model[0] || values.model 
        : values.model
      
      // Build config object
      const config: NormalConfig = {
        llm: {
          provider: values.provider,
          model: modelValue,
          apiKey: values.apiKey,
          config: {
            baseURL: values.baseURL,
            temperature: values.temperature,
            topP: values.topP,
            topK: values.topK,
            maxTokens: values.maxTokens,
          },
        },
        agents: values.agents || [],
      }
      onConfirm(config)
      form.resetFields()
    })
  }

  const handleCancel = () => {
    form.resetFields()
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
      title="Normal Mode Configuration"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={700}
      okText="Confirm"
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          provider: 'openrouter',
          model: ['openai/gpt-5-nano'],
          apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
          baseURL: 'https://openrouter.ai/api/v1',
          temperature: 0.7,
          topP: 1.0,
          maxTokens: 4096,
          agents: ['BrowserAgent', 'FileAgent'],
        }}
      >
        {/* LLM Configuration Section */}
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
                    form.setFieldValue('model', models[0])
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

        {/* Advanced Configuration */}
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

        {/* Agents Configuration Section */}
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
    </Modal>
  )
}

