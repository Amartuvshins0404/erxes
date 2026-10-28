import { IconCategory, IconTag, IconX } from '@tabler/icons-react';
import {
  Button,
  Combobox,
  Command,
  Filter,
  Popover,
  useFilterContext,
} from 'erxes-ui';
import { useMemo } from 'react';
import {
  SelectCategory,
  SelectCompany,
  SelectStructureEntities,
  SelectTags,
} from 'ui-modules';

import { ProductFilterState } from '@/deals/actionBar/types/actionBarTypes';
import { useTranslation } from 'react-i18next';
import { useProductCategories } from 'ui-modules/modules/products/categories/hooks/useCategories';
import { useTags } from 'ui-modules/modules/tags/hooks/useTags';
import { STOCK_PLACE_CAPABILITY } from '@/constants/structure';

interface Props {
  filters: ProductFilterState;
  onFilterChange: (filters: ProductFilterState) => void;
}

const normalizeMultiSelectValue = (value?: string | string[]) => {
  if (!value) return undefined;

  const values = Array.isArray(value) ? value : [value];

  return values.length > 0 ? values : undefined;
};

const CustomFilterItem = ({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) => (
  <div className="rounded flex gap-px h-fit items-stretch shadow-xs bg-muted text-sm font-medium">
    {children}
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
    >
      <IconX size={14} />
    </Button>
  </div>
);

export const FilterButton = ({ filters, onFilterChange }: Props) => {
  const hasFilters = Object.values(filters || {}).some(
    (value) =>
      value !== null &&
      value !== undefined &&
      (Array.isArray(value) ? value.length > 0 : value !== ''),
  );

  return (
    <Filter.Popover>
      <Filter.Trigger isFiltered={hasFilters} />
      <Combobox.Content align="start" sideOffset={8} side="bottom">
        <Popover.Close className="hidden" />
        <ProductFilterView filters={filters} onChange={onFilterChange} />
      </Combobox.Content>
    </Filter.Popover>
  );
};

export const ProductFilterBar = ({
  filters,
  onChange,
}: {
  filters: ProductFilterState;
  onChange: (f: ProductFilterState) => void;
}) => {
  const { productCategories: categories = [] } = useProductCategories();
  const { tags = [] } = useTags({ variables: { ids: [] } });
  const {
    productCategoryIds,
    productTagIds,
    productVendorIds,
    placeEntityIds,
    responsibleEntityIds,
  } = filters;

  const { t } = useTranslation('sales');

  const getCategoryName = (id: string) => {
    const category = categories.find((cat) => cat._id === id);
    return category?.name || id;
  };

  const getTagNames = (tagIds: string[]): string => {
    const tagNames = tagIds.map(
      (id) => tags?.find((tag) => tag._id === id)?.name,
    );
    return tagNames.length > 0 ? tagNames.join(', ') : t('none');
  };

  const updateFilter = <Key extends keyof ProductFilterState>(
    key: Key,
    value: ProductFilterState[Key],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <>
      {productCategoryIds && (
        <CustomFilterItem
          onClear={() => updateFilter('productCategoryIds', undefined)}
        >
          <Filter.BarName>
            <IconCategory />
            {t('category')}
          </Filter.BarName>
          <Filter.BarButton>
            {productCategoryIds && (
              <span className="">{getCategoryName(productCategoryIds[0])}</span>
            )}
          </Filter.BarButton>
        </CustomFilterItem>
      )}

      {productTagIds && (
        <CustomFilterItem
          onClear={() => updateFilter('productTagIds', undefined)}
        >
          <Filter.BarName>
            <IconTag />
            {t('tags')}
          </Filter.BarName>
          <Filter.BarButton>
            {productTagIds && productTagIds.length > 0 && (
              <span className="">{getTagNames(productTagIds)}</span>
            )}
          </Filter.BarButton>
        </CustomFilterItem>
      )}

      {productVendorIds && (
        <SelectCompany.Provider
          mode="multiple"
          value={productVendorIds}
          onValueChange={(value) =>
            updateFilter('productVendorIds', normalizeMultiSelectValue(value))
          }
        >
          <CustomFilterItem
            onClear={() => updateFilter('productVendorIds', undefined)}
          >
            <Filter.BarName>{t('vendor')}</Filter.BarName>
            <Filter.BarButton>
              <SelectCompany.Value />
            </Filter.BarButton>
          </CustomFilterItem>
        </SelectCompany.Provider>
      )}

      {placeEntityIds && placeEntityIds.length > 0 && (
        <SelectStructureEntities.Provider
          mode="multiple"
          capability={STOCK_PLACE_CAPABILITY}
          value={placeEntityIds}
          onValueChange={(value) =>
            updateFilter('placeEntityIds', normalizeMultiSelectValue(value))
          }
        >
          <CustomFilterItem
            onClear={() => updateFilter('placeEntityIds', undefined)}
          >
            <Filter.BarName>{t('place', 'Place')}</Filter.BarName>
            <Filter.BarButton>
              <SelectStructureEntities.Value />
            </Filter.BarButton>
          </CustomFilterItem>
        </SelectStructureEntities.Provider>
      )}

      {responsibleEntityIds && responsibleEntityIds.length > 0 && (
        <SelectStructureEntities.Provider
          mode="multiple"
          value={responsibleEntityIds}
          onValueChange={(value) =>
            updateFilter(
              'responsibleEntityIds',
              normalizeMultiSelectValue(value),
            )
          }
        >
          <CustomFilterItem
            onClear={() => updateFilter('responsibleEntityIds', undefined)}
          >
            <Filter.BarName>{t('responsible', 'Responsible')}</Filter.BarName>
            <Filter.BarButton>
              <SelectStructureEntities.Value />
            </Filter.BarButton>
          </CustomFilterItem>
        </SelectStructureEntities.Provider>
      )}
    </>
  );
};

const ProductFilterView = ({
  filters,
  onChange,
}: {
  filters: ProductFilterState;
  onChange: (f: ProductFilterState) => void;
}) => {
  const { resetFilterState } = useFilterContext();

  const updateFilter = <Key extends keyof ProductFilterState>(
    key: Key,
    value: ProductFilterState[Key],
  ) => {
    onChange({ ...filters, [key]: value });
    resetFilterState();
  };

  const vendorIds = useMemo(
    () => filters.productVendorIds ?? [],
    [filters.productVendorIds],
  );

  const { t } = useTranslation('sales');

  return (
    <>
      <Filter.View>
        <Command>
          <Command.List className="p-1">
            <Filter.Item value="productCategoryIds">
              <IconCategory />
              {t('by-category')}
            </Filter.Item>
            <SelectCompany.FilterItem
              value="productVendorIds"
              label={t('by-vendor')}
            />
            <Filter.Item value="productTagIds">
              <IconTag />
              {t('by-tag')}
            </Filter.Item>
            <SelectStructureEntities.FilterItem
              value="placeEntityIds"
              label={t('by-place', 'By place')}
            />
            <SelectStructureEntities.FilterItem
              value="responsibleEntityIds"
              label={t('by-responsible', 'By responsible')}
            />
          </Command.List>
        </Command>
      </Filter.View>

      <Filter.View filterKey="productCategoryIds">
        <SelectCategory.Provider
          mode="single"
          value={filters.productCategoryIds?.[0] || ''}
          onValueChange={(value) =>
            updateFilter('productCategoryIds', normalizeMultiSelectValue(value))
          }
        >
          <SelectCategory.Content />
        </SelectCategory.Provider>
      </Filter.View>

      <Filter.View filterKey="productVendorIds">
        <SelectCompany.Provider
          mode="multiple"
          value={vendorIds}
          onValueChange={(value) => {
            updateFilter('productVendorIds', normalizeMultiSelectValue(value));
          }}
        >
          <SelectCompany.Content />
        </SelectCompany.Provider>
      </Filter.View>

      <Filter.View filterKey="productTagIds">
        <SelectTags.Provider
          mode="single"
          tagType="product"
          value={filters.productTagIds?.[0] || ''}
          onValueChange={(value) =>
            updateFilter('productTagIds', normalizeMultiSelectValue(value))
          }
        >
          <SelectTags.Content />
        </SelectTags.Provider>
      </Filter.View>

      <Filter.View filterKey="placeEntityIds">
        <SelectStructureEntities.Provider
          mode="multiple"
          capability={STOCK_PLACE_CAPABILITY}
          value={filters.placeEntityIds || []}
          onValueChange={(value) => {
            updateFilter('placeEntityIds', normalizeMultiSelectValue(value));
          }}
        >
          <SelectStructureEntities.Content />
        </SelectStructureEntities.Provider>
      </Filter.View>

      <Filter.View filterKey="responsibleEntityIds">
        <SelectStructureEntities.Provider
          mode="multiple"
          value={filters.responsibleEntityIds || []}
          onValueChange={(value) => {
            updateFilter(
              'responsibleEntityIds',
              normalizeMultiSelectValue(value),
            );
          }}
        >
          <SelectStructureEntities.Content />
        </SelectStructureEntities.Provider>
      </Filter.View>
    </>
  );
};
