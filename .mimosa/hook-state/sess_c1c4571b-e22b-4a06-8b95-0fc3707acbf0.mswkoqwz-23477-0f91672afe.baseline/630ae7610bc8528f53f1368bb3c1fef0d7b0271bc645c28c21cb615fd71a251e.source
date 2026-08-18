import { InfoCardContent } from '@/block/components/card';
import { SOCIAL_LINKS, WEEKDAYS } from '@/block/constants/socialLinks';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { Combobox, InfoCard, Input, Label, PhoneDisplay, PhoneField, PopoverScoped, RecordTableInlineCell, Switch, Textarea } from 'erxes-ui';
import { useState } from 'react';
import { ProjectTime } from './ProjectTime';

export const ProjectContact = () => {
  const { project } = useProjectDetail();

  const [contacts, setContacts] = useState(project?.contacts || {});

  const {
    phones = [],
    email = '',
    website = '',
    manager = '',
    address = '',
  } = project?.contacts || {};

  const [schedules, setSchedules] = useState(
    project?.schedules || {
      monday: { open: true, startOfDay: '08:00', endOfDay: '17:00' },
      tuesday: { open: true, startOfDay: '08:00', endOfDay: '17:00' },
      wednesday: { open: true, startOfDay: '08:00', endOfDay: '17:00' },
      thursday: { open: true, startOfDay: '08:00', endOfDay: '17:00' },
      friday: { open: true, startOfDay: '08:00', endOfDay: '17:00' },
      saturday: { open: false, startOfDay: '', endOfDay: '' },
      sunday: { open: false, startOfDay: '', endOfDay: '' },
    },
  );

  return (
    <div className="p-8 h-full flex flex-col gap-3">
      <InfoCard
        title="Project Target"
        description="Project target"
        className="h-full"
      >
        <InfoCardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2 flex flex-col gap-3">
              <div className="space-y-2">
                <Label asChild>
                  <span>Phone</span>
                </Label>
                <PopoverScoped>
                  <Combobox.Trigger>
                    <PhoneDisplay
                      primaryPhone={phones?.[0] || ''}
                      phones={phones || []}
                    />
                  </Combobox.Trigger>
                  <RecordTableInlineCell.Content className="w-72">
                    <PhoneField
                      recordId={''}
                      primaryPhone={phones?.[0] || ''}
                      phones={phones || []}
                      onValueChange={() => {}}
                    />
                  </RecordTableInlineCell.Content>
                </PopoverScoped>
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Email</span>
                </Label>
                <Input placeholder="Имэйл оруулна уу" value={email} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Website</span>
                </Label>
                <Input placeholder="Веб хаяг оруулна уу" value={website} />
              </div>
              <div className="space-y-2">
                <Label asChild>
                  <span>Manager</span>
                </Label>
                <Input placeholder="Нэр, утас, имэйл" value={manager} />
              </div>
            </div>
            <div className="col-span-2 space-y-2 flex flex-col">
              <Label asChild>
                <span>Address</span>
              </Label>
              <Textarea
                className="flex-1"
                placeholder="Хаяг оруулна уу"
                value={address}
              />
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>

      <div className="grid grid-cols-5 gap-3">
        <InfoCard
          title="Project Schedules"
          description="Project schedules"
          className="h-full col-span-3"
        >
          <InfoCardContent className="h-full">
            <div className="col-span-4 space-y-2">
              <div className="col-span-2 flex flex-col gap-3">
                {WEEKDAYS.map((weekday) => (
                  <div
                    className="space-y-2 grid grid-cols-2 items-center align-center gap-2"
                    key={weekday.value}
                  >
                    <div className="flex items-center gap-3 m-0">
                      <Switch
                        className="m-0"
                        checked={schedules[weekday.value]?.open || false}
                      />
                      <Label asChild>
                        <span className="m-0">{weekday.label}</span>
                      </Label>
                    </div>

                    <div className="flex gap-3 items-center">
                      <ProjectTime
                        value={schedules[weekday.value]?.startOfDay}
                        disabled={!schedules[weekday.value]?.open}
                      />
                      -
                      <ProjectTime
                        value={schedules[weekday.value]?.endOfDay}
                        disabled={!schedules[weekday.value]?.open}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* </div> */}
            </div>
          </InfoCardContent>
        </InfoCard>

        <InfoCard
          title="Project Social Links"
          description="Project social links"
          className="h-full col-span-2"
        >
          <InfoCardContent>
            <div className="col-span-2 flex flex-col gap-3">
              {SOCIAL_LINKS.map((item: { label: string; value: string }) => (
                <div className="space-y-2" key={item.value}>
                  <Label asChild>
                    <span>{item.label}</span>
                  </Label>
                  <Input
                    placeholder="Холбоос оруулна уу"
                    value={contacts[item.value]}
                  />
                </div>
              ))}
            </div>
          </InfoCardContent>
        </InfoCard>
      </div>
    </div>
  );
};
