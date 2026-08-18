import { Badge, Button, ScrollArea, Separator, Spinner, useQueryState } from 'erxes-ui';
import { IconCaretDownFilled, IconFileDescription } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMemberDetail } from '@/member/hooks/useMemberDetail';
import { MembershipPlanDetailSheet } from '@/membership-plan/components/MembershipPlanDetailSheet';
import { IMembershipPlan } from '@/member/types';

const PlanCard = ({ plan }: { plan: IMembershipPlan }) => {
  const { t } = useTranslation('mushop');
  const [, setActivePlanId] = useQueryState<string>('activePlanId');

  return (
    <div className="bg-background rounded-lg shadow-xs">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <IconFileDescription className="size-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{plan.name}</span>
          </div>
          <Badge variant={plan.isActive ? 'success' : 'secondary'} className="shrink-0">
            {plan.isActive ? t('Active') : t('Inactive')}
          </Badge>
        </div>

        {plan.description && (
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        )}

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-accent-foreground">{t('Price')}</span>
            <span className="text-foreground font-medium">
              {plan.price.toLocaleString()} {plan.currency}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-accent-foreground">{t('Duration')}</span>
            <span className="text-foreground">
              {t('{{count}} months', { count: plan.durationMonths })}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="py-1 px-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-accent-foreground"
          onClick={() => setActivePlanId(plan._id)}
        >
          {t('View details')}
          <IconCaretDownFilled />
        </Button>
      </div>
    </div>
  );
};

export const MembershipPlanWidget = ({ contentId }: { contentId: string }) => {
  const { t } = useTranslation('mushop');
  const { member, loading } = useMemberDetail(contentId);

  const plan = member?.plan;

  if (loading) {
    return <Spinner containerClassName="py-6 bg-background rounded-lg shadow-xs" />;
  }

  return (
    <>
      <ScrollArea className="flex-auto">
        <div className="p-4">
          {plan ? (
            <PlanCard plan={plan} />
          ) : (
            <div className="flex flex-col gap-2 items-center justify-center py-10">
              <IconFileDescription className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('No plan linked')}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <MembershipPlanDetailSheet />
    </>
  );
};
