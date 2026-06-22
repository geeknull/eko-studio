'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getDefaultBaseURL, getModelOptions } from './llmProviderUtils';
import { isDevelopment } from '@/utils/env';
import type { NormalConfigSchema } from './configSchemas';
import type { LLMprovider } from '@eko-ai/eko/types';

interface NormalConfigFormProps {
  form: UseFormReturn<NormalConfigSchema>
}

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'bedrock', label: 'AWS Bedrock' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'modelscope', label: 'ModelScope' },
];

// Optional number field: empty input -> undefined, otherwise the numeric value.
function toOptionalNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

export const NormalConfigForm: React.FC<NormalConfigFormProps> = ({ form }) => {
  const isDevEnv = isDevelopment();
  const provider = form.watch('provider') as LLMprovider | undefined;
  const modelOptions = provider ? getModelOptions(provider) : [];
  const modelListId = React.useId();

  return (
    <Form {...form}>
      <div className="space-y-4">
        <h5 className="text-sm font-semibold">LLM Configuration</h5>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Provider
                  {' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Linkage: update model + Base URL when provider changes
                    const models = getModelOptions(value as LLMprovider);
                    if (models.length > 0) {
                      form.setValue('model', models[0]);
                    }
                    const defaultBaseURL = getDefaultBaseURL(value as LLMprovider);
                    if (defaultBaseURL) {
                      form.setValue('baseURL', defaultBaseURL);
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Model
                  {' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    list={modelListId}
                    placeholder="Select or enter model name"
                    {...field}
                  />
                </FormControl>
                <datalist id={modelListId}>
                  {modelOptions.filter(Boolean).map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                API Key
                {' '}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="new-password"
                  placeholder="Enter API Key"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., https://openrouter.ai/api/v1"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>Custom API base URL (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible>
          <CollapsibleTrigger className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            Advanced Configuration
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Temperature
                      {' '}
                      <span className="text-xs font-normal text-muted-foreground">(0.0 - 2.0)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        max={2}
                        min={0}
                        onChange={e => field.onChange(toOptionalNumber(e.target.value))}
                        step={0.1}
                        type="number"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Top P
                      {' '}
                      <span className="text-xs font-normal text-muted-foreground">(0.0 - 1.0)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        max={1}
                        min={0}
                        onChange={e => field.onChange(toOptionalNumber(e.target.value))}
                        step={0.1}
                        type="number"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="topK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top K</FormLabel>
                    <FormControl>
                      <Input
                        max={100}
                        min={1}
                        onChange={e => field.onChange(toOptionalNumber(e.target.value))}
                        type="number"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Supported by some providers</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input
                        max={128000}
                        min={1}
                        onChange={e => field.onChange(toOptionalNumber(e.target.value))}
                        type="number"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <h5 className="pt-2 text-sm font-semibold">Agents Configuration</h5>

        <FormField
          control={form.control}
          name="agents"
          render={({ field }) => {
            const checked = field.value?.includes('BrowserAgent') ?? false;
            return (
              <FormItem>
                <div
                  className="flex items-center gap-2"
                  title={isDevEnv ? undefined : 'Only available in local development environment'}
                >
                  <FormControl>
                    <Checkbox
                      checked={checked}
                      disabled={!isDevEnv}
                      onCheckedChange={value => field.onChange(value ? ['BrowserAgent'] : [])}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Browser Agent - Browser automation capabilities
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <strong>Description:</strong>
          <ul className="my-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Browser Agent:</strong>
              {' '}
              Provides browser automation capabilities, can access web pages, click, fill forms, etc.
            </li>
          </ul>
        </div>
      </div>
    </Form>
  );
};
