import { IconBuildingCommunity } from '@tabler/icons-react';
import { Empty, RecordTable, useConfirm } from 'erxes-ui';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { travelAssociationColumns } from '@/travelAssociation/components/TravelAssociationColumns';
import { TravelAssociationFormSheet } from '@/travelAssociation/components/TravelAssociationFormSheet';
import { useTravelAssociations } from '@/travelAssociation/hooks/useTravelAssociations';
import { MTO_TRAVEL_ASSOCIATIONS_REMOVE } from '@/travelAssociation/graphql/travelAssociationMutations';

export function TravelAssociationsRecordTable() {
  const { confirm } = useConfirm();
  const { travelAssociations, loading, refetch } = useTravelAssociations();
  const [removeTravelAssociations] = useMutation(
    MTO_TRAVEL_ASSOCIATIONS_REMOVE,
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this travel association?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeTravelAssociations({ variables: { ids: [id] } }).then(() =>
        refetch(),
      );
    });
  };

  if (!loading && travelAssociations.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconBuildingCommunity />
          </Empty.Media>
          <Empty.Title>No travel associations found</Empty.Title>
          <Empty.Description>
            There seem to be no travel associations.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden h-full">
        <RecordTable.Provider
          columns={travelAssociationColumns({
            onEdit: (id) => {
              setEditId(id);
              setSheetOpen(true);
            },
            onRemove: handleRemove,
          })}
          data={travelAssociations}
          className="m-3 h-full"
          stickyColumns={['title']}
          tableId="travel_associations_record_table"
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              {loading && <RecordTable.RowSkeleton rows={10} />}
              <RecordTable.RowList />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.Provider>
      </div>

      <TravelAssociationFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditId(null);
        }}
        editId={editId}
        onSaved={() => void refetch()}
      />
    </>
  );
}
