import { TemplateCategoryCommandBar } from '@/templates/components/category/TemplateCategoryCommandBar';
import { RecordTable } from 'erxes-ui';
import { useMemo } from 'react';
import { useTemplateCategories } from 'ui-modules';
import { templateCategoryColumns } from './TemplateCategoryColumns';
import { TemplateCategoryDetailSheet } from './TemplateCategoryDetailSheet';
import { useTranslation } from 'react-i18next';

export const TemplateCategoryRecordTable = () => {
  const { t } = useTranslation('templates', { keyPrefix: 'template-category' });
  const columns = useMemo(() => templateCategoryColumns(t), [t]);

  const { categories, hasPreviousPage, hasNextPage, loading, handleFetchMore } =
    useTemplateCategories({});

  return (
    <RecordTable.Provider
      columns={columns}
      data={categories}
      stickyColumns={['more', 'checkbox', 'attachment', 'name']}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={categories.length}
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
      <TemplateCategoryCommandBar />
      <TemplateCategoryDetailSheet />
    </RecordTable.Provider>
  );
};
