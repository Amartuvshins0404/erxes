import { useEffect, useRef, useState } from 'react';
import {
  IconCheck,
  IconMicrophone,
  IconPlayerPlayFilled,
  IconVolume,
} from '@tabler/icons-react';
import { Badge, Button, Form, Input, toast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchSpeech } from '~/modules/chat/voice/lib/voiceTransport';
import { useVoiceSettings } from './hooks/useVoiceSettings';
import {
  IMastraVoiceConfigStatus,
  IMastraVoiceOption,
} from './types';
import {
  VOICE_SAMPLE_RATES,
  VOICE_SETTINGS_DEFAULTS,
  VoiceSettingsValues,
  voiceSettingsSchema,
} from './validations';

// A short Mongolian line for the "Test voice" preview.
const PREVIEW_TEXT = 'Сайн байна уу. Энэ бол сонгосон дуу хоолойны жишээ.';

// "configured / not configured" pill, annotated with the resolved source.
const SourceBadge = ({
  configured,
  source,
}: {
  configured?: boolean | null;
  source?: string | null;
}) => (
  <Badge variant={configured ? 'success' : 'secondary'}>
    {configured ? `Configured (${source})` : 'Not configured'}
  </Badge>
);

export const VoiceSettingsPage = () => {
  const { config, voices, save, saving } = useVoiceSettings();

  const form = useForm<VoiceSettingsValues>({
    resolver: zodResolver(voiceSettingsSchema),
    defaultValues: VOICE_SETTINGS_DEFAULTS,
  });

  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydrate from the secret-free status: tokens stay blank (write-only), but
  // the chosen voice / rate / switch reflect what's stored.
  useEffect(() => {
    if (config) {
      form.reset({
        sttToken: '',
        ttsToken: '',
        ttsVoice: config.ttsVoice || VOICE_SETTINGS_DEFAULTS.ttsVoice,
        ttsSampleRate:
          config.ttsSampleRate || VOICE_SETTINGS_DEFAULTS.ttsSampleRate,
        isEnabled: config.isEnabled !== false,
      });
    }
  }, [config, form]);

  const onSubmit = async (values: VoiceSettingsValues) => {
    // Only send tokens when the admin actually typed one, so a blank field
    // never clobbers the stored secret.
    const doc: Record<string, unknown> = {
      ttsVoice: values.ttsVoice,
      ttsSampleRate: values.ttsSampleRate,
      isEnabled: values.isEnabled,
    };
    if (values.sttToken.trim()) doc.sttToken = values.sttToken.trim();
    if (values.ttsToken.trim()) doc.ttsToken = values.ttsToken.trim();

    try {
      await save({ variables: { doc } });
      form.setValue('sttToken', '');
      form.setValue('ttsToken', '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Voice settings saved' });
    } catch {
      // surfaced by the mutation's onError toast
    }
  };

  // Audition the currently-selected voice via the TTS route (uses the override
  // so the admin hears it BEFORE saving). Needs a usable TTS token (DB or env).
  const onPreview = async () => {
    const voice = form.getValues('ttsVoice');
    setPreviewing(true);
    try {
      const blob = await fetchSpeech(PREVIEW_TEXT, undefined, voice);
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.onended = () => URL.revokeObjectURL(url);
      await audioRef.current.play();
    } catch (err) {
      toast({
        title: 'Could not play preview',
        description:
          (err as Error).message ||
          'Configure and save a TTS token first, then try again.',
        variant: 'destructive',
      });
    } finally {
      setPreviewing(false);
    }
  };

  const grouped = groupByGender(voices);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Voice (Chimege)</h1>
          <p className="text-muted-foreground mt-1">
            Bring your own Chimege keys for Mongolian speech-to-text and
            text-to-speech. Stored per workspace; falls back to the
            deployment&apos;s environment keys when left blank.
          </p>
        </div>

        <VoiceStatusSummary config={config} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Form.Field
              control={form.control}
              name="sttToken"
              render={({ field }) => (
                <Form.Item>
                  <div className="flex items-center justify-between">
                    <Form.Label className="flex items-center gap-2">
                      <IconMicrophone className="size-4 text-muted-foreground" />
                      Speech-to-text token
                    </Form.Label>
                    <SourceBadge
                      configured={config?.sttConfigured}
                      source={config?.sttSource}
                    />
                  </div>
                  <Form.Control>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="off"
                      placeholder={
                        config?.sttConfigured
                          ? '•••••••• (leave blank to keep)'
                          : 'Chimege STT token'
                      }
                    />
                  </Form.Control>
                  <Form.Description>
                    Used by <code>/chat/voice/stt</code>. Write-only — never
                    shown again after saving.
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="ttsToken"
              render={({ field }) => (
                <Form.Item>
                  <div className="flex items-center justify-between">
                    <Form.Label className="flex items-center gap-2">
                      <IconVolume className="size-4 text-muted-foreground" />
                      Text-to-speech token
                    </Form.Label>
                    <SourceBadge
                      configured={config?.ttsConfigured}
                      source={config?.ttsSource}
                    />
                  </div>
                  <Form.Control>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="off"
                      placeholder={
                        config?.ttsConfigured
                          ? '•••••••• (leave blank to keep)'
                          : 'Chimege TTS token'
                      }
                    />
                  </Form.Control>
                  <Form.Description>
                    Used by <code>/chat/voice/tts</code>. Write-only — never
                    shown again after saving.
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="ttsVoice"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Voice</Form.Label>
                  <div className="flex items-center gap-2">
                    <Form.Control>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {grouped.female.length > 0 && (
                          <optgroup label="Female">
                            {grouped.female.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {grouped.male.length > 0 && (
                          <optgroup label="Male">
                            {grouped.male.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </Form.Control>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onPreview}
                      disabled={previewing}
                      className="shrink-0"
                    >
                      <IconPlayerPlayFilled size={14} />
                      {previewing ? 'Playing…' : 'Test voice'}
                    </Button>
                  </div>
                  <Form.Description>
                    The voice used to read agent replies aloud. &quot;Test
                    voice&quot; plays a short Mongolian sample using a configured
                    TTS token.
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="ttsSampleRate"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Sample rate</Form.Label>
                  <Form.Control>
                    <select
                      className="w-40 rounded-md border bg-background px-3 py-2 text-sm"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {VOICE_SAMPLE_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate} Hz
                        </option>
                      ))}
                    </select>
                  </Form.Control>
                  <Form.Description>
                    Output fidelity for synthesized speech. 22050 Hz is highest.
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  Enable voice mode for this workspace
                </label>
              )}
            />

            <Button type="submit" disabled={saving}>
              {saved ? (
                <>
                  <IconCheck size={16} /> Saved
                </>
              ) : saving ? (
                'Saving…'
              ) : (
                'Save voice settings'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

// Round-trip readiness banner — mirrors the chat entry-point gate.
const VoiceStatusSummary = ({
  config,
}: {
  config: IMastraVoiceConfigStatus | null;
}) => {
  const enabled = Boolean(config?.enabled);
  return (
    <div className="rounded-lg border p-4 flex items-center justify-between">
      <div className="text-sm">
        <div className="font-medium">Voice mode</div>
        <div className="text-muted-foreground text-xs">
          {enabled
            ? 'Both directions are configured — voice mode is available in chat.'
            : 'Needs a usable STT and TTS token (per-workspace or environment) to appear in chat.'}
        </div>
      </div>
      <Badge variant={enabled ? 'success' : 'secondary'}>
        {enabled ? 'Ready' : 'Unavailable'}
      </Badge>
    </div>
  );
};

function groupByGender(voices: IMastraVoiceOption[]) {
  return {
    female: voices.filter((v) => v.gender === 'female'),
    male: voices.filter((v) => v.gender === 'male'),
  };
}
