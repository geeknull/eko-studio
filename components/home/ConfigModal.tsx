'use client';

import React from 'react';
import { Modal, Tabs, Form } from 'antd';
import { useConfigStore } from '@/store';
import type { NormalConfig, ReplayConfig, NormalConfigFormValues, ReplayConfigFormValues } from '@/types';
import { getDefaultReplayConfig } from '@/config/replayConfig';
import { NormalConfigForm } from './NormalConfigForm';
import { ReplayConfigForm } from './ReplayConfigForm';

interface ConfigModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const { mode: currentMode, normalConfig, replayConfig, updateConfig } = useConfigStore();
  const [normalForm] = Form.useForm();
  const [replayForm] = Form.useForm();
  const [activeTab, setActiveTab] = React.useState<'normal' | 'replay'>(currentMode);
  const [playbackMode, setPlaybackMode] = React.useState<'realtime' | 'fixed'>(replayConfig.playbackMode);
  const [formKey, setFormKey] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  // Only render forms after modal has been opened at least once
  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
    }
  }, [open]);

  // Calculate initial values
  const normalInitialValues = React.useMemo<NormalConfigFormValues>(() => {
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
      };
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
    };
  }, [normalConfig]);

  const replayInitialValues = React.useMemo<ReplayConfigFormValues>(() => {
    const defaultConfig = getDefaultReplayConfig(replayConfig.playbackMode);
    return {
      playbackMode: replayConfig.playbackMode,
      speed: replayConfig.speed ?? defaultConfig.speed,
      fixedInterval: replayConfig.fixedInterval ?? defaultConfig.fixedInterval,
    };
  }, [replayConfig]);

  // Initialize form values and state
  React.useEffect(() => {
    if (open) {
      setActiveTab(currentMode);
      setPlaybackMode(replayConfig.playbackMode);
      // Update key each time modal opens to force Form remount
      setFormKey(prev => prev + 1);
    }
  }, [open, currentMode, replayConfig.playbackMode]);

  const handleOk = () => {
    // Validate the corresponding form based on current tab
    const formToValidate = activeTab === 'normal' ? normalForm : replayForm;

    formToValidate.validateFields().then(() => {
      // Get values from both forms
      const normalValues = normalForm.getFieldsValue();
      const replayValues = replayForm.getFieldsValue();

      let normalConfigResult: NormalConfig | null = null;

      // Build Normal config
      if (normalValues.provider && normalValues.model && normalValues.apiKey) {
        // Handle model field: if array, take first element; if string, use directly
        const modelValue = Array.isArray(normalValues.model)
          ? normalValues.model[0] || normalValues.model
          : normalValues.model;

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
        };
      }
      else if (normalConfig) {
        // Keep existing config
        normalConfigResult = normalConfig;
      }

      // Build Replay config
      const replayConfigResult: ReplayConfig = {
        playbackMode: replayValues.playbackMode || replayConfig.playbackMode,
        speed: replayValues.speed || replayConfig.speed,
        fixedInterval: replayValues.fixedInterval || replayConfig.fixedInterval,
      };

      updateConfig(activeTab, normalConfigResult, replayConfigResult);
      onConfirm();
    });
  };

  const handleCancel = () => {
    normalForm.resetFields();
    replayForm.resetFields();
    onCancel();
  };

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
      {isMounted && (
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'normal' | 'replay')}
          destroyOnHidden={false}
          items={[
            {
              key: 'normal',
              label: 'Normal Mode',
              children: (
                <NormalConfigForm
                  form={normalForm}
                  initialValues={normalInitialValues}
                  formKey={formKey}
                />
              ),
            },
            {
              key: 'replay',
              label: 'Replay Mode',
              children: (
                <ReplayConfigForm
                  form={replayForm}
                  initialValues={replayInitialValues}
                  formKey={formKey}
                  playbackMode={playbackMode}
                  onPlaybackModeChange={setPlaybackMode}
                />
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
};
