import { InfoCardContent } from '@/block/components/card';
import { DatePicker, InfoCard, Label, Select } from 'erxes-ui';
import { PROJECT_STATUS_OPTIONS } from '../constants/project';
import { useProjectDetail } from '../hooks/useProjectDetail';

export const ProjectInsider = () => {
  const { project } = useProjectDetail();

  const { startDate, endDate, status } = project || {};

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
                  onChange={() => {}}
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
                  onChange={() => {}}
                />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Status</span>
                </Label>
                <Select value={status}>
                  <Select.Trigger className="h-8">
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
