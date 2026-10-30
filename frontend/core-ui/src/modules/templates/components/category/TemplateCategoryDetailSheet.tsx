import { useTemplateCategoryDetail } from '@/templates/hooks/useTemplateCategoryDetail';
import { Sheet, Spinner, useQueryState, useToast } from 'erxes-ui';
import { TemplateCategoryForm } from './TemplateCategoryForm';
import { useTranslation } from 'react-i18next';

export const TemplateCategoryDetailSheet = () => {
  const { t } = useTranslation('templates', { keyPrefix: 'template-category' });
  const [categoryId, setCategoryId] = useQueryState<string>('categoryId');

  const { toast } = useToast();

  const { categoryDetail, loading } = useTemplateCategoryDetail(
    categoryId || undefined,
  );

  const setOpen = (newCategoryId: string | null) => {
    setCategoryId(newCategoryId);
  };

  return (
    <Sheet
      open={!!categoryId}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setOpen(null);
        }
      }}
    >
      <Sheet.View className="w-[50%] md:w-[50%] lg:w-[50%]">
        {loading ? (
          <Spinner containerClassName="min-h-[200px]" />
        ) : (
          <>
            <Sheet.Header>
              <Sheet.Title>{t('edit-category')}</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>

            <TemplateCategoryForm
              category={categoryDetail}
              onCompleted={() => {
                toast({
                  title: t('update-success'),
                  variant: 'success',
                });
                setOpen(null);
              }}
              onClose={() => setOpen(null)}
            />
          </>
        )}
      </Sheet.View>
    </Sheet>
  );
};
