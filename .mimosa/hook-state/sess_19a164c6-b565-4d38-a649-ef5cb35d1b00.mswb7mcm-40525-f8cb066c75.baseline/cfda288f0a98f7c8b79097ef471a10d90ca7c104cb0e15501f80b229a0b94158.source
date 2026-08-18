import { InfoCardContent } from '@/block/components/card';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { InfoCard, Label, Textarea } from 'erxes-ui';
import { useState } from 'react';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';

export const ProjectTarget = () => {
  const { project } = useProjectDetail();

  const [targets, setTargets] = useState(project?.targets || {});

  const { concept = '', target = '', advantages = '' } = targets || {};

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

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
                maxLength={160}
                onChange={(e) =>
                  setTargets({ ...targets, concept: e.target.value })
                }
                onBlur={() => {
                  updateProjectGeneralInfo(project?._id || '', {
                    targets,
                  });
                }}
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
                maxLength={160}
                onChange={(e) =>
                  setTargets({ ...targets, target: e.target.value })
                }
                onBlur={() => {
                  updateProjectGeneralInfo(project?._id || '', {
                    targets,
                  });
                }}
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
                maxLength={160}
                onChange={(e) =>
                  setTargets({ ...targets, advantages: e.target.value })
                }
                onBlur={() => {
                  updateProjectGeneralInfo(project?._id || '', {
                    targets,
                  });
                }}
                rows={10}
              />
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
