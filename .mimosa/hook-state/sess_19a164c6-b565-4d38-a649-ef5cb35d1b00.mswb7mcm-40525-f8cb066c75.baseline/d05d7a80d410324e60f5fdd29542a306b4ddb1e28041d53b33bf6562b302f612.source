import { Control, useWatch } from 'react-hook-form';
import { Form, Input, Select, Checkbox, Label } from 'erxes-ui';
import { Button } from 'erxes-ui';
import { DAYS_OF_WEEK, GENDER_RESTRICTIONS } from '../utils/scheduleUtils';
import { useQuery } from '@apollo/client';
import { ONE_FIT_ACTIVITY_TYPES } from '~/modules/activity-type/graphql/activityTypeQueries';
import { EnumCursorDirection, EnumCursorMode } from 'erxes-ui';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import type { OneFitActivityType } from '~/modules/activity-type/types/activityType';

interface DailyScheduleFieldsProps {
  index: number;
  control: Control<any>;
  onRemove: () => void;
  providerId?: string;
  showActivityTypeSelect?: boolean;
}

export function DailyScheduleFields({
  index,
  control,
  onRemove,
  providerId,
  showActivityTypeSelect = true,
}: DailyScheduleFieldsProps) {
  const selectedProviderId = useWatch({ control, name: 'providerId' });
  const effectiveProviderId = providerId || selectedProviderId;

  const { data: activityTypesData, loading: activityTypesLoading } = useQuery(
    ONE_FIT_ACTIVITY_TYPES,
    {
      variables: {
        providerId: effectiveProviderId || undefined,
        isActive: true,
        limit: 100,
        cursor: undefined,
        cursorMode: EnumCursorMode.INCLUSIVE,
        direction: EnumCursorDirection.FORWARD,
      },
      skip: !effectiveProviderId || !showActivityTypeSelect,
    },
  );

  const activityTypes = activityTypesData?.oneFitActivityTypes?.list || [];

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Schedule {index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Form.Field
          control={control}
          name={`dailySchedules.${index}.daysOfWeek`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Days of Week *</Form.Label>
              <Form.Control>
                <div className="flex flex-wrap gap-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${index}-${day.value}`}
                        checked={field.value?.includes(day.value) ?? false}
                        onCheckedChange={(checked) => {
                          const current = field.value ?? [];
                          if (checked) {
                            field.onChange([...current, day.value]);
                          } else {
                            field.onChange(
                              current.filter((d) => d !== day.value),
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`${index}-${day.value}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        {showActivityTypeSelect ? (
          <Form.Field
            control={control}
            name={`dailySchedules.${index}.activityTypeId`}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Activity Type *</Form.Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!effectiveProviderId || activityTypesLoading}
                >
                  <Form.Control>
                    <Select.Trigger>
                      <Select.Value placeholder="Select activity type" />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {!effectiveProviderId ? (
                      <Select.Item value="__disabled__" disabled>
                        Please select a provider first
                      </Select.Item>
                    ) : activityTypes.length === 0 ? (
                      <Select.Item value="__no_activities__" disabled>
                        No activities available for this provider
                      </Select.Item>
                    ) : (
                      activityTypes.map((activityType: OneFitActivityType) => (
                        <Select.Item
                          key={activityType._id}
                          value={activityType._id}
                        >
                          {getLocalizedString(activityType.name, 'en')}
                        </Select.Item>
                      ))
                    )}
                  </Select.Content>
                </Select>
                <Form.Message />
              </Form.Item>
            )}
          />
        ) : (
          <Form.Field
            control={control}
            name={`dailySchedules.${index}.activityTypeId`}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Activity Type ID *</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder="Enter activity type ID" />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Form.Field
          control={control}
          name={`dailySchedules.${index}.genderRestriction`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Gender Restriction *</Form.Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Form.Control>
                  <Select.Trigger>
                    <Select.Value placeholder="Select restriction" />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {GENDER_RESTRICTIONS.map((restriction) => (
                    <Select.Item
                      key={restriction.value}
                      value={restriction.value}
                    >
                      {restriction.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={control}
          name={`dailySchedules.${index}.startTime`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Start Time (HH:mm) *</Form.Label>
              <Form.Control>
                <Input {...field} type="time" placeholder="09:00" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={control}
          name={`dailySchedules.${index}.endTime`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>End Time (HH:mm) *</Form.Label>
              <Form.Control>
                <Input {...field} type="time" placeholder="17:00" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </div>
      <Form.Field
        control={control}
        name={`dailySchedules.${index}.dailyLimit`}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Daily Limit *</Form.Label>
            <Form.Control>
              <Input
                {...field}
                type="number"
                min="1"
                placeholder="Enter daily limit"
                value={field.value || ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value, 10) : 1,
                  )
                }
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
    </div>
  );
}
