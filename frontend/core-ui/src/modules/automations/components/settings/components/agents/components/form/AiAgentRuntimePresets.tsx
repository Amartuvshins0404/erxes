import { useAiAgentRuntimePresets } from '@/automations/components/settings/components/agents/hooks/useAiAgentRuntimePresets';
import { TAiAgentForm } from '@/automations/components/settings/components/agents/states/AiAgentFormSchema';
import { Badge, ChoiceboxGroup, Skeleton } from 'erxes-ui';
import { useFormContext, useWatch } from 'react-hook-form';

const formatSeconds = (ms: number) => `${Math.round(ms / 1000)}s`;

export const AiAgentRuntimePresets = () => {
  const { control, setValue } = useFormContext<TAiAgentForm>();
  const runtime = useWatch({ control, name: 'runtime' });
  const { presets, activePreset, loading } = useAiAgentRuntimePresets(runtime);

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    );
  }

  if (!presets.length) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Budget</h4>
        {!activePreset && <Badge variant="secondary">Custom</Badge>}
      </div>
      <ChoiceboxGroup
        value={activePreset?.key ?? ''}
        onValueChange={(key) => {
          const preset = presets.find((item) => item.key === key);

          if (preset) {
            setValue('runtime', preset.runtime, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        }}
        className="grid gap-3 md:grid-cols-3"
      >
        {presets.map((preset) => (
          <ChoiceboxGroup.Item
            key={preset.key}
            value={preset.key}
            title={preset.label}
          >
            <span className="block text-xs font-normal text-muted-foreground">
              {preset.description}
            </span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {preset.runtime.maxTokens.toLocaleString()} tokens ·{' '}
              {formatSeconds(preset.runtime.timeoutMs)} timeout
            </span>
          </ChoiceboxGroup.Item>
        ))}
      </ChoiceboxGroup>
    </div>
  );
};
