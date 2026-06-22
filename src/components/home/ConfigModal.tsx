'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConfigStore } from '@/store';
import type { LLMprovider } from '@eko-ai/eko/types';
import type { NormalConfig, ReplayConfig } from '@/types';
import { getDefaultReplayConfig } from '@/config/replayConfig';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  createReplayConfigSchema,
  normalConfigSchema,
  type NormalConfigSchema,
  type ReplayConfigSchema,
} from './configSchemas';
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
  const [activeTab, setActiveTab] = React.useState<'normal' | 'replay'>(currentMode);

  const replaySchema = React.useMemo(() => createReplayConfigSchema(), []);

  // Initial values (from store, with sensible defaults)
  const normalInitialValues = React.useMemo<NormalConfigSchema>(() => {
    if (normalConfig) {
      return {
        provider: normalConfig.llm.provider as string,
        model: normalConfig.llm.model,
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
      model: 'openai/gpt-5-nano',
      apiKey: '',
      baseURL: 'https://openrouter.ai/api/v1',
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      agents: ['BrowserAgent'],
    };
  }, [normalConfig]);

  const replayInitialValues = React.useMemo<ReplayConfigSchema>(() => {
    const defaultConfig = getDefaultReplayConfig(replayConfig.playbackMode);
    return {
      playbackMode: replayConfig.playbackMode,
      speed: replayConfig.speed ?? defaultConfig.speed,
      fixedInterval: replayConfig.fixedInterval ?? defaultConfig.fixedInterval,
    };
  }, [replayConfig]);

  const normalForm = useForm<NormalConfigSchema>({
    resolver: zodResolver(normalConfigSchema),
    defaultValues: normalInitialValues,
  });

  const replayForm = useForm<ReplayConfigSchema>({
    resolver: zodResolver(replaySchema),
    defaultValues: replayInitialValues,
  });

  // Re-initialize forms each time the modal opens
  React.useEffect(() => {
    if (open) {
      setActiveTab(currentMode);
      normalForm.reset(normalInitialValues);
      replayForm.reset(replayInitialValues);
    }
  }, [open, currentMode, normalInitialValues, replayInitialValues, normalForm, replayForm]);

  const handleConfirm = async () => {
    // Validate only the active tab's form (matches the old antd behavior)
    const activeForm = activeTab === 'normal' ? normalForm : replayForm;
    const valid = await activeForm.trigger();
    if (!valid) return;

    const normalValues = normalForm.getValues();
    const replayValues = replayForm.getValues();

    let normalConfigResult: NormalConfig | null = null;
    if (normalValues.provider && normalValues.model && normalValues.apiKey) {
      normalConfigResult = {
        llm: {
          provider: normalValues.provider as LLMprovider,
          model: normalValues.model,
          apiKey: normalValues.apiKey,
          config: {
            baseURL: normalValues.baseURL,
            temperature: normalValues.temperature,
            topP: normalValues.topP,
            topK: normalValues.topK,
            maxTokens: normalValues.maxTokens,
          },
        },
        agents: normalValues.agents ?? [],
      };
    }
    else if (normalConfig) {
      normalConfigResult = normalConfig;
    }

    const replayConfigResult: ReplayConfig = {
      playbackMode: replayValues.playbackMode ?? replayConfig.playbackMode,
      speed: replayValues.speed ?? replayConfig.speed,
      fixedInterval: replayValues.fixedInterval ?? replayConfig.fixedInterval,
    };

    updateConfig(activeTab, normalConfigResult, replayConfigResult);
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
        </DialogHeader>

        <Tabs onValueChange={key => setActiveTab(key as 'normal' | 'replay')} value={activeTab}>
          <TabsList>
            <TabsTrigger value="normal">Normal Mode</TabsTrigger>
            <TabsTrigger value="replay">Replay Mode</TabsTrigger>
          </TabsList>
          <TabsContent forceMount hidden={activeTab !== 'normal'} value="normal">
            <NormalConfigForm form={normalForm} />
          </TabsContent>
          <TabsContent forceMount hidden={activeTab !== 'replay'} value="replay">
            <ReplayConfigForm form={replayForm} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} type="button">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
