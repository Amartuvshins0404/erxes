import { IconChevronRight } from '@tabler/icons-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Button,
  ChartContainer,
  Command,
  Popover,
  Select,
  SelectTree,
  Skeleton,
  cn,
} from 'erxes-ui';
import { type CategoryDistributionItem } from '~/components/dashboard/main-indicators-dashboard/types';

interface CategoryPlanOption {
  value: string;
  label: string;
}

interface CategoryDistributionSectionProps {
  loading: boolean;
  hasStats: boolean;
  selectedPlanId: string;
  onSelectedPlanIdChange: (value: string) => void;
  categoryPlanOptions: CategoryPlanOption[];
  categoryDistribution: CategoryDistributionItem[];
  categoryDropdownOpen: boolean;
  onCategoryDropdownOpenChange: (value: boolean) => void;
  selectedCategoryId: string | null;
  onSelectedCategoryIdChange: (value: string | null) => void;
  collapsedCategoryIds: string[];
  onToggleCategory: (categoryId: string, hasChildren: boolean) => void;
  categoryChildrenByParentId: Map<string, number>;
  visibleCategoryDistribution: CategoryDistributionItem[];
  selectedCategoryLabel: string;
  categoryChartItems: CategoryDistributionItem[];
}

export function CategoryDistributionSection({
  loading,
  hasStats,
  selectedPlanId,
  onSelectedPlanIdChange,
  categoryPlanOptions,
  categoryDistribution,
  categoryDropdownOpen,
  onCategoryDropdownOpenChange,
  selectedCategoryId,
  onSelectedCategoryIdChange,
  collapsedCategoryIds,
  onToggleCategory,
  categoryChildrenByParentId,
  visibleCategoryDistribution,
  selectedCategoryLabel,
  categoryChartItems,
}: CategoryDistributionSectionProps) {
  const hasCategoryData = categoryDistribution.length > 0;
  const categoryChartConfig = {
    value: { label: 'Count', color: '#3b82f6' },
  };
  const categoryChartData = categoryChartItems.map((category) => ({
    name: category.label,
    value: category.count,
    percent: category.percent,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          Үйлчилгээний категори
        </h3>
        <Select value={selectedPlanId} onValueChange={onSelectedPlanIdChange}>
          <Select.Trigger className="min-w-[220px] border-gray-200">
            <Select.Value placeholder="Багц сонгох" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Бүх багц</Select.Item>
            {categoryPlanOptions.map((plan) => (
              <Select.Item key={plan.value} value={plan.value}>
                {plan.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {loading && !hasStats ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !hasCategoryData ? (
        <p className="mt-4 text-sm text-gray-500">
          Сонгосон хугацаанд категорийн өгөгдөл алга байна.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <SelectTree.Provider
            id="dashboard-category-distribution-select"
            ordered
            length={categoryDistribution.length}
          >
            <Popover
              open={categoryDropdownOpen}
              onOpenChange={onCategoryDropdownOpenChange}
            >
              <Popover.Trigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryDropdownOpen}
                  className="w-full max-w-md justify-between border-gray-200 font-normal"
                >
                  <span className="truncate">{selectedCategoryLabel}</span>
                  <IconChevronRight className="size-4 -rotate-90 text-gray-500" />
                </Button>
              </Popover.Trigger>
              <Popover.Content className="w-[420px] p-0" align="start">
                <Command shouldFilter={false}>
                  <Command.List className="max-h-[300px] overflow-y-auto p-1">
                    <Command.Item
                      value="__all__"
                      onSelect={() => {
                        onSelectedCategoryIdChange(null);
                        onCategoryDropdownOpenChange(false);
                      }}
                    >
                      Бүх категори
                    </Command.Item>
                    {visibleCategoryDistribution.map((category) => {
                      const safeDepth = Math.max(category.depth || 0, 0);
                      const hasChildren = Boolean(
                        categoryChildrenByParentId.get(category.categoryId),
                      );
                      const isCollapsed = collapsedCategoryIds.includes(
                        category.categoryId,
                      );
                      const isSelected =
                        selectedCategoryId === category.categoryId;

                      return (
                        <SelectTree.Item
                          key={category.categoryId}
                          _id={category.categoryId}
                          order={category.categoryId}
                          hasChildren={hasChildren}
                          name={category.label}
                          value={category.categoryId}
                          selected={isSelected}
                          onSelect={() => {
                            onSelectedCategoryIdChange(category.categoryId);
                            onCategoryDropdownOpenChange(false);
                          }}
                        >
                          <div
                            className={cn(
                              'flex w-full items-center gap-1 rounded-md px-2 py-1.5',
                              isSelected && 'bg-gray-100',
                            )}
                            style={{ paddingLeft: `${safeDepth * 16}px` }}
                          >
                            {hasChildren ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onToggleCategory(category.categoryId, true);
                                }}
                              >
                                <IconChevronRight
                                  className={cn(
                                    'size-4 transition-transform',
                                    !isCollapsed && 'rotate-90',
                                  )}
                                />
                              </Button>
                            ) : (
                              <span className="inline-block size-6" />
                            )}
                            <span className="truncate text-sm text-gray-900">
                              {category.label}
                            </span>
                          </div>
                        </SelectTree.Item>
                      );
                    })}
                  </Command.List>
                </Command>
              </Popover.Content>
            </Popover>
          </SelectTree.Provider>

          {categoryChartItems.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <ChartContainer
                config={categoryChartConfig}
                className="h-52 w-full max-w-2xl"
              >
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical
                    stroke="#d4d4d8"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#52525b', fontSize: 12 }}
                    axisLine={{ stroke: '#a1a1aa' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#52525b', fontSize: 12 }}
                    axisLine={{ stroke: '#a1a1aa' }}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                    cursor={{ fill: '#f4f4f5' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[2, 2, 0, 0]}
                  >
                    <LabelList
                      dataKey="percent"
                      position="top"
                      formatter={(value) =>
                        `${Math.round(Number(value) || 0)}%`
                      }
                      className="fill-gray-600 text-xs"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
