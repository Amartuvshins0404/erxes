import { InfoCard, InfoCardContent } from '@/block/components/card';
import { UploadButton, UploadCard } from '@/block/components/UploadCard';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { Button, Input, Label, Textarea } from 'erxes-ui';
import { useState } from 'react';

export const ProjectDetailSeo = () => {
  const [seoValue, setSeoValue] = useState<string | undefined>(undefined);
  return (
    <div className="p-8 grid grid-cols-2 gap-6">
      <InfoCard title="SEO">
        <InfoCardContent>
          <div className="space-y-2">
            <Label asChild>
              <div>Url Slug</div>
            </Label>
            <div className="flex items-center gap-2">
              <div className="text-accent-foreground">block.mn/projects/</div>
              <Input />
            </div>
          </div>
          <div className="space-y-2">
            <Label asChild>
              <div>META TITLE</div>
            </Label>
            <Input />
          </div>
          <div className="space-y-2">
            <Label asChild>
              <div>META DESCRIPTION</div>
            </Label>
            <Textarea />
          </div>
        </InfoCardContent>
      </InfoCard>
      <UploadCard title="SOCIAL SHARE IMAGE" value={seoValue} fit="cover">
        <div className="grid grid-cols-3 gap-2">
          <UploadButton value={seoValue} />
          <CoverImageButton setSeoValue={setSeoValue} />
        </div>
      </UploadCard>
    </div>
  );
};

export const CoverImageButton = ({
  setSeoValue,
}: {
  setSeoValue: (value: string) => void;
}) => {
  const { project } = useProjectDetail();
  return (
    <Button
      variant="secondary"
      onClick={() => setSeoValue(project?.coverImage || '')}
      disabled={!project?.coverImage}
      className="w-full"
    >
      Use cover image
    </Button>
  );
};
