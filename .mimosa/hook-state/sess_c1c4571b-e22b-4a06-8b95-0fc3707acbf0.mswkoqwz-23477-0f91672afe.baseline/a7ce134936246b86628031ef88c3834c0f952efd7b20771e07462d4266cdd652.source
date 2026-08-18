import { ActivityLogCustomActivity, TActivityLog } from 'ui-modules';
import { ActivityLogs } from 'ui-modules';
import { useTranslation } from 'react-i18next';

const Sentence = ({ children }: { children: React.ReactNode }) => (
  <span className="flex flex-wrap items-center gap-1 text-sm">{children}</span>
);

const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="text-muted-foreground">{children}</span>
);

const CreatedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('created plan')}</Muted>
      {activity.changes?.name && (
        <span className="font-medium">"{activity.changes.name}"</span>
      )}
      {activity.changes?.price != null && (
        <Muted>
          · {activity.changes.price.toLocaleString()}{' '}
          {activity.changes.currency} / {activity.changes.durationMonths}mo
        </Muted>
      )}
    </Sentence>
  );
};

const UpdatedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  const prev = activity.changes?.prev;
  const current = activity.changes?.current;

  const changedFields = prev && current
    ? Object.keys(current).filter(
        (k) => JSON.stringify(prev[k]) !== JSON.stringify(current[k]),
      )
    : [];

  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('updated plan')}</Muted>
      {current?.name && <span className="font-medium">"{current.name}"</span>}
      {changedFields.length > 0 && (
        <Muted>
          · {t('changed')} {changedFields.join(', ')}
        </Muted>
      )}
    </Sentence>
  );
};

const DeactivatedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('deactivated plan')}</Muted>
    </Sentence>
  );
};

export const membershipPlanCustomActivities: ActivityLogCustomActivity[] = [
  {
    type: 'membership_plan.created',
    render: (activity) => <CreatedRow activity={activity} />,
  },
  {
    type: 'membership_plan.updated',
    render: (activity) => <UpdatedRow activity={activity} />,
  },
  {
    type: 'membership_plan.deactivated',
    render: (activity) => <DeactivatedRow activity={activity} />,
  },
];
