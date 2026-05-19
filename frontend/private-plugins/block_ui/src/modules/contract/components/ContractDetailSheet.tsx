import {
  Button,
  FocusSheet,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { useAtom } from 'jotai';
import { lazy, Suspense } from 'react';
import { useContract } from '@/contract/hooks/useContracts';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';
import { ContractEditSheet } from './ContractEditSheet';
import { RelationWidgetSideTabs } from 'ui-modules';
import { ContractPartyType } from '@/contract/types/contractTypes';

const ContractOverviewBody = lazy(() =>
  import('./contract-detail/ContractOverviewBody').then((m) => ({
    default: m.ContractOverviewBody,
  })),
);

const ContractPaymentPlanBody = lazy(() =>
  import('./contract-detail/ContractPaymentPlanBody').then((m) => ({
    default: m.ContractPaymentPlanBody,
  })),
);

const ContractPaymentRecordsBody = lazy(() =>
  import('./contract-detail/ContractPaymentRecordsBody').then((m) => ({
    default: m.ContractPaymentRecordsBody,
  })),
);

const ContractActivityLog = lazy(() =>
  import('./ContractActivityLog').then((m) => ({
    default: m.ContractActivityLog,
  })),
);

const CONTRACT_TABS = {
  OVERVIEW: 'overview',
  PAYMENT_PLAN: 'payment-plan',
  PAYMENT_RECORDS: 'payment-records',
  ACTIVITY_LOG: 'activity-log',
} as const;
type ContractTab = (typeof CONTRACT_TABS)[keyof typeof CONTRACT_TABS];

export const ContractDetailSheet = () => {
  const [activeContractId, setActiveContractId] = useAtom(
    contractDetailSheetState,
  );
  const [activeTab, setActiveTab] = useQueryState<ContractTab>(
    'contract_tab',
    {
      defaultValue: CONTRACT_TABS.OVERVIEW,
    },
  );

  const { contract, loading } = useContract(activeContractId || undefined);

  return (
    <FocusSheet
      open={!!activeContractId}
      onOpenChange={(open) => !open && setActiveContractId(null)}
    >
      <FocusSheet.View className="sm:w-full sm:max-w-7xl">
        <FocusSheet.Header title="Contract Detail" />
        <FocusSheet.Content className="flex flex-auto overflow-hidden">
          <FocusSheet.SideBar>
            <Sidebar collapsible="none" className="flex-none border-r w-64">
              <Sidebar.Group>
                <Sidebar.GroupContent>
                  <Sidebar.Menu>
                    {Object.values(CONTRACT_TABS).map((tab) => (
                      <Sidebar.MenuItem key={tab}>
                        <Sidebar.MenuButton
                          onClick={() => setActiveTab(tab)}
                          isActive={activeTab === tab}
                        >
                          {tab.charAt(0).toUpperCase() +
                            tab.slice(1).replace('-', ' ')}
                        </Sidebar.MenuButton>
                      </Sidebar.MenuItem>
                    ))}
                  </Sidebar.Menu>
                </Sidebar.GroupContent>
              </Sidebar.Group>
            </Sidebar>
          </FocusSheet.SideBar>

          <Suspense fallback={<Spinner containerClassName="flex-auto" />}>
            {(!activeTab || activeTab === CONTRACT_TABS.OVERVIEW) && (
              <ScrollArea className="flex-auto h-full">
                <div className="p-4">
                  {loading ? (
                    <Spinner />
                  ) : !contract ? (
                    <div className="text-muted-foreground">
                      Contract not found
                    </div>
                  ) : (
                    <ContractOverviewBody contract={contract} />
                  )}
                </div>
              </ScrollArea>
            )}
            {activeTab === CONTRACT_TABS.PAYMENT_PLAN && (
              <ScrollArea className="flex-auto h-full">
                <div className="p-4">
                  {loading ? (
                    <Spinner />
                  ) : !contract ? (
                    <div className="text-muted-foreground">
                      Contract not found
                    </div>
                  ) : (
                    <ContractPaymentPlanBody contract={contract} />
                  )}
                </div>
              </ScrollArea>
            )}
            {activeTab === CONTRACT_TABS.PAYMENT_RECORDS && (
              <div className="flex-auto h-full overflow-hidden">
                {loading ? (
                  <Spinner />
                ) : !contract ? (
                  <div className="text-muted-foreground p-4">
                    Contract not found
                  </div>
                ) : (
                  <ContractPaymentRecordsBody contract={contract} />
                )}
              </div>
            )}
            {activeTab === CONTRACT_TABS.ACTIVITY_LOG && activeContractId && (
              <ScrollArea className="flex-auto h-full">
                <ContractActivityLog contractId={activeContractId} />
              </ScrollArea>
            )}
          </Suspense>

          <RelationWidgetSideTabs
            contentId={activeContractId || ''}
            contentType="block:contract"
            customerId={
              contract?.party?.type === ContractPartyType.CUSTOMER
                ? contract.party.id
                : undefined
            }
            hookOptions={{
              hiddenPlugins: ['sales', 'operation'],
              hiddenModules: ['contract', 'company', 'ticket'],
            }}
          />
        </FocusSheet.Content>
        <Sheet.Footer className="flex-none">
          {activeContractId && <ContractEditSheet />}
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Close
            </Button>
          </Sheet.Close>
        </Sheet.Footer>
      </FocusSheet.View>
    </FocusSheet>
  );
};
