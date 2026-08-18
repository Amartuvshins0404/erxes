import { Button, ScrollArea, Separator, Spinner } from 'erxes-ui';
import { IconCaretLeftRight, IconPlus } from '@tabler/icons-react';
import { useCreateMultipleRelations, useRelations } from 'ui-modules';
import { useSetAtom } from 'jotai';

import { AddOpptyWidgetSheet } from '@/oppty/components/AddOpptyWidgetSheet';
import { OpptyDetailSheet } from '@/oppty/components/OpptyDetailSheet';
import { opptyWidgetSheetState } from '@/oppty/states/opptyWidgetSheetState';
import { OpptyWidgetCard } from './OpptyWidgetCard';

export const Oppty = ({
  contentId,
  contentType,
  access = 'write',
  customerId,
  companyId,
}: {
  contentId: string;
  contentType: string;
  access?: 'read' | 'write';
  customerId?: string;
  companyId?: string;
}) => {
  const { ownEntities, loading: loadingRelations } = useRelations({
    variables: {
      contentId,
      contentType,
      relatedContentType: 'block:oppty',
    },
  });

  const { createMultipleRelations } = useCreateMultipleRelations();
  const setOpenCreateOppty = useSetAtom(opptyWidgetSheetState);

  if (loadingRelations) {
    return <Spinner containerClassName="py-20" />;
  }

  const onComplete = (opptyId: string) => {
    const createRelation = (ct: string, cid: string) => ({
      entities: [
        { contentType: ct, contentId: cid },
        { contentType: 'block:oppty', contentId: opptyId },
      ],
    });

    const relationKeys = new Set<string>();

    const relations = [
      [contentType, contentId],
      ...(customerId ? [['core:customer', customerId]] : []),
      ...(companyId ? [['core:company', companyId]] : []),
    ]
      .filter(([ct, cid]) => {
        const key = `${ct}:${cid}`;
        if (relationKeys.has(key)) return false;
        relationKeys.add(key);
        return true;
      })
      .map(([ct, cid]) => createRelation(ct, cid));

    createMultipleRelations(relations);
  };

  const handleOpenCreate = () => {
    if (access === 'read') return;

    setOpenCreateOppty(true);
  };

  if (ownEntities?.length === 0) {
    return (
      <div className="flex flex-col flex-auto justify-center items-center gap-4 text-muted-foreground">
        <div className="bg-background p-6 border border-dashed rounded-xl">
          <IconCaretLeftRight />
        </div>
        <span className="text-sm">
          No opportunities to display at the moment.
        </span>
        {access === 'write' && (
          <Button variant="secondary" onClick={handleOpenCreate}>
            <IconPlus />
            Add an opportunity
          </Button>
        )}
        <AddOpptyWidgetSheet customerId={customerId} onComplete={onComplete} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-none justify-between items-center gap-2 bg-background px-4 h-11">
        <span className="font-medium text-primary">Opportunities</span>
        <div className="flex gap-2 items-center">
          {access === 'write' && (
            <Button variant="secondary" onClick={handleOpenCreate}>
              <IconPlus />
            </Button>
          )}
          <AddOpptyWidgetSheet customerId={customerId} onComplete={onComplete} />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-auto">
        <div className="flex flex-col gap-4 p-4">
          {ownEntities?.map((entity) => (
            <OpptyWidgetCard
              key={entity.contentId}
              opptyId={entity.contentId}
            />
          ))}
        </div>
      </ScrollArea>
      <OpptyDetailSheet />
    </>
  );
};
