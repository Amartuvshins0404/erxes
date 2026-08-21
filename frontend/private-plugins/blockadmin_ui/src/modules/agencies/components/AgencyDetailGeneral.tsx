import { IconPhotoOff } from '@tabler/icons-react';
import { BlockEditorReadOnly, InfoCard, readImage } from 'erxes-ui';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { AgencyDetailField } from './AgencyDetailField';

/**
 * Agencies write their introduction in the block editor, so the stored value is
 * serialized blocks. `BlockEditorReadOnly` also renders the plain strings that
 * agencies saved before the editor was introduced.
 */
const AgencyIntroductionText = ({ content }: { content?: string }) => {
  if (!content) {
    return <p className="text-sm font-medium">—</p>;
  }

  return <BlockEditorReadOnly content={content} className="text-sm" />;
};

export const AgencyDetailGeneral = () => {
  const { agency } = useAgencyDetail();

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Branding" description="Logo and cover image">
        <InfoCard.Content className="gap-4">
          <AgencyDetailField label="Cover image">
            {agency?.coverImage?.url ? (
              <img
                src={readImage(agency.coverImage.url)}
                alt={`${agency.name} cover`}
                className="w-full max-w-xl aspect-video object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full max-w-xl aspect-video rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <IconPhotoOff className="size-6" />
                <span className="text-xs">No cover image uploaded</span>
              </div>
            )}
          </AgencyDetailField>

          <AgencyDetailField label="Logo">
            {agency?.logo?.url ? (
              <img
                src={readImage(agency.logo.url)}
                alt={`${agency.name} logo`}
                className="size-16 object-contain rounded-lg border bg-background"
              />
            ) : (
              <div className="size-16 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                <IconPhotoOff className="size-5" />
              </div>
            )}
          </AgencyDetailField>
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title="Basic information">
        <InfoCard.Content className="grid grid-cols-3 gap-6">
          <AgencyDetailField label="Official name" value={agency?.name} />
          <AgencyDetailField label="Brand name" value={agency?.brandName} />
          <AgencyDetailField label="Type" value={agency?.type} />
          <AgencyDetailField
            label="Established year"
            value={agency?.dateFounded}
          />
          <AgencyDetailField label="Website" className="flex flex-col">
            {agency?.website ? (
              <a
                href={agency.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline break-all"
              >
                {agency.website}
              </a>
            ) : (
              <p className="text-sm font-medium">—</p>
            )}
          </AgencyDetailField>
          <AgencyDetailField label="Agency ID" value={agency?._id} />
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title="Introduction">
        <InfoCard.Content className="gap-6">
          <AgencyDetailField label="Brief info">
            <AgencyIntroductionText content={agency?.brief} />
          </AgencyDetailField>
          <AgencyDetailField label="Full description">
            <AgencyIntroductionText content={agency?.description} />
          </AgencyDetailField>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
