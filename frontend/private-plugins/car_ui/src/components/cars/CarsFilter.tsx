import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gql, useQuery } from '@apollo/client';
import {
  IconChartDots,
  IconFolder,
  IconSearch,
  IconTags,
} from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  Popover,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import { TagsSelect } from 'ui-modules';

import { buildCategoryOptions } from '~/lib/categoryTree';
import {
  CAR_SEGMENT_CONTENT_TYPE,
  ROOT_CAR_CONTENT_TYPE,
} from '~/lib/constants';
import { CarHotKeyScope } from '~/lib/hotkeys';
import { useCarCategories } from '~/hooks/useCarsData';

const GET_CAR_SEGMENTS = gql`
  query CarSegments($contentTypes: [String]!, $searchValue: String) {
    segments(contentTypes: $contentTypes, searchValue: $searchValue) {
      _id
      color
      contentType
      count
      name
    }
  }
`;

const SHOW_SEGMENT_FILTER = false;
const CAR_SEGMENT_CONTENT_TYPES = [CAR_SEGMENT_CONTENT_TYPE];

type ICarSegment = {
  _id: string;
  color?: string;
  count?: number;
  name: string;
};

const useCarSegments = (searchValue?: string) => {
  const { data, error, loading } = useQuery<{ segments: ICarSegment[] }>(
    GET_CAR_SEGMENTS,
    {
      variables: {
        contentTypes: CAR_SEGMENT_CONTENT_TYPES,
        searchValue: searchValue || undefined,
      },
    },
  );

  return {
    error,
    loading,
    segments: data?.segments || [],
  };
};

const CarsCategoryFilterItem = () => {
  const { t } = useTranslation('car');

  return (
    <Filter.Item value="categoryId">
      <IconFolder />
      {t('Category', { defaultValue: 'Category' })}
    </Filter.Item>
  );
};

const CarsCategoryCommandContent = ({ onDone }: { onDone?: () => void }) => {
  const { t } = useTranslation('car');
  const [categoryId, setCategoryId] = useQueryState<string>('categoryId');
  const { carCategories, loading } = useCarCategories();

  const options = useMemo(
    () => buildCategoryOptions(carCategories),
    [carCategories],
  );

  const handleSelect = (value: string | null) => {
    setCategoryId(value);
    onDone?.();
  };

  return (
    <Command shouldFilter>
      <Filter.CommandInput
        placeholder={t('Search categories', {
          defaultValue: 'Search categories',
        })}
        variant="secondary"
      />
      <Command.List className="p-1">
        <Filter.CommandItem
          value="all-categories"
          onSelect={() => handleSelect(null)}
        >
          <IconFolder />
          {t('All categories', { defaultValue: 'All categories' })}
        </Filter.CommandItem>
        {loading ? (
          <Command.Empty>
            {t('Loading categories...', {
              defaultValue: 'Loading categories...',
            })}
          </Command.Empty>
        ) : null}
        {options.map((option) => (
          <Filter.CommandItem
            key={option.value}
            value={`${option.label} ${option.value}`}
            onSelect={() => handleSelect(option.value)}
            className={categoryId === option.value ? 'text-primary' : ''}
          >
            <IconFolder />
            {option.label}
          </Filter.CommandItem>
        ))}
      </Command.List>
    </Command>
  );
};

const CarsCategoryFilterView = () => {
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="categoryId">
      <CarsCategoryCommandContent onDone={resetFilterState} />
    </Filter.View>
  );
};

const CarsCategoryFilterBar = () => {
  const { t } = useTranslation('car');
  const [categoryId] = useQueryState<string>('categoryId');
  const { carCategories } = useCarCategories();
  const [open, setOpen] = useState(false);

  const selectedCategory = carCategories.find(
    (category) => category._id === categoryId,
  );

  if (!categoryId) {
    return null;
  }

  return (
    <Filter.BarItem queryKey="categoryId">
      <Filter.BarName>
        <IconFolder />
        {t('Category', { defaultValue: 'Category' })}
      </Filter.BarName>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton
            filterKey="categoryId"
            className="max-w-72 justify-start overflow-hidden"
          >
            {selectedCategory?.name || selectedCategory?.code || categoryId}
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content className="w-80">
          <CarsCategoryCommandContent onDone={() => setOpen(false)} />
        </Combobox.Content>
      </Popover>
    </Filter.BarItem>
  );
};

const CarsTagFilterItem = () => {
  const { t } = useTranslation('car');

  return (
    <Filter.Item value="tag">
      <IconTags />
      {t('Tag', { defaultValue: 'Tag' })}
    </Filter.Item>
  );
};

const CarsTagFilterView = () => {
  const { resetFilterState } = useFilterContext();
  const [tag, setTag] = useQueryState<string>('tag');

  return (
    <Filter.View filterKey="tag">
      <TagsSelect.Provider
        mode="single"
        type={ROOT_CAR_CONTENT_TYPE}
        value={tag || undefined}
        onValueChange={(nextValue) => {
          setTag((nextValue as string) || null);
          resetFilterState();
        }}
      >
        <TagsSelect.Content />
      </TagsSelect.Provider>
    </Filter.View>
  );
};

const CarsTagFilterBar = () => {
  const { t } = useTranslation('car');
  const [tag, setTag] = useQueryState<string>('tag');
  const [open, setOpen] = useState(false);

  if (!tag) {
    return null;
  }

  return (
    <Filter.BarItem queryKey="tag">
      <Filter.BarName>
        <IconTags />
        {t('Tag', { defaultValue: 'Tag' })}
      </Filter.BarName>
      <TagsSelect.Provider
        mode="single"
        type={ROOT_CAR_CONTENT_TYPE}
        value={tag}
        onValueChange={(nextValue) => setTag((nextValue as string) || null)}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <Filter.BarButton
              filterKey="tag"
              className="max-w-72 justify-start overflow-hidden"
            >
              <TagsSelect.SelectedList renderAsPlainText />
            </Filter.BarButton>
          </Popover.Trigger>
          <Combobox.Content className="w-80">
            <TagsSelect.Content />
          </Combobox.Content>
        </Popover>
      </TagsSelect.Provider>
    </Filter.BarItem>
  );
};

const CarsSegmentFilterItem = () => {
  const { t } = useTranslation('car');

  return (
    <Filter.Item value="segment">
      <IconChartDots />
      {t('Segment', { defaultValue: 'Segment' })}
    </Filter.Item>
  );
};

const SegmentOption = ({ segment }: { segment: ICarSegment }) => (
  <div className="flex min-w-0 flex-auto items-center gap-2">
    {segment.color ? (
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: segment.color }}
      />
    ) : null}
    <span className="truncate">{segment.name}</span>
    {typeof segment.count === 'number' ? (
      <span className="ml-auto text-muted-foreground">{segment.count}</span>
    ) : null}
  </div>
);

const CarsSegmentCommandContent = ({ onDone }: { onDone?: () => void }) => {
  const { t } = useTranslation('car');
  const [searchValue, setSearchValue] = useState('');
  const [segment, setSegment] = useQueryState<string>('segment');
  const [, setSegmentData] = useQueryState<string>('segmentData');
  const { error, loading, segments } = useCarSegments(searchValue);

  const handleSelect = (value: string | null) => {
    setSegment(value);
    setSegmentData(null);
    onDone?.();
  };

  return (
    <Command shouldFilter={false}>
      <Filter.CommandInput
        placeholder={t('Search segments', {
          defaultValue: 'Search segments',
        })}
        value={searchValue}
        variant="secondary"
        onValueChange={setSearchValue}
      />
      <Command.List className="p-1">
        <Filter.CommandItem
          value="all-segments"
          onSelect={() => handleSelect(null)}
        >
          <IconChartDots />
          {t('All segments', { defaultValue: 'All segments' })}
        </Filter.CommandItem>
        {error ? (
          <Command.Empty>
            {t('Failed to load segments', {
              defaultValue: 'Failed to load segments',
            })}
          </Command.Empty>
        ) : loading ? (
          <Command.Empty>
            {t('Loading segments...', {
              defaultValue: 'Loading segments...',
            })}
          </Command.Empty>
        ) : null}
        {!loading && !error && segments.length === 0 ? (
          <Command.Empty>
            {t('No segments found', { defaultValue: 'No segments found' })}
          </Command.Empty>
        ) : null}
        {segments.map((carSegment) => (
          <Filter.CommandItem
            key={carSegment._id}
            value={`${carSegment.name} ${carSegment._id}`}
            onSelect={() => handleSelect(carSegment._id)}
            className={segment === carSegment._id ? 'text-primary' : ''}
          >
            <SegmentOption segment={carSegment} />
          </Filter.CommandItem>
        ))}
      </Command.List>
    </Command>
  );
};

const CarsSegmentFilterView = () => {
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="segment">
      <CarsSegmentCommandContent onDone={resetFilterState} />
    </Filter.View>
  );
};

const CarsSegmentFilterBar = () => {
  const { t } = useTranslation('car');
  const [segment] = useQueryState<string>('segment');
  const [open, setOpen] = useState(false);
  const { segments } = useCarSegments();
  const selectedSegment = segments.find((item) => item._id === segment);

  if (!segment) {
    return null;
  }

  return (
    <Filter.BarItem queryKey="segment">
      <Filter.BarName>
        <IconChartDots />
        {t('Segment', { defaultValue: 'Segment' })}
      </Filter.BarName>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton
            filterKey="segment"
            className="max-w-72 justify-start overflow-hidden"
          >
            {selectedSegment?.name || segment}
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content className="w-80">
          <CarsSegmentCommandContent onDone={() => setOpen(false)} />
        </Combobox.Content>
      </Popover>
    </Filter.BarItem>
  );
};

const CarsSegmentDataCleanup = () => {
  const [segment] = useQueryState<string>('segment');
  const [segmentData, setSegmentData] = useQueryState<string>('segmentData');

  useEffect(() => {
    if (!segment && segmentData) {
      setSegmentData(null);
    }
  }, [segment, segmentData, setSegmentData]);

  return null;
};

const CarsFilterPopover = () => {
  const { t } = useTranslation('car');

  return (
    <Filter.Popover scope={CarHotKeyScope.CarsPage}>
      <Filter.Trigger />
      <Combobox.Content>
        <Filter.View>
          <Command>
            <Filter.CommandInput
              placeholder={t('Filter', { defaultValue: 'Filter' })}
              variant="secondary"
            />
            <Command.List className="p-1">
              <Filter.Item value="searchValue" inDialog>
                <IconSearch />
                {t('Search', { defaultValue: 'Search' })}
              </Filter.Item>
              <CarsCategoryFilterItem />
              <CarsTagFilterItem />
              {SHOW_SEGMENT_FILTER ? <CarsSegmentFilterItem /> : null}
            </Command.List>
          </Command>
        </Filter.View>
        <CarsCategoryFilterView />
        <CarsTagFilterView />
        {SHOW_SEGMENT_FILTER ? <CarsSegmentFilterView /> : null}
      </Combobox.Content>
    </Filter.Popover>
  );
};

export const CarsFilter = ({ totalCount }: { totalCount: number }) => {
  const { t } = useTranslation('car');

  return (
    <Filter id="cars-filter">
      <CarsSegmentDataCleanup />
      <Filter.Bar>
        <CarsFilterPopover />
        <Filter.Dialog>
          <Filter.View filterKey="searchValue" inDialog>
            <Filter.DialogStringView
              filterKey="searchValue"
              label={t('Search', { defaultValue: 'Search' })}
            />
          </Filter.View>
        </Filter.Dialog>
        <Filter.SearchValueBarItem />
        <CarsCategoryFilterBar />
        <CarsTagFilterBar />
        {SHOW_SEGMENT_FILTER ? <CarsSegmentFilterBar /> : null}
        <div className="ml-auto text-sm text-muted-foreground">
          {t('Total count', {
            count: totalCount,
            defaultValue: '{{count}} total',
          })}
        </div>
      </Filter.Bar>
    </Filter>
  );
};
