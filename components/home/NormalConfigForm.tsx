'use client';

import React from 'react';
import { Form, Select, Input, InputNumber, Checkbox, Space, Typography, Collapse, Row, Col, Tooltip } from 'antd';
import { getModelOptions, getDefaultBaseURL } from './llmProviderUtils';
import { isDevelopment } from '@/utils/env';
import type { LLMProvider, NormalConfigFormValues } from '@/types';

const { Text } = Typography;

interface NormalConfigFormProps {
  form: ReturnType<typeof Form.useForm>[0]
  initialValues?: NormalConfigFormValues
  formKey?: number
}

export const NormalConfigForm: React.FC<NormalConfigFormProps> = ({
  form,
  initialValues,
  formKey,
}) => {
  const isDevEnv = isDevelopment();

  // Filter out BrowserAgent and FileAgent from initial values if not in development environment
  React.useEffect(() => {
    if (!isDevEnv && initialValues?.agents) {
      const filteredAgents = initialValues.agents.filter(
        agent => agent !== 'FileAgent' && agent !== 'BrowserAgent',
      );
      if (filteredAgents.length !== initialValues.agents.length) {
        form.setFieldValue('agents', filteredAgents);
      }
    }
  }, [isDevEnv, initialValues, form]);

  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'aws', label: 'AWS Bedrock' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'openai-compatible', label: 'OpenAI Compatible' },
    { value: 'modelscope', label: 'ModelScope' },
  ];

  const agentOptions = [
    { value: 'BrowserAgent', label: 'Browser Agent - Browser automation capabilities' },
    { value: 'FileAgent', label: 'File Agent - File system operation capabilities' },
  ];

  return (
    <Form
      key={`normal-${formKey}`}
      form={form}
      layout="vertical"
      name="normalConfig"
      initialValues={initialValues}
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
                const models = getModelOptions(value);
                if (models.length > 0) {
                  form.setFieldValue('model', [models[0]]);
                }
                // Update Base URL when provider changes
                const defaultBaseURL = getDefaultBaseURL(value);
                if (defaultBaseURL) {
                  form.setFieldValue('baseURL', defaultBaseURL);
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
              const provider = getFieldValue('provider') as LLMProvider | undefined;
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
              );
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
                      label={(
                        <Space>
                          <span>Temperature</span>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            (0.0 - 2.0)
                          </Text>
                        </Space>
                      )}
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
                      label={(
                        <Space>
                          <span>Top P</span>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            (0.0 - 1.0)
                          </Text>
                        </Space>
                      )}
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
                return Promise.reject(new Error('Please select at least one Agent'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {agentOptions.map((option) => {
              const isDisabled = !isDevEnv;

              const checkbox = (
                <Checkbox key={option.value} value={option.value} disabled={isDisabled}>
                  {option.label}
                </Checkbox>
              );

              if (isDisabled) {
                return (
                  <Tooltip
                    key={option.value}
                    title="Only available in local development environment"
                    placement="right"
                  >
                    {checkbox}
                  </Tooltip>
                );
              }

              return checkbox;
            })}
          </Space>
        </Checkbox.Group>
      </Form.Item>

      <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Description:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>
              <strong>Browser Agent:</strong>
              {' '}
              Provides browser automation capabilities, can access web pages, click, fill forms, etc.
            </li>
            <li>
              <strong>File Agent:</strong>
              {' '}
              Provides file system operation capabilities, can read/write files, create directories, etc.
            </li>
          </ul>
        </Text>
      </div>
    </Form>
  );
};
