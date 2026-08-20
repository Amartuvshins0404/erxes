import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandX,
  IconBrandYoutube,
  IconExternalLink,
  IconLinkOff,
} from '@tabler/icons-react';
import { Empty, InfoCard } from 'erxes-ui';
import { ComponentType } from 'react';
import { socialPlatforms } from '../constants/social-platforms';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { SocialPlatform } from '../types/agencyTypes';

const SOCIAL_PLATFORMS: Record<
  SocialPlatform,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  facebook: { label: 'Facebook', icon: IconBrandFacebook },
  instagram: { label: 'Instagram', icon: IconBrandInstagram },
  linkedin: { label: 'LinkedIn', icon: IconBrandLinkedin },
  x: { label: 'X', icon: IconBrandX },
  tiktok: { label: 'TikTok', icon: IconBrandTiktok },
  youtube: { label: 'YouTube', icon: IconBrandYoutube },
};

export const AgencyDetailSocialLinks = () => {
  const { agency } = useAgencyDetail();
  const links = socialPlatforms
    .map((platform) => ({
      platform,
      url: agency?.socialLinks?.[platform],
    }))
    .filter((link): link is { platform: SocialPlatform; url: string } =>
      Boolean(link.url),
    );

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Social links">
        <InfoCard.Content>
          {links.length ? (
            <div className="grid grid-cols-2 gap-2">
              {links.map(({ platform, url }) => {
                const { label, icon: Icon } = SOCIAL_PLATFORMS[platform];

                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-accent-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {url}
                      </p>
                    </div>
                    <IconExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          ) : (
            <Empty>
              <Empty.Content>
                <Empty.Header>
                  <Empty.Media>
                    <IconLinkOff />
                  </Empty.Media>
                  <Empty.Title>No social links</Empty.Title>
                  <Empty.Description>
                    This agency has not shared any social profiles yet.
                  </Empty.Description>
                </Empty.Header>
              </Empty.Content>
            </Empty>
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
