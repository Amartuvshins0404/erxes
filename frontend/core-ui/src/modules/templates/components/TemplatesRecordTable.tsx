import { templateColumns } from '@/templates/components/TemplatesColumns';
import { TemplatesCommandBar } from '@/templates/components/TemplatesCommandBar';
import { useTemplates } from '@/templates/hooks/useTemplates';
import { RecordTable } from 'erxes-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const TemplatesRecordTable = () => {
  const { t } = useTranslation('templates', { keyPrefix: 'template' });
  const columns = useMemo(() => templateColumns(t), [t]);

  const { templates, hasPreviousPage, hasNextPage, loading, handleFetchMore } =
    useTemplates();

  return (
    <RecordTable.Provider
      columns={columns}
      data={templates}
      stickyColumns={['more', 'checkbox', 'name']}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={templates.length}
        loading={loading}
      >
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            <RecordTable.CursorRows
              handleFetchMore={handleFetchMore}
              loading={loading}
            />
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.CursorProvider>
      <TemplatesCommandBar />
    </RecordTable.Provider>
  );
};
