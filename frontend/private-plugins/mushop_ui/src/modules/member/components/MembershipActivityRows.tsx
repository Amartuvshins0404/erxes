import { ActivityLogCustomActivity, TActivityLog } from 'ui-modules';
import { ActivityLogs } from 'ui-modules';
import { useTranslation } from 'react-i18next';

const Sentence = ({ children }: { children: React.ReactNode }) => (
  <span className="flex flex-wrap items-center gap-1 text-sm">{children}</span>
);

const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="text-muted-foreground">{children}</span>
);

const Bold = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium">{children}</span>
);

const CreatedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('activated membership')}</Muted>
      {activity.changes?.planId && (
        <Bold>
          {t('plan')} {activity.changes.planId}
        </Bold>
      )}
      {activity.changes?.amount != null && (
        <Muted>· {activity.changes.amount.toLocaleString()} {activity.changes.currency || 'MNT'}</Muted>
      )}
    </Sentence>
  );
};

const ExtendedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  const prev = activity.changes?.prev?.endDate;
  const current = activity.changes?.current?.endDate;
  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '?';

  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('renewed membership')}</Muted>
      {prev && current && (
        <Muted>· {fmt(prev)} → {fmt(current)}</Muted>
      )}
    </Sentence>
  );
};

const EndDateAdjustedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  const prev = activity.changes?.prev?.endDate;
  const current = activity.changes?.current?.endDate;
  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '?';

  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('adjusted end date')}</Muted>
      {prev && current && (
        <Muted>· {fmt(prev)} → {fmt(current)}</Muted>
      )}
    </Sentence>
  );
};

const StatusChangedRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  const prev = activity.changes?.prev?.status;
  const current = activity.changes?.current?.status;

  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('changed status')}</Muted>
      {prev && current && (
        <Muted>· {prev} → {current}</Muted>
      )}
    </Sentence>
  );
};

const CancelledRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  return (
    <Sentence>
      <ActivityLogs.ActorName activity={activity} />
      <Muted>{t('cancelled membership')}</Muted>
    </Sentence>
  );
};

const ExpiredRow = ({ activity }: { activity: TActivityLog }) => {
  const { t } = useTranslation('mushop');
  const endDate = activity.changes?.endDate || activity.metadata?.endDate;
  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <Sentence>
      <Muted>{t('Membership expired')}</Muted>
      {fmt(endDate) && <Muted>{t('on {{date}}', { date: fmt(endDate) })}</Muted>}
    </Sentence>
  );
};

export const membershipCustomActivities: ActivityLogCustomActivity[] = [
  {
    type: 'membership.created',
    render: (activity) => <CreatedRow activity={activity} />,
  },
  {
    type: 'membership.extended',
    render: (activity) => <ExtendedRow activity={activity} />,
  },
  {
    type: 'membership.endDateAdjusted',
    render: (activity) => <EndDateAdjustedRow activity={activity} />,
  },
  {
    type: 'membership.statusChanged',
    render: (activity) => <StatusChangedRow activity={activity} />,
  },
  {
    type: 'membership.cancelled',
    render: (activity) => <CancelledRow activity={activity} />,
  },
  {
    type: 'membership.expired',
    render: (activity) => <ExpiredRow activity={activity} />,
  },
];
