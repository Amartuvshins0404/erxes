import { InfoCardContent } from '@/block/components/card';
import { DatePicker, InfoCard, Label, Select } from 'erxes-ui';
import { useState } from 'react';
import { PROJECT_STATUS_OPTIONS } from '../constants/project';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';
import { IProject, ProjectStatus } from '../types/projectTypes';

export const ProjectInsider = () => {
  const { project } = useProjectDetail();

  const [projectInfo, setProjectInfo] = useState(
    project || ({} as Partial<IProject>),
  );

  const { startDate, endDate, status } = projectInfo;

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  return (
    <div className="p-8">
      <InfoCard
        title="Project Specifications"
        description="Project specifications"
      >
        <InfoCardContent>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Start Date</span>
                </Label>
                <DatePicker
                  mode="single"
                  placeholder="Select date"
                  value={startDate ? new Date(startDate) : undefined}
                  onChange={(date) => {
                    const dateValue = Array.isArray(date) ? date[0] : date;

                    const newStart = dateValue
                      ? new Date(dateValue)
                      : undefined;

                    setProjectInfo((prev) => ({
                      ...prev,
                      startDate: newStart,
                    }));

                    updateProjectGeneralInfo(project?._id || '', {
                      startDate: newStart,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>End Date</span>
                </Label>
                <DatePicker
                  mode="single"
                  placeholder="Select date"
                  value={endDate ? new Date(endDate) : undefined}
                  onChange={(date) => {
                    const dateValue = Array.isArray(date) ? date[0] : date;

                    const newEnd = dateValue ? new Date(dateValue) : undefined;

                    setProjectInfo((prev) => ({ ...prev, endDate: newEnd }));

                    updateProjectGeneralInfo(project?._id || '', {
                      endDate: newEnd,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Status</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setProjectInfo((prev) => ({
                      ...prev,
                      status: value as ProjectStatus,
                    }))
                  }
                >
                  <Select.Trigger
                    className="h-8"
                    onBlur={() => {
                      updateProjectGeneralInfo(project?._id || '', {
                        status,
                      });
                    }}
                  >
                    <Select.Value placeholder="Select status" />
                  </Select.Trigger>
                  <Select.Content>
                    {PROJECT_STATUS_OPTIONS.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
