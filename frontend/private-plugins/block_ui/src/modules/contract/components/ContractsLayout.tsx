import { IconContract } from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { ContractAddSheet } from './ContractAdd';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';

const ContractDetailSheet = lazy(() =>
  import('./ContractDetailSheet').then((m) => ({
    default: m.ContractDetailSheet,
  })),
);

const ContractDetailSheetMount = () => {
  const activeContractId = useAtomValue(contractDetailSheetState);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (activeContractId) setHasOpened(true);
  }, [activeContractId]);

  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <ContractDetailSheet />
    </Suspense>
  );
};

export const ContractsLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <PageContainer>
      <ContractsHeader />
      {children}
      <ContractDetailSheetMount />
    </PageContainer>
  );
};

export const ContractsHeader = () => {
  return (
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to="/block/contracts">
                  <IconContract />
                  Contracts
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
      </PageHeader.Start>
      <PageHeader.End>
        <ContractAddSheet />
      </PageHeader.End>
    </PageHeader>
  );
};
