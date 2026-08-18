import { Badge, Button, Label, Sheet, Spinner, toast } from 'erxes-ui';
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCheckSubdomain } from '../hooks/useCheckSubdomain';
import { useCreateCollective } from '../hooks/useCreateCollective';
import {
  SUBDOMAIN_MAX,
  SUBDOMAIN_MIN,
  isValidSubdomain,
  normalizeSubdomain,
} from '../utils/subdomain';
import { SupplierChooser } from './SupplierChooser';

const MIN_COLLECTIVE_SUPPLIERS = 2;

export const CollectiveAddSheet = () => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const [collectiveSubdomain, setCollectiveSubdomain] = useState('');
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const { createCollective, loading } = useCreateCollective();
  const {
    result: subdomainCheck,
    available: subdomainAvailable,
    loading: checkingSubdomain,
  } = useCheckSubdomain(collectiveSubdomain);
  const suggestion = subdomainCheck?.suggestion;
  const hasInput = !!collectiveSubdomain;
  const validFormat = isValidSubdomain(collectiveSubdomain);

  const reset = () => {
    setCollectiveSubdomain('');
    setSupplierIds([]);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const toggleSupplier = (id: string) => {
    setSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const canSubmit =
    validFormat &&
    supplierIds.length >= MIN_COLLECTIVE_SUPPLIERS &&
    subdomainAvailable === true &&
    !checkingSubdomain &&
    !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    try {
      await createCollective({
        variables: {
          targetSubdomain: collectiveSubdomain.trim(),
          supplierIds,
        },
      });
      toast({ variant: 'success', title: t('Collective created') });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('Failed to create collective'),
        description: e?.message,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.Trigger asChild>
        <Button variant="outline" size="sm">
          <IconPlus />
          {t('Add collective')}
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-md">
        <Sheet.Header>
          <Sheet.Title>{t('Add collective')}</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <Sheet.Content className="flex flex-col flex-1 gap-5 px-5 py-5 min-h-0">
          <div className="flex flex-col gap-2">
            <Label className="mb-0.5 font-medium text-sm">
              {t('Collective subdomain')}
            </Label>
            <label className="flex h-8 cursor-text items-center rounded-sm border border-input bg-background px-3 shadow-xs transition-[color,box-shadow] focus-within:shadow-focus">
              <div
                className="flex h-full min-w-0 flex-1 items-center overflow-x-auto whitespace-pre text-sm [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' }}
              >
                <span className="relative flex-none">
                  <span aria-hidden className="invisible whitespace-pre">
                    {collectiveSubdomain || ' '}
                  </span>
                  <input
                    value={collectiveSubdomain}
                    onChange={(e) =>
                      setCollectiveSubdomain(normalizeSubdomain(e.target.value))
                    }
                    disabled={loading}
                    maxLength={SUBDOMAIN_MAX}
                    autoComplete="off"
                    className="absolute inset-0 h-full w-full border-0 bg-transparent p-0 text-foreground shadow-none outline-none disabled:opacity-50"
                  />
                </span>
                <span className="flex-none text-accent-foreground/70">
                  .next.erxes.io
                </span>
              </div>
              {validFormat && (
                <div className="ml-2 flex flex-none items-center">
                  {checkingSubdomain ? (
                    <Spinner size="sm" containerClassName="size-4 flex-none" />
                  ) : subdomainAvailable === true ? (
                    <IconCheck className="size-4 flex-none text-success" />
                  ) : subdomainAvailable === false ? (
                    <IconX className="size-4 flex-none text-destructive" />
                  ) : null}
                </div>
              )}
            </label>
            {hasInput && !validFormat ? (
              <Label className="text-warning">
                {t('Use {{min}}-{{max}} lowercase letters, numbers, or dashes.', {
                  min: SUBDOMAIN_MIN,
                  max: SUBDOMAIN_MAX,
                })}
              </Label>
            ) : subdomainAvailable === false ? (
              <div className="flex justify-between flex-wrap items-center gap-2 text-xs">
                <Label className="text-destructive">{t('This subdomain is already taken.')}</Label>
                {!!suggestion && (
                  <Badge
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() =>
                      setCollectiveSubdomain(normalizeSubdomain(suggestion))
                    }
                  >
                    {suggestion}
                  </Badge>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col flex-1 gap-2 min-h-0">
            <Label className="font-medium text-sm">
              {t('Suppliers')}
            </Label>
            <SupplierChooser
              selectedIds={supplierIds}
              onToggle={toggleSupplier}
              disabled={loading}
            />
          </div>
        </Sheet.Content>

        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary">{t('Cancel')}</Button>
          </Sheet.Close>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {loading && <Spinner />}
            {t('Create')}
          </Button>
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};
