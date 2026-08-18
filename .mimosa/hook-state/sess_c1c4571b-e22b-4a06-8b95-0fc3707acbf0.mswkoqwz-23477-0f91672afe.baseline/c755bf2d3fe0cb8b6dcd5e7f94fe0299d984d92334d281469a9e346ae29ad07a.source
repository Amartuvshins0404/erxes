import { InfoCardContent } from '@/block/components/card';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { InfoCard, Input, Label } from 'erxes-ui';
import { useState } from 'react';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';

export const ProjectSpecification = () => {
  const { project } = useProjectDetail();

  const [counts, setCounts] = useState(project?.counts || {});
  const [metrics, setMetrics] = useState(project?.metrics || {});

  const {
    buildings = 0,
    units = 0,
    parking = 0,
    parkingUnderground = 0,
    playground = 0,
  } = counts || {};

  const {
    area = 0,
    totalArea = 0,
    averageFloors = 0,
    greenSpace = 0,
  } = metrics || {};

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

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
                <Input
                  placeholder="0"
                  value={buildings}
                  onChange={(e) =>
                    setCounts({ ...counts, buildings: Number(e.target.value) })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      counts,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Total Units</span>
                </Label>
                <Input
                  placeholder="0"
                  value={units}
                  onChange={(e) =>
                    setCounts({ ...counts, units: Number(e.target.value) })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      counts,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Average floors</span>
                </Label>
                <Input
                  placeholder="0"
                  value={averageFloors}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      averageFloors: Number(e.target.value),
                    })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      metrics,
                    });
                  }}
                />
              </div>
            </div>

            <div className="gap-3 grid grid-cols-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Total area (m²)</span>
                </Label>
                <Input
                  placeholder="0"
                  value={totalArea}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      totalArea: Number(e.target.value),
                    })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      metrics,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Area (m²)</span>
                </Label>
                <Input
                  placeholder="0"
                  value={area}
                  onChange={(e) =>
                    setMetrics({ ...metrics, area: Number(e.target.value) })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      metrics,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label asChild>
                  <span>Green space (m²)</span>
                </Label>
                <Input
                  placeholder="0"
                  value={greenSpace}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      greenSpace: Number(e.target.value),
                    })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      metrics,
                    });
                  }}
                />
              </div>
            </div>

            <div className="gap-3 grid grid-cols-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Total surface parking</span>
                </Label>
                <Input
                  placeholder="0"
                  value={parking}
                  onChange={(e) =>
                    setCounts({ ...counts, parking: Number(e.target.value) })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      counts,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label asChild>
                  <span>Total underground parking</span>
                </Label>
                <Input
                  placeholder="0"
                  value={parkingUnderground}
                  onChange={(e) =>
                    setCounts({
                      ...counts,
                      parkingUnderground: Number(e.target.value),
                    })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      counts,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label asChild>
                  <span>Total playground</span>
                </Label>
                <Input
                  placeholder="0"
                  value={playground}
                  onChange={(e) =>
                    setCounts({ ...counts, playground: Number(e.target.value) })
                  }
                  onBlur={() => {
                    updateProjectGeneralInfo(project?._id || '', {
                      counts,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
