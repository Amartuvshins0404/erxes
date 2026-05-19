import {
  Button,
  Sheet,
  Spinner,
  Form,
  ScrollArea,
  Select,
  Input,
  CurrencyField,
  CurrencyCode,
  DatePicker,
  toast,
  Checkbox,
  Textarea,
  InfoCard,
} from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { SelectCustomer, SelectCompany, SelectMember } from 'ui-modules';
import {
  ContractFormData,
  contractSchema,
} from '@/contract/constants/contractSchema';
import {
  CONTRACT_AMOUNT_TYPE_OPTIONS,
  CONTRACT_PARTY_TYPE_OPTIONS,
} from '@/contract/constants/contract';
import { PaymentPlanForm } from '@/pricing/components/PaymentPlanForm';
import { ContractUnit } from './ContractUnit';
import { ContractUnitSelector } from './ContractUnitSelector';
import { useBlockContractStatusesByType } from '@/contract-status/hooks/useGetBlockContractStatuses';
import { IUnit } from '@/unit/types/unitType';

const TYPE_ORDER = ['reserved', 'draft', 'signed', 'lost', 'cancelled'];

export const ContractFormSheet = ({
  defaultValues,
  onSubmit,
  loading,
  isEdit = false,
  unit,
  hideUnitSection = false,
  unitIdFromUrl,
  submitLabel,
}: {
  defaultValues?: Partial<ContractFormData>;
  onSubmit: (data: ContractFormData) => void;
  loading?: boolean;
  isEdit?: boolean;
  unit?: IUnit;
  hideUnitSection?: boolean;
  unitIdFromUrl?: string | null;
  submitLabel?: string;
}) => {
  const { projectId: projectIdParam, id: idParam } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || idParam || '';
  const { statuses = [] } = useBlockContractStatusesByType({ projectId });

  const stages = [...statuses].sort((a, b) => {
    const ti = TYPE_ORDER.indexOf(a.type);
    const tj = TYPE_ORDER.indexOf(b.type);
    if (ti !== tj) return ti - tj;
    return (a.order || 0) - (b.order || 0);
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      unit: unitIdFromUrl || '',
      status: '',
      party: { type: 'customer', id: '' },
      currency: CurrencyCode.MNT,
      ...defaultValues,
    },
  });

  const partyType = form.watch('party.type');
  const isLifeTime = form.watch('isLifeTime');

  const onValidationError = (errors: any) => {
    console.error('Contract form validation errors:', errors);
    const messages: string[] = [];
    const collect = (obj: any, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === 'object' && 'message' in (val as any)) {
          messages.push(`${path}: ${(val as any).message}`);
        } else if (val && typeof val === 'object') {
          collect(val, path);
        }
      }
    };
    collect(errors);
    toast({
      title: 'Form invalid',
      description: messages.join('\n') || 'Please fix form errors',
      variant: 'destructive',
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onValidationError)}
        className="flex flex-col flex-auto overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-5">
              {!hideUnitSection &&
                (unitIdFromUrl ? (
                  <ContractUnit />
                ) : (
                  <InfoCard title="Unit">
                    <InfoCard.Content>
                      <ContractUnitSelector
                        control={form.control}
                        setValue={form.setValue}
                      />
                    </InfoCard.Content>
                  </InfoCard>
                ))}

              {hideUnitSection && unit && (
                <InfoCard title="Unit">
                  <InfoCard.Content>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Number</div>
                        <div className="font-medium">{unit.number}</div>
                      </div>
                      {unit.unitType?.size != null && (
                        <div>
                          <div className="text-muted-foreground">Area</div>
                          <div className="font-medium">
                            {unit.unitType.size}m²
                          </div>
                        </div>
                      )}
                      {unit.unitType?.price != null && (
                        <div>
                          <div className="text-muted-foreground">Price</div>
                          <div className="font-medium">
                            {Number(unit.unitType.price).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </InfoCard.Content>
                </InfoCard>
              )}

              <InfoCard title="Schedule">
                <InfoCard.Content>
                  <div className="gap-4 grid grid-cols-3 items-end">
                    <Form.Field
                      name="date"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Contract Date</Form.Label>
                          <DatePicker
                            placeholder="Select date"
                            value={(() => {
                              if (!field.value) return undefined;
                              const num = Number(field.value);
                              const d = new Date(
                                isNaN(num) ? field.value : num,
                              );
                              return isNaN(d.getTime()) ? undefined : d;
                            })()}
                            onChange={(date) => {
                              const dateValue = Array.isArray(date)
                                ? date[0]
                                : date;
                              field.onChange(
                                dateValue
                                  ? dateValue.toISOString()
                                  : undefined,
                              );
                            }}
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Start Date</Form.Label>
                          <DatePicker
                            placeholder="Select start date"
                            value={(() => {
                              if (!field.value) return undefined;
                              const num = Number(field.value);
                              const d = new Date(
                                isNaN(num) ? field.value : num,
                              );
                              return isNaN(d.getTime()) ? undefined : d;
                            })()}
                            onChange={(date) => {
                              const dateValue = Array.isArray(date)
                                ? date[0]
                                : date;
                              field.onChange(
                                dateValue
                                  ? dateValue.toISOString()
                                  : undefined,
                              );
                            }}
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    {!isLifeTime && (
                      <Form.Field
                        name="endDate"
                        control={form.control}
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>End Date</Form.Label>
                            <DatePicker
                              placeholder="Select end date"
                              value={(() => {
                                if (!field.value) return undefined;
                                const num = Number(field.value);
                                const d = new Date(
                                  isNaN(num) ? field.value : num,
                                );
                                return isNaN(d.getTime()) ? undefined : d;
                              })()}
                              onChange={(date) => {
                                const dateValue = Array.isArray(date)
                                  ? date[0]
                                  : date;
                                field.onChange(
                                  dateValue
                                    ? dateValue.toISOString()
                                    : undefined,
                                );
                              }}
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    )}

                    <Form.Field
                      name="isLifeTime"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item className="flex flex-row items-center space-x-3 space-y-0 h-8">
                          <Form.Control>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue('endDate', undefined);
                                }
                              }}
                            />
                          </Form.Control>
                          <Form.Label variant="peer">
                            Lifetime Contract
                          </Form.Label>
                        </Form.Item>
                      )}
                    />
                  </div>
                </InfoCard.Content>
              </InfoCard>

              <InfoCard title="Basic Information">
                <InfoCard.Content>
                  <div className="gap-4 grid grid-cols-2">
                    <Form.Field
                      name="number"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Contract Number</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Auto-generated if empty"
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Status</Form.Label>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <Form.Control>
                              <Select.Trigger className="h-8">
                                <Select.Value placeholder="Select status" />
                              </Select.Trigger>
                            </Form.Control>
                            <Select.Content>
                              {stages.map((stage) => (
                                <Select.Item key={stage._id} value={stage._id}>
                                  <span className="flex items-center gap-2">
                                    {stage.color && (
                                      <span
                                        className="rounded-full size-2"
                                        style={{
                                          backgroundColor: stage.color,
                                        }}
                                      />
                                    )}
                                    {stage.name}
                                  </span>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="party.type"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Party Type</Form.Label>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('party.id', '');
                            }}
                            value={field.value}
                          >
                            <Form.Control>
                              <Select.Trigger className="h-8">
                                <Select.Value placeholder="Select party type" />
                              </Select.Trigger>
                            </Form.Control>
                            <Select.Content>
                              {CONTRACT_PARTY_TYPE_OPTIONS.map((option) => (
                                <Select.Item
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="party.id"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Party</Form.Label>
                          <Form.Control>
                            {partyType === 'customer' ? (
                              <SelectCustomer.FormItem
                                value={field.value}
                                onValueChange={field.onChange}
                                mode="single"
                              />
                            ) : (
                              <SelectCompany
                                value={field.value}
                                onValueChange={field.onChange}
                                mode="single"
                              />
                            )}
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="user"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Assigned to</Form.Label>
                          <SelectMember.FormItem
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            mode="single"
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="paymentPlan.description"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item className="col-span-2">
                          <Form.Label>Description</Form.Label>
                          <Form.Control>
                            <Textarea
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Contract description"
                              className="min-h-20"
                              rows={5}
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />
                  </div>
                </InfoCard.Content>
              </InfoCard>

              <InfoCard title="Amount">
                <InfoCard.Content>
                  <div className="gap-4 grid grid-cols-3">
                    <Form.Field
                      name="currency"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Currency</Form.Label>
                          <CurrencyField.SelectCurrency
                            value={field.value as CurrencyCode}
                            onChange={(value) =>
                              field.onChange(value as CurrencyCode)
                            }
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="amount"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Amount</Form.Label>
                          <CurrencyField.ValueInput
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="amountType"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Amount Type</Form.Label>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <Form.Control>
                              <Select.Trigger className="h-8">
                                <Select.Value placeholder="Select amount type" />
                              </Select.Trigger>
                            </Form.Control>
                            <Select.Content>
                              {CONTRACT_AMOUNT_TYPE_OPTIONS.map((option) => (
                                <Select.Item
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />
                  </div>
                </InfoCard.Content>
              </InfoCard>

              <InfoCard title="Payment Plan">
                <InfoCard.Content>
                  <div className="gap-4 grid grid-cols-4">
                    <PaymentPlanForm form={form} />
                  </div>
                </InfoCard.Content>
              </InfoCard>

            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner containerClassName="flex-none" />}
            {submitLabel || (isEdit ? 'Update' : 'Create')}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
