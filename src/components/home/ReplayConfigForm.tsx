'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
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
import { getFixedIntervalConfig, getSpeedConfig } from '@/config/replayConfig';
import type { ReplayConfigSchema } from './configSchemas';

interface ReplayConfigFormProps {
  form: UseFormReturn<ReplayConfigSchema>
}

export const ReplayConfigForm: React.FC<ReplayConfigFormProps> = ({ form }) => {
  const playbackMode = form.watch('playbackMode');
  const speedConfig = getSpeedConfig();
  const fixedIntervalConfig = getFixedIntervalConfig();

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="playbackMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Playback Mode</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select playback mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="realtime">
                    realtime - Play with original time intervals
                  </SelectItem>
                  <SelectItem value="fixed">
                    fixed - Play with fixed time intervals
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {playbackMode === 'realtime' && (
          <FormField
            control={form.control}
            name="speed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Playback Speed
                  {' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {`(${speedConfig.min} - ${speedConfig.max}x)`}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    max={speedConfig.max}
                    min={speedConfig.min}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                    placeholder="Enter playback speed"
                    step={speedConfig.step}
                    type="number"
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {playbackMode === 'fixed' && (
          <FormField
            control={form.control}
            name="fixedInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fixed Interval
                  {' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {`(${fixedIntervalConfig.min} - ${fixedIntervalConfig.max} ms)`}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    max={fixedIntervalConfig.max}
                    min={fixedIntervalConfig.min}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                    placeholder="Enter fixed interval (ms)"
                    step={fixedIntervalConfig.step}
                    type="number"
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <strong>Description:</strong>
          <ul className="my-2 list-disc space-y-1 pl-5">
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
        </div>
      </div>
    </Form>
  );
};
