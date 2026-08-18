import {
  useBuildings,
  useBuildingZonings,
} from '@/building/hooks/useBuildings';
import { IZoning } from '@/building/types/buildingTypes';
import { useProjects } from '@/project/hooks/useProjects';
import {
  CONTRACT_STAGE_COLORS,
  LOCKED_UNIT_COLOR,
} from '@/contract-status/constants';
import { StackingUnitItem } from '@/stacking/components/StackingUnitItem';
import { UnitDetailSheet } from '@/unit/components/UnitDetailSheet';
import { useUnits } from '@/unit/hooks/useUnits';
import {
  IconBuildingPlus,
  IconClipboardText,
  IconPlus,
} from '@tabler/icons-react';
import { Button, ScrollArea, Spinner, Tooltip, useQueryState } from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';

export const StackingDisplay = () => {
  const { projectId } = useParams();
  const [buildingId] = useQueryState<string>('buildingId');
  const { loading: projectsLoading } = useProjects(true);
  const { loading: buildingsLoading } = useBuildings({
    projectId: projectId ?? '',
  });
  const { buildingZonings, loading } = useBuildingZonings({
    buildingId,
  });

  if (projectsLoading || buildingsLoading) {
    return <Spinner containerClassName="blk:py-32" />;
  }

  if (!projectId) {
    return (
      <div className="p-4 flex-auto flex flex-col items-center justify-center gap-2">
        <IconClipboardText
          className="size-12 text-accent-foreground"
          strokeWidth={1}
        />
        <div className="text-sm text-muted-foreground">No project created</div>
        <Button variant="secondary" asChild className="mt-2">
          <Link to="/block/projects">
            <IconPlus />
            Create Project
          </Link>
        </Button>
      </div>
    );
  }

  if (!buildingId) {
    return (
      <div className="p-4 flex-auto flex flex-col items-center justify-center gap-2">
        <IconBuildingPlus
          className="size-12 text-accent-foreground"
          strokeWidth={1}
        />
        <div className="text-sm text-muted-foreground">No building created</div>
        <Button variant="secondary" asChild className="mt-2">
          <Link to={`/block/projects/${projectId}?activeTab=buildings`}>
            <IconPlus />
            Create Building
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 flex-auto overflow-hidden">
        <ScrollArea className="blk:bg-primary/5 h-full w-full shadow-xs p-3">
          <div className="flex flex-col gap-3">
            {!loading &&
              buildingZonings &&
              buildingZonings.length > 0 &&
              [...buildingZonings]
                .sort((a, b) => b.floor - a.floor)
                .map((zone) => <StackingZone key={zone._id} zone={zone} />)}
          </div>
          <ScrollArea.Bar orientation="horizontal" />
        </ScrollArea>
      </div>
      <StatusExplanation />
      <UnitDetailSheet />
    </>
  );
};

export const StackingZone = ({ zone }: { zone: IZoning }) => {
  const { units } = useUnits({
    variables: { zoning: zone._id },
  });

  const notUsedSizeByUnit = units?.reduce(
    (acc, { unitType, activeContract }) =>
      !activeContract ? acc + (unitType?.size || 0) : acc,
    0,
  );

  return (
    <div className="flex gap-3">
      <div className="sticky left-0 z-10 bg-background w-48 h-28 flex-none p-3 flex flex-col gap-1">
        <span className="font-bold">
          {zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor}
        </span>
        <span className="text-xs">{units?.length} units</span>
        <span className="text-xs">{zone.size} m²</span>

        <span className="text-xs">vacant by size: {notUsedSizeByUnit} m²</span>
      </div>
      {units
        ?.filter((unit) => unit.unitType?.size > 0)
        .map((unit) => (
          <StackingUnitItem key={unit._id} {...unit} />
        ))}
    </div>
  );
};

export const StatusExplanation = () => {
  const stages = [
    { en: 'Available', color: 'var(--border)' },
    CONTRACT_STAGE_COLORS.reserved,
    CONTRACT_STAGE_COLORS.draft,
    { ...CONTRACT_STAGE_COLORS.signed, en: 'Signed' },
    { en: 'Locked', color: LOCKED_UNIT_COLOR },
  ];

  return (
    <Tooltip.Provider>
      <div className="w-full flex items-center p-4 pt-0 gap-3">
        {stages.map((stage) => (
          <Tooltip key={stage.en}>
            <Tooltip.Trigger asChild>
              <div
                className="flex-1 h-2 cursor-pointer blk:rounded-lg"
                style={{ backgroundColor: stage.color }}
              />
            </Tooltip.Trigger>
            <Tooltip.Content>{stage.en}</Tooltip.Content>
          </Tooltip>
        ))}
      </div>
    </Tooltip.Provider>
  );
};
