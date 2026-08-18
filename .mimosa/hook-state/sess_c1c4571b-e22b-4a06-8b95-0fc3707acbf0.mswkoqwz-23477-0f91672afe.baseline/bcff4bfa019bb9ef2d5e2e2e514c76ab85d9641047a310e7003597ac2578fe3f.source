import {
  Board,
  BoardColumnProps,
  BoardItemProps,
  EnumCursorDirection,
  Skeleton,
  SkeletonArray,
  Spinner,
} from 'erxes-ui';
import { atom, useAtom, useSetAtom } from 'jotai';
import { IOppty } from '@/oppty/types/opptyTypes';
import type { DragEndEvent } from '@dnd-kit/core';

import { useEffect } from 'react';
import { OpptysBoardCard } from '@/oppty/components/OpptysBoardCard';

import { useOpptys } from '@/oppty/hooks/useGetOpptys';
import { clsx } from 'clsx';
import { useInView } from 'react-intersection-observer';
import { useUpdateOppty } from '@/oppty/hooks/useUpdateOppty';
import { useBlockStatusesByType } from '@/status/hooks/useGetBlockStatuses';
import { IBlockStatus } from '@/status/types';

import { allOpptysMapState } from '@/oppty/states/allOpptysMapState';

const fetchedOpptysState = atom<BoardItemProps[]>([]);
const opptyCountByProjectAtom = atom<Record<string, number>>({});

const TYPE_ORDER = ['lead', 'qualified', 'site_visit', 'negotiation', 'closed_lost', 'closed_won'];

const sortStatuses = (statuses: IBlockStatus[]) =>
  [...statuses].sort((a, b) => {
    const ti = TYPE_ORDER.indexOf(a.type);
    const tj = TYPE_ORDER.indexOf(b.type);
    if (ti !== tj) return ti - tj;
    return (a.order || 0) - (b.order || 0);
  });

export const OpptysBoard = ({ projectId, unitId }: { projectId: string; unitId?: string }) => {
  const { statuses, loading: columnsLoading } = useBlockStatusesByType({
    projectId,
  });

  const columns = sortStatuses(statuses || []).map((status) => ({
    id: status._id,
    name: status.name,
    color: status.color,
  }));

  if (columnsLoading) return <Spinner />;

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No statuses configured for this project. Add statuses in project
        settings.
      </div>
    );
  }

  return <OpptysBoardInner projectId={projectId} unitId={unitId} columns={columns} />;
};

const OpptysBoardInner = ({
  projectId,
  unitId,
  columns,
}: {
  projectId: string;
  unitId?: string;
  columns: { id: string; name: string; color: string }[];
}) => {
  const [allOpptysMap, setAllOpptysMap] = useAtom(allOpptysMapState);
  const { updateOppty } = useUpdateOppty();

  const [opptys, setOpptys] = useAtom(fetchedOpptysState);
  const setOpptyCountByProject = useSetAtom(opptyCountByProjectAtom);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeItem = allOpptysMap[active.id as string];
    const overItem = allOpptysMap[over.id as string];
    const overColumn =
      overItem?.status ||
      columns?.find((col) => col.id === over.id)?.id ||
      columns?.[0]?.id;

    if (activeItem?.status === overColumn) {
      return;
    }

    updateOppty({
      variables: {
        _id: activeItem?._id,
        input: {
          projectId: projectId,
          status: overColumn,
        },
      },
    });

    setAllOpptysMap((prev) => ({
      ...prev,
      [activeItem._id]: { ...activeItem, status: overColumn },
    }));

    setOpptys((prev) =>
      prev.map((oppty) => {
        if (oppty.id === activeItem?._id) {
          return {
            ...oppty,
            column: overColumn,
            sort: new Date().toISOString(),
          };
        }
        return oppty;
      }),
    );
    setOpptyCountByProject((prev) => ({
      ...prev,
      [activeItem?.status]: prev[activeItem?.status] - 1 || 0,
      [overColumn]: (prev[overColumn] || 0) + 1,
    }));
  };

  return (
    <Board.Provider
      columns={columns}
      data={opptys}
      onDragEnd={handleDragEnd}
      boardId={clsx('opptys-board', projectId)}
    >
      {(column) => (
        <Board id={column.id} key={column.id} sortBy="updated" className="w-80">
          <OpptysBoardCards column={column} projectId={projectId} unitId={unitId} />
        </Board>
      )}
    </Board.Provider>
  );
};

export const OpptysBoardCards = ({
  column,
  projectId,
  unitId,
}: {
  column: BoardColumnProps;
  projectId: string;
  unitId?: string;
}) => {
  const [opptyCards, setOpptyCards] = useAtom(fetchedOpptysState);
  const [opptyCountByProject, setOpptyCountByProject] = useAtom(
    opptyCountByProjectAtom,
  );

  const boardCards = opptyCards
    .filter((oppty) => oppty && oppty.column === column.id)
    .sort((a, b) => {
      if (a.sort && b.sort) {
        return b.sort.toString().localeCompare(a.sort.toString());
      }
      return 0;
    });

  const { opptys, totalCount, loading, handleFetchMore } = useOpptys(
    projectId,
    {
      variables: {
        status: column.id,
        ...(unitId ? { unit: unitId } : {}),
      },
    },
  );

  const setAllOpptysMap = useSetAtom(allOpptysMapState);

  useEffect(() => {
    if (opptys) {
      setOpptyCards((prev) => {
        const newCards = opptys
          .filter((oppty) => oppty && oppty._id)
          .map((oppty) => ({
            id: oppty._id,
            column: oppty.status,
            sort: oppty.updatedAt,
          }));
        const newCardIds = new Set(newCards.map((c) => c.id));
        const otherColumns = prev.filter(
          (card) => card.column !== column.id && !newCardIds.has(card.id),
        );
        return [...otherColumns, ...newCards];
      });
      setAllOpptysMap((prev) => {
        const newOpptys = opptys.reduce((acc, oppty) => {
          if (oppty && oppty._id) {
            acc[oppty._id] = oppty;
          }
          return acc;
        }, {} as Record<string, IOppty>);
        return { ...prev, ...newOpptys };
      });
    }
  }, [opptys, setOpptyCards, setAllOpptysMap, column.id]);

  useEffect(() => {
    if (totalCount !== undefined) {
      setOpptyCountByProject((prev) => ({
        ...prev,
        [column.id]: totalCount || 0,
      }));
    }
  }, [totalCount, setOpptyCountByProject, column.id]);

  return (
    <>
      <Board.Header>
        <h4 className="capitalize flex items-center gap-1 pl-1">
          {column.name}
          <span className="text-accent-foreground font-medium pl-1">
            {loading ? (
              <Skeleton className="size-4 rounded" />
            ) : (
              opptyCountByProject[column.id] || 0
            )}
          </span>
        </h4>
      </Board.Header>
      <Board.Cards id={column.id} items={boardCards.map((oppty) => oppty.id)}>
        {loading ? (
          <SkeletonArray
            className="p-24 w-full rounded shadow-xs opacity-80"
            count={10}
          />
        ) : (
          boardCards.map((oppty) => (
            <Board.Card
              key={oppty.id}
              id={oppty.id}
              name={oppty.name || `Oppty ${oppty.id}`}
              column={column.id}
            >
              <OpptysBoardCard id={oppty.id} column={column.id} />
            </Board.Card>
          ))
        )}
        <OpptysCardsFetchMore
          totalCount={opptyCountByProject[column.id] || 0}
          currentLength={boardCards.length}
          handleFetchMore={() =>
            handleFetchMore({ direction: EnumCursorDirection.FORWARD })
          }
        />
      </Board.Cards>
    </>
  );
};

export const OpptysCardsFetchMore = ({
  totalCount,
  handleFetchMore,
  currentLength,
}: {
  totalCount: number;
  handleFetchMore: () => void;
  currentLength: number;
}) => {
  const { ref: bottomRef } = useInView({
    onChange: (inView) => inView && handleFetchMore(),
  });

  if (!totalCount || currentLength >= totalCount || currentLength === 0) {
    return null;
  }

  return (
    <div ref={bottomRef}>
      <Skeleton className="p-12 w-full rounded shadow-xs opacity-80" />
    </div>
  );
};
