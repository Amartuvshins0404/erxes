import { useQuery } from '@apollo/client';
import { useQueryState } from 'erxes-ui';
import {
  UNIT_CONTRACT_OVERVIEW,
  UNIT_OPPTY_OVERVIEW,
  UNIT_OFFER_STATS,
} from '@/unit/graphql/unitStatsQueries';
import {
  IconFileText,
  IconFileDescription,
  IconTarget,
  IconArrowRight,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

type StageCount = { name: string; count: number };

const StatCol = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xl font-bold tabular-nums">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const OverviewCard = ({
  icon: Icon,
  color,
  title,
  total,
  stages,
  linkLabel,
  onLink,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  title: string;
  total: number;
  stages: StageCount[];
  linkLabel: string;
  onLink: () => void;
}) => (
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}18` }}>
        <Icon className="size-4" style={{ color }} />
      </div>
      <span className="text-sm font-semibold">{title}</span>
    </div>

    <div className="flex items-end gap-6 flex-wrap">
      <StatCol label="Total" value={total} />
      {stages.map((s) => (
        <StatCol key={s.name} label={s.name} value={s.count} />
      ))}
    </div>

    <button
      onClick={onLink}
      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline w-fit"
    >
      {linkLabel}
      <IconArrowRight className="size-3" />
    </button>
  </div>
);

export const UnitOverviewCards = ({
  unitId,
  projectId,
}: {
  unitId?: string;
  projectId?: string;
}) => {
  const [, setActiveUnitTab] = useQueryState('activeUnitTab');

  const { data: contractData } = useQuery<{
    blockGetUnitContractOverview: { total: number; stages: StageCount[] };
  }>(UNIT_CONTRACT_OVERVIEW, { variables: { unitId }, skip: !unitId });

  const { data: opptyData } = useQuery<{
    blockGetUnitOpptyOverview: { total: number; stages: StageCount[] };
  }>(UNIT_OPPTY_OVERVIEW, {
    variables: { unitId, projectId },
    skip: !unitId || !projectId,
  });

  const { data: offerData } = useQuery<{
    blockGetUnitOfferStats: { totalCount: number; sentCount: number; draftCount: number };
  }>(UNIT_OFFER_STATS, { variables: { unitId }, skip: !unitId });

  const c = contractData?.blockGetUnitContractOverview;
  const o = opptyData?.blockGetUnitOpptyOverview;
  const f = offerData?.blockGetUnitOfferStats;

  return (
    <div className="grid grid-cols-3 gap-4">
      <OverviewCard
        icon={IconFileText}
        color="#10b981"
        title="Contract Overview"
        total={c?.total ?? 0}
        stages={c?.stages ?? []}
        linkLabel="View Contracts"
        onLink={() => setActiveUnitTab('contracts')}
      />
      <OverviewCard
        icon={IconFileDescription}
        color="#8b5cf6"
        title="Offer Overview"
        total={f?.totalCount ?? 0}
        stages={[
          { name: 'Draft', count: f?.draftCount ?? 0 },
          { name: 'Sent', count: f?.sentCount ?? 0 },
        ]}
        linkLabel="View Offers"
        onLink={() => setActiveUnitTab('offers')}
      />
      <OverviewCard
        icon={IconTarget}
        color="#f59e0b"
        title="Opportunity Overview"
        total={o?.total ?? 0}
        stages={o?.stages ?? []}
        linkLabel="View Opportunities"
        onLink={() => setActiveUnitTab('opportunities')}
      />
    </div>
  );
};
