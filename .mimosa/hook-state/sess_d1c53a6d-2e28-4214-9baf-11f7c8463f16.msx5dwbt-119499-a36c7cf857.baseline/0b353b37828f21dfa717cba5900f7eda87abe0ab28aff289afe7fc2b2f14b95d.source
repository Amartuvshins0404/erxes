import { InfoCardContent } from '@/block/components/card';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { InfoCard, Label, Textarea } from 'erxes-ui';

export const ProjectTarget = () => {
  const { project } = useProjectDetail();

  const { concept = '', target = '', advantages = '' } = project?.targets || {};

  return (
    <div className="p-8 h-full">
      <InfoCard
        title="Project Target"
        description="Project target"
        className="h-full"
      >
        <InfoCardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label asChild>
                <span>Concept</span>
              </Label>
              <Textarea
                placeholder="Концепцын мессеж бичнэ үү"
                value={concept}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label asChild>
                <span>Target</span>
              </Label>
              <Textarea
                placeholder="Зорилтот бүлгийг бичнэ үү"
                value={target}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label asChild>
                <span>Advantages</span>
              </Label>
              <Textarea
                placeholder="Давуу талуудыг бичнэ үү"
                value={advantages}
                rows={10}
              />
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
