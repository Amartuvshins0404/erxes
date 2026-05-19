import { gql, useMutation, useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Badge,
  Button,
  Card,
  Combobox,
  Command,
  Editor,
  EnumCursorDirection,
  Form,
  Input,
  Popover,
  ScrollArea,
  Select,
  Separator,
  Sheet,
  Spinner,
  TextOverflowTooltip,
  toast,
  cn,
} from 'erxes-ui';
import {
  IconCalendar,
  IconCheck,
  IconExternalLink,
  IconPointerUp,
  IconPlus,
  IconTag,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { type ReactNode, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useInView } from 'react-intersection-observer';
import {
  MANAGE_RELATIONS,
  SelectCompany,
  SelectCustomer,
  SelectMember,
  SelectBoard,
  SelectPipeline,
  SelectStage,
} from 'ui-modules';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { TFunction } from 'i18next';

const DEAL_CARD_FIELDS = gql`
  fragment CarDealCardFields on Deal {
    _id
    number
    name
    startDate
    closeDate
    createdAt
    priority
    pipeline {
      _id
      boardId
    }
    assignedUsers {
      _id
      details {
        avatar
        fullName
      }
    }
    customers {
      _id
      firstName
      lastName
      primaryEmail
      primaryPhone
    }
    companies {
      _id
      primaryName
      primaryEmail
      primaryPhone
    }
    tags {
      _id
      name
      colorCode
    }
    products {
      _id
      name
    }
    productsData
    customProperties
  }
`;

const DEAL_CHOOSER_FIELDS = gql`
  fragment CarDealChooserFields on Deal {
    _id
    number
    name
    createdAt
  }
`;

const GET_CAR_DEALS = gql`
  query CarDeals(
    $_ids: [String]
    $search: String
    $limit: Int
    $cursor: String
    $direction: CURSOR_DIRECTION
  ) {
    deals(
      _ids: $_ids
      search: $search
      limit: $limit
      cursor: $cursor
      direction: $direction
      noSkipArchive: true
    ) {
      list {
        ...CarDealCardFields
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }

  ${DEAL_CARD_FIELDS}
`;

const GET_CAR_DEAL_CHOICES = gql`
  query CarDealChoices(
    $search: String
    $limit: Int
    $cursor: String
    $direction: CURSOR_DIRECTION
    $orderBy: JSON
  ) {
    deals(
      search: $search
      limit: $limit
      cursor: $cursor
      direction: $direction
      orderBy: $orderBy
    ) {
      list {
        ...CarDealChooserFields
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }

  ${DEAL_CHOOSER_FIELDS}
`;

const ADD_CAR_DEAL = gql`
  mutation CarDealAdd(
    $name: String
    $stageId: String
    $aboveItemId: String
    $description: String
    $assignedUserIds: [String]
    $companyIds: [String]
    $customerIds: [String]
    $labelIds: [String]
    $startDate: Date
    $closeDate: Date
    $priority: String
  ) {
    dealsAdd(
      name: $name
      stageId: $stageId
      aboveItemId: $aboveItemId
      description: $description
      assignedUserIds: $assignedUserIds
      companyIds: $companyIds
      customerIds: $customerIds
      labelIds: $labelIds
      startDate: $startDate
      closeDate: $closeDate
      priority: $priority
    ) {
      _id
      number
      name
    }
  }
`;

const GET_CAR_DEAL_PIPELINE_LABELS = gql`
  query CarDealPipelineLabels($pipelineId: String) {
    salesPipelineLabels(pipelineId: $pipelineId) {
      _id
      name
      colorCode
    }
  }
`;

const GET_CAR_DEAL_RELATIONS = gql`
  query CarDealRelations(
    $contentId: String!
    $contentType: String!
    $relatedContentType: String!
  ) {
    getRelationsByEntity(
      contentId: $contentId
      contentType: $contentType
      relatedContentType: $relatedContentType
    ) {
      _id
      entities {
        contentType
        contentId
      }
    }
  }
`;

type CarDeal = {
  _id: string;
  number?: string | null;
  name?: string | null;
  startDate?: string | null;
  closeDate?: string | null;
  createdAt?: string | null;
  priority?: string | null;
  pipeline?: {
    _id?: string | null;
    boardId?: string | null;
  } | null;
  assignedUsers?: Array<{
    _id: string;
    details?: { avatar?: string | null; fullName?: string | null } | null;
  }>;
  customers?: Array<{
    _id: string;
    firstName?: string | null;
    lastName?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
  }>;
  companies?: Array<{
    _id: string;
    primaryName?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
  }>;
  tags?: Array<{
    _id: string;
    name?: string | null;
    colorCode?: string | null;
  }>;
  products?: Array<{
    _id: string;
    name?: string | null;
  }>;
  productsData?: Array<Record<string, any>> | null;
  customProperties?: Array<Record<string, any>> | null;
};

type DealsQueryData = {
  deals?: {
    list?: CarDeal[];
    pageInfo?: {
      endCursor?: string | null;
      hasNextPage?: boolean | null;
    } | null;
    totalCount?: number | null;
  } | null;
};

type RelationData = {
  getRelationsByEntity?: Array<{
    entities: Array<{ contentType: string; contentId: string }>;
  }>;
};

type PipelineLabel = {
  _id: string;
  name?: string | null;
  colorCode?: string | null;
};

type PipelineLabelsQueryData = {
  salesPipelineLabels?: PipelineLabel[];
};

type DealDetailItem = {
  label: string;
  color: string;
  quantity?: string | number | null;
  uom?: string | null;
  unitPrice?: string | number | null;
};

const PAGE_SIZE = 20;
const RELATED_DEAL_CONTENT_TYPE = 'sales:deal';
const EMPTY_PRIORITY_VALUE = '__none__';
const DEAL_PRIORITY_OPTIONS = ['Minor', 'Medium', 'High', 'Critical'] as const;
const DEAL_CHOOSER_ORDER_BY = { createdAt: -1 };

type DealPriority = (typeof DEAL_PRIORITY_OPTIONS)[number];

type CreateDealFormValues = {
  name: string;
  description?: string;
  boardId?: string;
  pipelineId?: string;
  stageId: string;
  assignedUserIds?: string[];
  companyIds?: string[];
  customerIds?: string[];
  labelIds?: string[];
  startDate?: string;
  closeDate?: string;
  priority?: string;
};

const createDealSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        t('Deal name is required', {
          defaultValue: 'Deal name is required',
        }),
      ),
    description: z.string().optional(),
    boardId: z.string().optional(),
    pipelineId: z.string().optional(),
    stageId: z
      .string()
      .min(1, t('Stage is required', { defaultValue: 'Stage is required' })),
    assignedUserIds: z.array(z.string()).optional(),
    companyIds: z.array(z.string()).optional(),
    customerIds: z.array(z.string()).optional(),
    labelIds: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    closeDate: z.string().optional(),
    priority: z.string().optional(),
  });

const formatDate = (date?: string | null) => {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

const formatShortId = (id: string) =>
  id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;

const displayDealName = (
  deal: Pick<CarDeal, '_id' | 'name' | 'number'>,
  t: TFunction,
) =>
  deal.name?.trim() ||
  (deal.number
    ? `№ ${deal.number}`
    : t('Deal {{id}}', {
        id: formatShortId(deal._id),
        defaultValue: `Deal ${formatShortId(deal._id)}`,
      }));

const displayDealMeta = (
  deal: Pick<CarDeal, '_id' | 'number' | 'createdAt'>,
  t: TFunction,
) => {
  const createdAt = formatDate(deal.createdAt);
  const parts = [deal.number ? `№ ${deal.number}` : null, createdAt]
    .filter(Boolean)
    .join(' • ');

  return (
    parts ||
    t('ID {{id}}', {
      id: formatShortId(deal._id),
      defaultValue: `ID ${formatShortId(deal._id)}`,
    })
  );
};

const isDealPriority = (priority?: string | null): priority is DealPriority =>
  Boolean(
    priority &&
      (DEAL_PRIORITY_OPTIONS as readonly string[]).includes(priority),
  );

const displayDealPriority = (priority: string | null | undefined, t: TFunction) => {
  if (!priority) {
    return '';
  }

  if (isDealPriority(priority)) {
    return t(priority, { defaultValue: priority });
  }

  return priority;
};

const getDealUrl = (deal: CarDeal) => {
  const query = new URLSearchParams({ salesItemId: deal._id });

  if (deal.pipeline?._id) {
    query.set('pipelineId', deal.pipeline._id);
  }

  if (deal.pipeline?.boardId) {
    query.set('boardId', deal.pipeline.boardId);
  }

  return `/sales/deals?${query.toString()}`;
};

const displayCustomer = (customer: NonNullable<CarDeal['customers']>[number]) =>
  [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
  customer.primaryEmail ||
  customer.primaryPhone ||
  customer._id;

const displayCompany = (company: NonNullable<CarDeal['companies']>[number]) =>
  company.primaryName ||
  company.primaryEmail ||
  company.primaryPhone ||
  company._id;

const normalizeDetailItems = (deal: CarDeal): DealDetailItem[] => {
  const productsData = Array.isArray(deal.productsData)
    ? deal.productsData
    : [];
  const productNamesById = new Map(
    (deal.products || []).map((product) => [product._id, product.name]),
  );
  const customPropertiesData = Array.isArray(deal.customProperties)
    ? deal.customProperties
    : [];

  const products: DealDetailItem[] = productsData.map((productData) => ({
    label:
      productData.productName ||
      productData.name ||
      productNamesById.get(productData.productId) ||
      productData.productId,
    quantity: productData.quantity,
    uom: productData.uom,
    unitPrice: productData.unitPrice,
    color: '#63D2D6',
  }));

  const companies: DealDetailItem[] =
    deal.companies?.map((company) => ({
      label: displayCompany(company),
      color: '#EA475D',
    })) || [];

  const customers: DealDetailItem[] =
    deal.customers?.map((customer) => ({
      label: displayCustomer(customer),
      color: '#F7CE53',
    })) || [];

  const tags: DealDetailItem[] =
    deal.tags?.map((tag) => ({
      label: tag.name || tag._id,
      color: tag.colorCode || '#FF6600',
    })) || [];

  const customProperties: DealDetailItem[] =
    customPropertiesData.map((property) => ({
      label: property.label || property.name || property.value,
      color: '#FF9900',
    })) || [];

  return [...companies, ...customers, ...products, ...tags, ...customProperties]
    .filter((item) => item.label)
    .slice(0, 8);
};

const CarDealCard = ({ deal }: { deal: CarDeal }) => {
  const { t } = useTranslation('car');
  const details = normalizeDetailItems(deal);
  const startDate = formatDate(deal.startDate);
  const closeDate = formatDate(deal.closeDate);
  const createdAt = formatDate(deal.createdAt);

  return (
    <Card
      className="cursor-pointer bg-background transition-colors hover:bg-muted/40"
      onClick={() => window.open(getDealUrl(deal), '_blank')}
    >
      <div className="flex h-9 items-center justify-between gap-2 px-2 text-sm text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <IconCalendar className="size-4 shrink-0" />
          <TextOverflowTooltip
            value={startDate || t('Start Date', { defaultValue: 'Start Date' })}
          />
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <IconCalendar className="size-4 shrink-0" />
          <TextOverflowTooltip
            value={closeDate || t('Close Date', { defaultValue: 'Close Date' })}
          />
        </span>
      </div>
      <Separator />
      <div className="space-y-3 p-3">
        {deal.number ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">№ {deal.number}</Badge>
          </div>
        ) : null}
        <h5 className="min-w-0 font-semibold">
          <TextOverflowTooltip value={displayDealName(deal, t)} />
        </h5>
        <div className="flex flex-wrap gap-1">
          {deal.priority ? (
            <Badge variant="secondary">
              {displayDealPriority(deal.priority, t)}
            </Badge>
          ) : null}
          {deal.customers?.length ? (
            <Badge variant="secondary">
              <IconUsers className="size-3" />
              {t('Customers +{{count}}', {
                count: deal.customers.length,
                defaultValue: `Customers +${deal.customers.length}`,
              })}
            </Badge>
          ) : null}
          {deal.companies?.length ? (
            <Badge variant="secondary">
              {t('Company(s) +{{count}}', {
                count: deal.companies.length,
                defaultValue: `Company(s) +${deal.companies.length}`,
              })}
            </Badge>
          ) : null}
          {deal.tags?.length ? (
            <Badge variant="secondary">
              <IconTag className="size-3" />
              {t('Tag +{{count}}', {
                count: deal.tags.length,
                defaultValue: `Tag +${deal.tags.length}`,
              })}
            </Badge>
          ) : null}
        </div>
      </div>
      {details.length ? (
        <div className="space-y-0.5 px-3 pb-3">
          {details.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex items-start gap-1 text-xs text-muted-foreground"
            >
              <span
                className="mt-0.5 h-3 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 break-words">
                {item.label}
                {item.quantity ? (
                  <span className="text-muted-foreground/70">
                    {' '}
                    ({item.quantity} {item.uom || t('PC', { defaultValue: 'PC' })})
                  </span>
                ) : null}
                {item.unitPrice ? (
                  <span className="text-muted-foreground/70">
                    {' '}
                    - {Number(item.unitPrice).toLocaleString()}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <Separator />
      <div className="flex h-11 items-center justify-between gap-3 px-3 text-sm text-muted-foreground">
        <TextOverflowTooltip
          value={deal.number ? `№ ${deal.number}` : createdAt || '—'}
        />
        {deal.assignedUsers?.length ? (
          <TextOverflowTooltip
            className="max-w-[55%] shrink-0"
            value={deal.assignedUsers
              .map((user) => user.details?.fullName || user._id)
              .join(', ')}
          />
        ) : (
          <IconExternalLink className="size-4 shrink-0" />
        )}
      </div>
    </Card>
  );
};

const DealChooser = ({
  currentDealIds,
  onSelect,
  children,
}: {
  currentDealIds: string[];
  onSelect: (dealIds: string[]) => Promise<void>;
  children?: ReactNode;
}) => {
  const { t } = useTranslation('car');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 400);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const searchValue = debouncedSearch || undefined;

  const resetChooser = () => {
    setSelectedDealIds([]);
    setSearch('');
  };

  const { data, loading, error, fetchMore } = useQuery<DealsQueryData>(
    GET_CAR_DEAL_CHOICES,
    {
      variables: {
        search: searchValue,
        limit: PAGE_SIZE,
        orderBy: DEAL_CHOOSER_ORDER_BY,
      },
      skip: !open,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
  );

  const deals = (data?.deals?.list || []).filter(Boolean);
  const pageInfo = data?.deals?.pageInfo;
  const totalCount = data?.deals?.totalCount || 0;

  const { ref: bottomRef } = useInView({
    onChange: (inView) => {
      if (!inView || !pageInfo?.hasNextPage || loading) {
        return;
      }

      void fetchMore({
        variables: {
          cursor: pageInfo.endCursor,
          direction: EnumCursorDirection.FORWARD,
          search: searchValue,
          limit: PAGE_SIZE,
          orderBy: DEAL_CHOOSER_ORDER_BY,
        },
        updateQuery: (prev, { fetchMoreResult }) => ({
          deals: {
            ...fetchMoreResult.deals,
            list: [
              ...(prev.deals?.list || []),
              ...(fetchMoreResult.deals?.list || []),
            ],
          },
        }),
      });
    },
  });

  const toggleDeal = (dealId: string) => {
    setSelectedDealIds((prev) =>
      prev.includes(dealId)
        ? prev.filter((id) => id !== dealId)
        : [...prev, dealId],
    );
  };

  const handleSelect = async () => {
    await onSelect(selectedDealIds);
    resetChooser();
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetChooser();
        }
      }}
    >
      <Sheet.Trigger asChild>
        {children || (
          <Button variant="secondary">
            <IconPointerUp />
            {t('Choose an existing deal', {
              defaultValue: 'Choose an existing deal',
            })}
          </Button>
        )}
      </Sheet.Trigger>
      <Sheet.View className="sm:max-w-4xl">
        <Sheet.Header>
          <Sheet.Title>
            {t('Select deals', { defaultValue: 'Select deals' })}
          </Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="grid grid-cols-1 overflow-hidden p-0 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b md:border-b-0 md:border-r">
            <div className="space-y-3 p-4">
              <Input
                placeholder={t('Search deals', {
                  defaultValue: 'Search deals',
                })}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {loading && !deals.length
                  ? t('Loading deals...', {
                      defaultValue: 'Loading deals...',
                    })
                  : searchValue
                  ? t('{{count}} results', {
                      count: totalCount,
                      defaultValue: `${totalCount} results`,
                    })
                  : t('Showing {{shown}} of {{total}} deals', {
                      shown: deals.length,
                      total: totalCount,
                      defaultValue: `Showing ${deals.length} of ${totalCount} deals`,
                    })}
              </p>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-4">
                {error ? (
                  <div className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
                    {t('Failed to load deals. Try a more specific search.', {
                      defaultValue:
                        'Failed to load deals. Try a more specific search.',
                    })}
                  </div>
                ) : null}
                {loading && !deals.length ? <Spinner /> : null}
                {deals.map((deal) => {
                  const isAlreadyAdded = currentDealIds.includes(deal._id);
                  const isSelected = selectedDealIds.includes(deal._id);

                  return (
                    <Button
                      key={deal._id}
                      variant="ghost"
                      className={cn(
                        'h-auto min-h-9 w-full justify-start gap-2 whitespace-normal text-left font-normal',
                        (isSelected || isAlreadyAdded) &&
                          'bg-primary/10 hover:bg-primary/10',
                      )}
                      disabled={isAlreadyAdded}
                      onClick={() => toggleDeal(deal._id)}
                    >
                      <span className="min-w-0 flex-1">
                        <TextOverflowTooltip
                          className="block"
                          value={displayDealName(deal, t)}
                        />
                        <TextOverflowTooltip
                          className="block text-xs text-muted-foreground"
                          value={displayDealMeta(deal, t)}
                        />
                      </span>
                      {isSelected || isAlreadyAdded ? (
                        <IconCheck className="size-4" />
                      ) : (
                        <IconPlus className="size-4" />
                      )}
                    </Button>
                  );
                })}
                {pageInfo?.hasNextPage ? (
                  <div ref={bottomRef} className="flex h-10 items-center gap-2">
                    <Spinner />
                    <span className="text-sm text-muted-foreground">
                      {t('Loading more deals...', {
                        defaultValue: 'Loading more deals...',
                      })}
                    </span>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>
          <ScrollArea>
            <div className="space-y-2 p-4">
              <p className="text-xs text-muted-foreground">
                {t('Added', { defaultValue: 'Added' })}
              </p>
              {selectedDealIds.map((dealId) => {
                const deal = deals.find((item) => item._id === dealId);

                return (
                  <Button
                    key={dealId}
                    variant="ghost"
                    className="h-auto min-h-9 w-full justify-start gap-2 text-left font-normal"
                    onClick={() => toggleDeal(dealId)}
                  >
                    <span className="min-w-0 flex-1">
                      <TextOverflowTooltip
                        className="block"
                        value={
                          deal
                            ? displayDealName(deal, t)
                            : formatShortId(dealId)
                        }
                      />
                      <TextOverflowTooltip
                        className="block text-xs text-muted-foreground"
                        value={
                          deal
                            ? displayDealMeta(deal, t)
                            : t('ID {{id}}', {
                                id: formatShortId(dealId),
                                defaultValue: `ID ${formatShortId(dealId)}`,
                              })
                        }
                      />
                    </span>
                    <IconX className="size-4" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary">
              {t('Cancel', { defaultValue: 'Cancel' })}
            </Button>
          </Sheet.Close>
          <Button disabled={!selectedDealIds.length} onClick={handleSelect}>
            {t('Add selected deals', { defaultValue: 'Add selected deals' })}
          </Button>
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};

const PipelineLabelsSelect = ({
  pipelineId,
  value = [],
  onValueChange,
}: {
  pipelineId?: string;
  value?: string[];
  onValueChange: (labelIds: string[]) => void;
}) => {
  const { t } = useTranslation('car');
  const [open, setOpen] = useState(false);
  const { data, loading, error } = useQuery<PipelineLabelsQueryData>(
    GET_CAR_DEAL_PIPELINE_LABELS,
    {
      variables: { pipelineId },
      skip: !pipelineId,
      fetchPolicy: 'cache-and-network',
    },
  );
  const labels = data?.salesPipelineLabels || [];
  const selectedLabels = labels.filter((label) => value.includes(label._id));

  const toggleLabel = (labelId: string) => {
    onValueChange(
      value.includes(labelId)
        ? value.filter((id) => id !== labelId)
        : [...value, labelId],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start overflow-hidden font-normal"
          disabled={!pipelineId}
        >
          <IconTag className="size-4 shrink-0" />
          <span className="truncate">
            {!pipelineId
              ? t('Select pipeline first', {
                  defaultValue: 'Select pipeline first',
                })
              : selectedLabels.length
              ? selectedLabels
                  .map((label) => label.name || label._id)
                  .join(', ')
              : t('Select labels', { defaultValue: 'Select labels' })}
          </span>
        </Button>
      </Popover.Trigger>
      <Combobox.Content className="w-80">
        <Command>
          <Command.Input
            placeholder={t('Search labels', { defaultValue: 'Search labels' })}
          />
          <Command.List className="p-1">
            {loading ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Spinner />
                {t('Loading labels...', { defaultValue: 'Loading labels...' })}
              </div>
            ) : error ? (
              <div className="p-2 text-sm text-destructive">
                {t('Failed to load labels.', {
                  defaultValue: 'Failed to load labels.',
                })}
              </div>
            ) : labels.length ? (
              labels.map((label) => (
                <Command.Item
                  key={label._id}
                  value={label.name || label._id}
                  onSelect={() => toggleLabel(label._id)}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{
                      backgroundColor: label.colorCode || '#6366f1',
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {label.name || label._id}
                  </span>
                  <Combobox.Check checked={value.includes(label._id)} />
                </Command.Item>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                {t('No labels in this pipeline.', {
                  defaultValue: 'No labels in this pipeline.',
                })}
              </div>
            )}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

const CreateDealSheet = ({
  onCreate,
  children,
  showText,
}: {
  onCreate: (dealId: string) => Promise<void>;
  children?: ReactNode;
  showText?: boolean;
}) => {
  const { t } = useTranslation('car');
  const [open, setOpen] = useState(false);
  const validationSchema = useMemo(() => createDealSchema(t), [t]);
  const form = useForm<CreateDealFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: '',
      description: '',
      boardId: '',
      pipelineId: '',
      stageId: '',
      assignedUserIds: [],
      companyIds: [],
      customerIds: [],
      labelIds: [],
      startDate: '',
      closeDate: '',
      priority: EMPTY_PRIORITY_VALUE,
    },
  });
  const [boardId, pipelineId] = useWatch({
    control: form.control,
    name: ['boardId', 'pipelineId'],
  });
  const [createDeal, { loading }] = useMutation<{
    dealsAdd?: {
      _id: string;
      number?: string | null;
      name?: string | null;
    } | null;
  }>(ADD_CAR_DEAL);

  const resetForm = () => {
    form.reset();
  };

  const handleSubmit = async (values: CreateDealFormValues) => {
    const response = await createDeal({
      variables: {
        name: values.name.trim(),
        stageId: values.stageId,
        aboveItemId: '',
        description: values.description || undefined,
        assignedUserIds: values.assignedUserIds,
        companyIds: values.companyIds,
        customerIds: values.customerIds,
        labelIds: values.labelIds,
        startDate: values.startDate || undefined,
        closeDate: values.closeDate || undefined,
        priority:
          values.priority && values.priority !== EMPTY_PRIORITY_VALUE
            ? values.priority
            : undefined,
      },
    });

    const dealId = response.data?.dealsAdd?._id;

    if (!dealId) {
      throw new Error(
        t('Deal was created without an id', {
          defaultValue: 'Deal was created without an id',
        }),
      );
    }

    await onCreate(dealId);
    resetForm();
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <Sheet.Trigger asChild>
        {children || (
          <Button variant="secondary">
            <IconPlus />
            {showText
              ? t('Add a deal', { defaultValue: 'Add a deal' })
              : null}
          </Button>
        )}
      </Sheet.Trigger>
      <Sheet.View className="w-full p-0 sm:max-w-3xl">
        <Form {...form}>
          <form
            className="flex h-full flex-col overflow-hidden"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <Sheet.Header className="p-5">
              <Sheet.Title>{t('Add deal', { defaultValue: 'Add deal' })}</Sheet.Title>
              <Sheet.Description className="sr-only">
                {t('Create a sales deal and link it to this car.', {
                  defaultValue: 'Create a sales deal and link it to this car.',
                })}
              </Sheet.Description>
              <Sheet.Close />
            </Sheet.Header>
            <Sheet.Content className="min-h-0 flex-auto overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-5 pb-24">
                  <div className="grid grid-cols-1 gap-4">
                    <Form.Field
                      control={form.control}
                      name="name"
                        render={({ field }) => (
                        <Form.Item>
                          <Form.Label>{t('Name', { defaultValue: 'Name' })}</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              placeholder={t('Deal name', {
                                defaultValue: 'Deal name',
                              })}
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      control={form.control}
                      name="description"
                        render={({ field }) => (
                        <Form.Item>
                          <Form.Label>
                            {t('Description', { defaultValue: 'Description' })}
                          </Form.Label>
                          <Form.Control>
                            <Editor
                              initialContent={field.value}
                              onChange={field.onChange}
                              scope="car-add-deal-description-field"
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">
                        {t('Workflow', { defaultValue: 'Workflow' })}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t('Choose where this new deal should live in Sales.', {
                          defaultValue:
                            'Choose where this new deal should live in Sales.',
                        })}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Form.Field
                        control={form.control}
                        name="boardId"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Select board', {
                                defaultValue: 'Select board',
                              })}
                            </Form.Label>
                            <SelectBoard.FormItem
                              mode="single"
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value || '');
                                form.setValue('pipelineId', '');
                                form.setValue('stageId', '');
                              }}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="pipelineId"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Select pipeline', {
                                defaultValue: 'Select pipeline',
                              })}
                            </Form.Label>
                            <SelectPipeline.FormItem
                              mode="single"
                              value={field.value}
                              boardId={boardId}
                              onValueChange={(value) => {
                                field.onChange(value || '');
                                form.setValue('stageId', '');
                                form.setValue('labelIds', []);
                              }}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="stageId"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Select stage', {
                                defaultValue: 'Select stage',
                              })}
                            </Form.Label>
                            <SelectStage.FormItem
                              mode="single"
                              value={field.value}
                              pipelineId={pipelineId}
                              onValueChange={(value) =>
                                field.onChange(value || '')
                              }
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">
                        {t('People', { defaultValue: 'People' })}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          'Attach ownership and related contacts while creating the deal.',
                          {
                            defaultValue:
                              'Attach ownership and related contacts while creating the deal.',
                          },
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Form.Field
                        control={form.control}
                        name="assignedUserIds"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Assigned to', { defaultValue: 'Assigned to' })}
                            </Form.Label>
                            <SelectMember.FormItem
                              mode="multiple"
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="customerIds"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Select customers', {
                                defaultValue: 'Select customers',
                              })}
                            </Form.Label>
                            <SelectCustomer.FormItem
                              mode="multiple"
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="companyIds"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Select companies', {
                                defaultValue: 'Select companies',
                              })}
                            </Form.Label>
                            <SelectCompany
                              mode="multiple"
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="labelIds"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Select labels', {
                                defaultValue: 'Select labels',
                              })}
                            </Form.Label>
                            <PipelineLabelsSelect
                              pipelineId={pipelineId}
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">
                        {t('Schedule', { defaultValue: 'Schedule' })}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t('Optional dates and priority shown on deal cards.', {
                          defaultValue:
                            'Optional dates and priority shown on deal cards.',
                        })}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Form.Field
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Start date', { defaultValue: 'Start date' })}
                            </Form.Label>
                            <Form.Control>
                              <Input {...field} type="date" />
                            </Form.Control>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="closeDate"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Close date', { defaultValue: 'Close date' })}
                            </Form.Label>
                            <Form.Control>
                              <Input {...field} type="date" />
                            </Form.Control>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                      <Form.Field
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {t('Priority', { defaultValue: 'Priority' })}
                            </Form.Label>
                            <Select
                              value={field.value || EMPTY_PRIORITY_VALUE}
                              onValueChange={field.onChange}
                            >
                              <Form.Control>
                                <Select.Trigger>
                                  <Select.Value
                                    placeholder={t('Select priority', {
                                      defaultValue: 'Select priority',
                                    })}
                                  />
                                </Select.Trigger>
                              </Form.Control>
                              <Select.Content>
                                <Select.Item value={EMPTY_PRIORITY_VALUE}>
                                  {t('No Priority', {
                                    defaultValue: 'No Priority',
                                  })}
                                </Select.Item>
                                {DEAL_PRIORITY_OPTIONS.map((priority) => (
                                  <Select.Item key={priority} value={priority}>
                                    {displayDealPriority(priority, t)}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </Sheet.Content>
            <Sheet.Footer className="flex shrink-0 justify-end gap-1 px-5">
              <Sheet.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="bg-background hover:bg-background/90"
                >
                  {t('Cancel', { defaultValue: 'Cancel' })}
                </Button>
              </Sheet.Close>
              <Button type="submit" disabled={loading}>
                {loading
                  ? t('Saving...', { defaultValue: 'Saving...' })
                  : t('Save', { defaultValue: 'Save' })}
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
};

export const CarDealsRelationPanel = ({
  carId,
  contentType,
  access,
}: {
  carId: string;
  contentType: string;
  access: 'read' | 'write';
}) => {
  const { t } = useTranslation('car');
  const {
    data: relationData,
    loading: loadingRelations,
    refetch,
  } = useQuery<RelationData>(GET_CAR_DEAL_RELATIONS, {
    variables: {
      contentId: carId,
      contentType,
      relatedContentType: RELATED_DEAL_CONTENT_TYPE,
    },
    fetchPolicy: 'cache-and-network',
  });
  const [manageRelations, { loading: managingRelations }] =
    useMutation(MANAGE_RELATIONS);

  const dealIds = useMemo(() => {
    const ids =
      relationData?.getRelationsByEntity?.flatMap((relation) =>
        relation.entities
          .filter((entity) => entity.contentType === RELATED_DEAL_CONTENT_TYPE)
          .map((entity) => entity.contentId),
      ) || [];

    return [...new Set(ids)];
  }, [relationData]);

  const {
    data: dealsData,
    loading: loadingDeals,
    error,
  } = useQuery<DealsQueryData>(GET_CAR_DEALS, {
    variables: {
      _ids: dealIds,
      limit: Math.max(dealIds.length, 1),
    },
    skip: !dealIds.length,
    fetchPolicy: 'cache-and-network',
  });

  const deals = dealsData?.deals?.list || [];
  const loading = loadingRelations || loadingDeals;

  const handleAddExistingDeals = async (
    selectedDealIds: string[],
    toastTitle?: string,
  ) => {
    const relatedContentIds = [...new Set([...dealIds, ...selectedDealIds])];

    await manageRelations({
      variables: {
        contentType,
        contentId: carId,
        relatedContentType: RELATED_DEAL_CONTENT_TYPE,
        relatedContentIds,
      },
    });

    await refetch();

    toast({
      title:
        toastTitle ||
        t('Deals linked successfully', {
          defaultValue: 'Deals linked successfully',
        }),
      variant: 'success',
    });
  };

  const handleCreateDeal = async (dealId: string) => {
    await handleAddExistingDeals(
      [dealId],
      t('Deal created and linked successfully', {
        defaultValue: 'Deal created and linked successfully',
      }),
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex h-11 flex-none items-center justify-between border-b bg-background px-4">
        <span className="font-medium text-primary">
          {t('Deals', { defaultValue: 'Deals' })}
        </span>
        {access === 'write' ? (
          <div className="flex items-center gap-2">
            <CreateDealSheet onCreate={handleCreateDeal}>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t('Add deal', { defaultValue: 'Add deal' })}
              >
                <IconPlus />
              </Button>
            </CreateDealSheet>
            <DealChooser
              currentDealIds={dealIds}
              onSelect={handleAddExistingDeals}
            >
              <Button
                variant="secondary"
                size="icon"
                aria-label={t('Choose existing deals', {
                  defaultValue: 'Choose existing deals',
                })}
              >
                <IconPointerUp />
              </Button>
            </DealChooser>
          </div>
        ) : null}
      </div>
      {loading ? (
        <Spinner containerClassName="flex h-full items-center justify-center" />
      ) : error ? (
        <div className="m-4 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
          {t('Failed to load related deals.', {
            defaultValue: 'Failed to load related deals.',
          })}
        </div>
      ) : !deals.length ? (
        <div className="flex flex-auto flex-col items-center justify-center gap-4 p-4 text-center text-muted-foreground">
          <div className="rounded-xl border border-dashed bg-background p-6">
            <IconPlus />
          </div>
          <span className="text-sm">
            {t('No deals to display at the moment.', {
              defaultValue: 'No deals to display at the moment.',
            })}
          </span>
          {access === 'write' ? (
            <div className="flex flex-col gap-2">
              <CreateDealSheet onCreate={handleCreateDeal} showText />
              <DealChooser
                currentDealIds={dealIds}
                onSelect={handleAddExistingDeals}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <ScrollArea className="flex-auto">
          <div className="flex flex-col gap-4 p-4">
            {deals.map((deal) => (
              <CarDealCard key={deal._id} deal={deal} />
            ))}
          </div>
        </ScrollArea>
      )}
      {managingRelations ? (
        <div className="absolute inset-x-0 bottom-0 border-t bg-background/95 px-4 py-2 text-sm text-muted-foreground">
          {t('Linking deals...', { defaultValue: 'Linking deals...' })}
        </div>
      ) : null}
    </div>
  );
};
