import { IconListDetails } from '@tabler/icons-react';
import { Button, cn, Collapsible, Empty, InfoCard, Spinner } from 'erxes-ui';
import {
  FieldsInGroup,
  MultipleFieldsInGroup,
  useFieldGroups,
} from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { LEGACY_ROOT_CAR_CONTENT_TYPE } from '~/lib/constants';

type MutateHook = () => {
  mutate: (variables: { _id: string } & Record<string, unknown>) => void;
  loading: boolean;
};

const CarFieldGroupContent = ({
  group,
  contentType,
  propertiesData,
  mutateHook,
  id,
}: {
  group: any;
  id: string;
  contentType: string;
  propertiesData: Record<string, any>;
  mutateHook: MutateHook;
}) => {
  if (group?.configs?.isMultiple) {
    return (
      <MultipleFieldsInGroup
        group={group}
        id={id}
        contentType={contentType}
        propertiesData={propertiesData}
        mutateHook={mutateHook}
      />
    );
  }

  return (
    <Collapsible key={group._id} className="group" defaultOpen>
      <Collapsible.Trigger asChild>
        <Button variant="secondary" className="w-full justify-start">
          <Collapsible.TriggerIcon />
          {group.name}
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-4">
        <FieldsInGroup
          group={group}
          id={id}
          contentType={contentType}
          propertiesData={propertiesData}
          mutateHook={mutateHook}
        />
      </Collapsible.Content>
    </Collapsible>
  );
};

export const CarPropertiesInDetail = ({
  title,
  fieldContentType,
  propertiesData,
  mutateHook,
  id,
  className,
}: {
  title: string;
  fieldContentType: string;
  propertiesData: Record<string, any>;
  mutateHook: MutateHook;
  id: string;
  className?: string;
}) => {
  const { t } = useTranslation('car');
  const { fieldGroups, loading: fieldGroupsLoading } = useFieldGroups({
    contentType: fieldContentType,
  });
  const {
    fieldGroups: legacyFieldGroups,
    loading: legacyFieldGroupsLoading,
  } = useFieldGroups({
    contentType: LEGACY_ROOT_CAR_CONTENT_TYPE,
  });

  if (fieldGroupsLoading || legacyFieldGroupsLoading) {
    return <Spinner containerClassName="py-6" />;
  }

  const fieldGroupsById = new Map<string, any>();

  [...fieldGroups, ...legacyFieldGroups].forEach((group: any) => {
    fieldGroupsById.set(group._id, group);
  });

  const mergedFieldGroups = Array.from(fieldGroupsById.values());

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <InfoCard title={title}>
        <InfoCard.Content>
          {mergedFieldGroups.length ? (
            mergedFieldGroups.map((group: any) => (
              <CarFieldGroupContent
                key={group._id}
                group={group}
                id={id}
                contentType={group.contentType || fieldContentType}
                propertiesData={propertiesData}
                mutateHook={mutateHook}
              />
            ))
          ) : (
            <Empty>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconListDetails />
                </Empty.Media>
                <Empty.Title>
                  {t('No car properties found', {
                    defaultValue: 'No car properties found',
                  })}
                </Empty.Title>
                <Empty.Description>
                  {t(
                    'Legacy service and diagnostic fields appear here after their property definitions are migrated.',
                    {
                      defaultValue:
                        'Legacy service and diagnostic fields appear here after their property definitions are migrated.',
                    },
                  )}
                </Empty.Description>
              </Empty.Header>
            </Empty>
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
