import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandX,
  IconBrandYoutube,
  IconExternalLink,
  IconLink,
} from '@tabler/icons-react';
import { cn, Input } from 'erxes-ui';
import { forwardRef } from 'react';

const getSocialIcon = (url: string) => {
  if (!url) return <IconLink size={16} className="text-muted-foreground" />;

  const lower = url.toLowerCase();

  if (lower.includes('facebook.com'))
    return <IconBrandFacebook size={16} className="text-[#1877F2]" />;
  if (lower.includes('instagram.com'))
    return <IconBrandInstagram size={16} className="text-[#E1306C]" />;
  if (lower.includes('linkedin.com'))
    return <IconBrandLinkedin size={16} className="text-[#0A66C2]" />;
  if (lower.includes('tiktok.com'))
    return <IconBrandTiktok size={16} className="text-[#010101]" />;
  if (lower.includes('x.com') || lower.includes('twitter.com'))
    return <IconBrandX size={16} className="text-[#000000]" />;
  if (lower.includes('youtube.com'))
    return <IconBrandYoutube size={16} className="text-[#FF0000]" />;

  return <IconLink size={16} className="text-muted-foreground" />;
};

interface SocialLinkInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value?: string | null;
}

export const SocialLinkInput = forwardRef<
  HTMLInputElement,
  SocialLinkInputProps
>(({ value, className, ...props }, ref) => {
  const url = value ?? '';

  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3 flex items-center pointer-events-none">
        {getSocialIcon(url)}
      </div>
      <Input
        ref={ref}
        value={url}
        className={cn('pl-9', className)}
        placeholder="https://"
        {...props}
      />
      <div className="absolute right-3 flex items-center pointer-events-none">
        <a
          href={url}
          target="_blank"
          className="cursor-pointer pointer-events-auto"
        >
          <IconExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
});

SocialLinkInput.displayName = 'SocialLinkInput';
