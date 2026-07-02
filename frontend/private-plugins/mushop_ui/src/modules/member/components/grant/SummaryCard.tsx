import { InfoCard } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { GrantSheetState } from '../../hooks/useGrantSheetState';
import {
  daysBetween,
  formatDate,
  formatMoney,
} from '../../utils/grantHelpers';
import { CustomerName } from './CustomerName';
import { Row } from './Row';
import { Timeline } from './Timeline';

export const SummaryCard = ({
  customerId,
  activeSub,
  selectedPlan,
  isExtending,
  isSamePlan,
  previewEndDate,
}: Pick<
  GrantSheetState,
  | 'customerId'
  | 'activeSub'
  | 'selectedPlan'
  | 'isExtending'
  | 'isSamePlan'
  | 'previewEndDate'
>) => {
  const { t } = useTranslation('mushop');
  const showCurrent = isExtending && !selectedPlan && activeSub;
  const showSummary = !isExtending || selectedPlan;

  return (
    <InfoCard title={showCurrent ? t('Current membership') : t('Summary')}>
      <InfoCard.Content>
        <div className="flex flex-col text-sm">
          {showCurrent && activeSub && (
            <>
              <Row label={t('Customer')}>
                {customerId ? (
                  <CustomerName customerId={customerId} />
                ) : (
                  '—'
                )}
              </Row>
              <Row label={t('Plan')}>
                {activeSub.plan
                  ? `${activeSub.plan.name} · ${
                      activeSub.plan.durationMonths ?? '-'
                    } ${t('mo')}`
                  : '—'}
              </Row>
              <Row label={t('Period')}>
                {formatDate(activeSub.startDate)} →{' '}
                {formatDate(activeSub.endDate)}
              </Row>
              <Row label={t('Time left')}>
                {(() => {
                  if (!activeSub.endDate) return '—';
                  const d = daysBetween(
                    new Date(),
                    new Date(activeSub.endDate),
                  );
                  return d <= 0
                    ? t('Expires today')
                    : t('{{count}} days', { count: d });
                })()}
              </Row>
              <Row label={t('Last paid')}>
                {formatMoney(activeSub.amount, activeSub.currency)}
              </Row>
            </>
          )}

          {showSummary && (
            <>
              <Row label={t('Plan')}>
                {selectedPlan ? (
                  <span className="text-primary">
                    {selectedPlan.name}
                    {isExtending && !isSamePlan && (
                      <span className="ml-2 text-[10px] text-emerald-700 uppercase tracking-wide">
                        {t('(change)')}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {t('Select a plan')}
                  </span>
                )}
              </Row>
              <Row label={t('Duration')}>
                {selectedPlan?.durationMonths
                  ? t('+ {{count}} months', {
                      count: selectedPlan.durationMonths,
                    })
                  : '—'}
              </Row>
              {isExtending && activeSub?.endDate && (
                <Row label={t('Current end')}>
                  <span className="text-muted-foreground line-through">
                    {formatDate(activeSub.endDate)}
                  </span>
                </Row>
              )}
              <Row label={t('New end')}>
                {previewEndDate ? (
                  <span className="text-primary">
                    {formatDate(previewEndDate.toISOString())}
                  </span>
                ) : (
                  '—'
                )}
              </Row>
            </>
          )}
        </div>

        {showCurrent && activeSub?.startDate && activeSub.endDate && (
          <Timeline
            start={new Date(activeSub.startDate)}
            end={new Date(activeSub.endDate)}
          />
        )}

        {showSummary && selectedPlan && previewEndDate && (
          <Timeline
            start={
              isExtending && activeSub?.startDate
                ? new Date(activeSub.startDate)
                : new Date()
            }
            end={previewEndDate}
          />
        )}
      </InfoCard.Content>
    </InfoCard>
  );
};
