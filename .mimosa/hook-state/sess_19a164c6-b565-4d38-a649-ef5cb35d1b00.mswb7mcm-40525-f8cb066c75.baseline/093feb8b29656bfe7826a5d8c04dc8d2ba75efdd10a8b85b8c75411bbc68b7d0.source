import { InfoCardContent } from '@/block/components/card';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { InfoCard, Input, Label } from 'erxes-ui';

export const ProjectSpecification = () => {
  const { project } = useProjectDetail();

  const {
    buildings = 0,
    units = 0,
    parking = 0,
    parkingUnderground = 0,
    playground = 0,
  } = project?.counts || {};

  const {
    area = 0,
    totalArea = 0,
    averageFloors = 0,
    greenSpace = 0,
  } = project?.metrics || {};

  return (
    <div className="p-8">
      <InfoCard
        title="Project Specifications"
        description="Project specifications"
      >
        <InfoCardContent>
          <div className="flex flex-col gap-3">
            <div className="gap-3 grid grid-cols-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Total building</span>
                </Label>
                <Input placeholder="0" value={buildings} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Total Units</span>
                </Label>
                <Input placeholder="0" value={units} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Average floors</span>
                </Label>
                <Input placeholder="0" value={averageFloors} />
              </div>
            </div>
            <div className="gap-3 grid grid-cols-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Area (m²)</span>
                </Label>
                <Input placeholder="0" value={area} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Total area (m²)</span>
                </Label>
                <Input placeholder="0" value={totalArea} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Green space (m²)</span>
                </Label>
                <Input placeholder="0" value={greenSpace} />
              </div>
            </div>

            <div className="gap-3 grid grid-cols-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Total surface parking</span>
                </Label>
                <Input placeholder="0" value={parking} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Total underground parking</span>
                </Label>
                <Input placeholder="0" value={parkingUnderground} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Total playground</span>
                </Label>
                <Input placeholder="0" value={playground} />
              </div>
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
