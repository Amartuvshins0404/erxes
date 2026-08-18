import { Button, Form, InfoCard } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm, UseFormReturn } from 'react-hook-form';
import { AgencySocialLinksValues, SocialPlatform } from '../types/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agencySocialLinksSchema } from '../schema/form';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { useEffect, useState } from 'react';
import { socialPlatforms } from '../constants/social-platforms';
import { SocialLinkInput } from '../form/SocialLinkInput';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export const AgencyProfileSocialLinks = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Social Links"
        description="Agency's social media links such as Facebook, Twitter, LinkedIn, etc."
      >
        <InfoCard.Content>
          <AgencySocialLinksInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencySocialLinksInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const { updateAgency } = useUpdateAgency();
  const form = useForm<AgencySocialLinksValues>({
    mode: 'onBlur',
    resolver: zodResolver(agencySocialLinksSchema),
    defaultValues: {
      socialLinks: agencyInfo?.socialLinks || {},
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    updateAgency({ variables: { input: values } });
  });

  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <SocialLinksField form={form} />
        <div className="w-full flex items-center justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
};

export const SocialLinksField = ({
  form,
  disabled = false,
}: {
  form: UseFormReturn<AgencySocialLinksValues>;
  disabled?: boolean;
}) => {
  const socialLinks = form.watch('socialLinks');
  const agencySocialPlatforms = Object.keys(
    socialLinks ?? {},
  ) as SocialPlatform[];
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(
    agencySocialPlatforms.length > 0 ? agencySocialPlatforms : ['facebook'],
  );

  useEffect(() => {
    if (agencySocialPlatforms.length > 0) {
      setPlatforms(agencySocialPlatforms);
    }
  }, [socialLinks]);

  const usedPlatforms = platforms;
  const availablePlatforms = socialPlatforms.filter(
    (p) => !usedPlatforms.includes(p),
  );

  const addRow = () => {
    if (availablePlatforms.length === 0) return;
    setPlatforms((prev) => [...prev, availablePlatforms[0]]);
  };

  const removeRow = (platform: SocialPlatform) => {
    setPlatforms((prev) => prev.filter((p) => p !== platform));
    form.setValue(`socialLinks.${platform}`, undefined);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="font-mono uppercase font-semibold text-xs text-accent-foreground">
        Social Links
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map((platform) => (
          <Form.Field<AgencySocialLinksValues, `socialLinks.${typeof platform}`>
            control={form.control}
            name={`socialLinks.${platform}`}
            render={({ field }) => (
              <Form.Item className="grow flex items-start gap-2 w-full">
                <Form.Control>
                  <SocialLinkInput
                    {...field}
                    value={(field.value as string) ?? ''}
                    placeholder={`https://${platform}.com/...`}
                    disabled={disabled}
                  />
                </Form.Control>
                <Form.Message />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(platform)}
                  disabled={disabled}
                  className="hover:text-destructive"
                >
                  <IconTrash size={16} />
                </Button>
              </Form.Item>
            )}
          />
        ))}
      </div>
      {availablePlatforms.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
          className="w-full"
        >
          <IconPlus size={14} className="mr-1" />
          Add social link
        </Button>
      )}
    </fieldset>
  );
};
