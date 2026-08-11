import { Badge, Button, Spinner, toast } from 'erxes-ui';
import { IconCloudCheck, IconCloudUpload, IconRefresh } from '@tabler/icons-react';
import { useCustomerSync, useSyncCustomer } from '@/admin/hooks/useCustomerSync';
import { useCustomerContracts } from '@/contract/hooks/useCustomerContracts';
import { useContract } from '@/contract/hooks/useContracts';
import { useManualSyncContract } from '@/contract/hooks/useManualSyncContract';
import { IContract } from '@/contract/types/contractTypes';
import { useCustomerOffers } from '@/offer/hooks/useCustomerOffers';
import { useOffer } from '@/offer/hooks/useOffers';
import { useManualSyncOffer } from '@/offer/hooks/useManualSyncOffer';
import { IOffer } from '@/offer/types/offerTypes';

const ALLOWED_CONTENT_TYPES = ['core:customer', 'block:contract', 'block:offer'];

const ContractSyncRow = ({
  contract,
  access,
}: {
  contract: IContract;
  access: 'read' | 'write';
}) => {
  const { syncContract, loading } = useManualSyncContract();

  const handleSync = () => {
    syncContract({
      variables: { contractId: contract._id },
      onCompleted: () => {
        toast({
          title: 'Contract synced to Block Platform',
          description: 'Contract info, payments and transactions were synced.',
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: 'Sync failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
      <div className="text-sm min-w-0">
        <div className="font-medium truncate">
          {contract.number || contract._id}
        </div>
        <div className="text-muted-foreground text-xs">
          {contract.amount ? `${contract.amount} ${contract.currency || ''}` : ''}
        </div>
      </div>
      {access === 'write' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          disabled={loading}
        >
          {loading ? <Spinner containerClassName="flex-none" /> : <IconRefresh className="size-4" />}
        </Button>
      )}
    </div>
  );
};

const ContractSyncList = ({
  customerId,
  access,
}: {
  customerId: string;
  access: 'read' | 'write';
}) => {
  const { contracts, loading } = useCustomerContracts(customerId);

  return (
    <div className="flex flex-col gap-2 p-4 border-t">
      <span className="font-medium text-primary">Contract Sync</span>
      <span className="text-xs text-muted-foreground">
        Manually sync a signed contract, its payments and transactions to
        Block Platform.
      </span>
      {loading ? (
        <Spinner containerClassName="py-6" />
      ) : contracts.length ? (
        <div className="flex flex-col">
          {contracts.map((contract) => (
            <ContractSyncRow
              key={contract._id}
              contract={contract}
              access={access}
            />
          ))}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground py-2">
          No contracts found for this customer.
        </span>
      )}
    </div>
  );
};

// Used on the contract's own detail page: only the contract being viewed is
// relevant here, so this syncs just that one instead of listing every
// contract for the linked customer.
const SingleContractSync = ({
  contractId,
  access,
}: {
  contractId: string;
  access: 'read' | 'write';
}) => {
  const { contract, loading } = useContract(contractId);

  return (
    <div className="flex flex-col gap-2 p-4 border-t">
      <span className="font-medium text-primary">Contract Sync</span>
      <span className="text-xs text-muted-foreground">
        Manually sync this signed contract, its payments and transactions to
        Block Platform.
      </span>
      {loading ? (
        <Spinner containerClassName="py-6" />
      ) : contract ? (
        <ContractSyncRow contract={contract} access={access} />
      ) : (
        <span className="text-sm text-muted-foreground py-2">
          Contract not found.
        </span>
      )}
    </div>
  );
};

const OfferSyncRow = ({
  offer,
  access,
}: {
  offer: IOffer;
  access: 'read' | 'write';
}) => {
  const { syncOffer, loading } = useManualSyncOffer();

  const handleSync = () => {
    syncOffer({
      variables: { offerId: offer._id },
      onCompleted: () => {
        toast({
          title: 'Offer synced to Block Platform',
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: 'Sync failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
      <div className="text-sm min-w-0">
        <div className="font-medium truncate">
          {offer.number || offer._id}
        </div>
        <div className="text-muted-foreground text-xs">
          {offer.amount ? `${offer.amount} ${offer.currency || ''}` : ''}
        </div>
      </div>
      {access === 'write' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          disabled={loading}
        >
          {loading ? <Spinner containerClassName="flex-none" /> : <IconRefresh className="size-4" />}
        </Button>
      )}
    </div>
  );
};

const OfferSyncList = ({
  customerId,
  access,
}: {
  customerId: string;
  access: 'read' | 'write';
}) => {
  const { offers, loading } = useCustomerOffers(customerId);

  return (
    <div className="flex flex-col gap-2 p-4 border-t">
      <span className="font-medium text-primary">Offer Sync</span>
      <span className="text-xs text-muted-foreground">
        Manually sync a sent offer to Block Platform.
      </span>
      {loading ? (
        <Spinner containerClassName="py-6" />
      ) : offers.length ? (
        <div className="flex flex-col">
          {offers.map((offer) => (
            <OfferSyncRow key={offer._id} offer={offer} access={access} />
          ))}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground py-2">
          No offers found for this customer.
        </span>
      )}
    </div>
  );
};

// Used on the offer's own detail page: only the offer being viewed is
// relevant here, so this syncs just that one instead of listing every
// offer for the linked customer.
const SingleOfferSync = ({
  offerId,
  access,
}: {
  offerId: string;
  access: 'read' | 'write';
}) => {
  const { offer, loading } = useOffer(offerId);

  return (
    <div className="flex flex-col gap-2 p-4 border-t">
      <span className="font-medium text-primary">Offer Sync</span>
      <span className="text-xs text-muted-foreground">
        Manually sync this sent offer to Block Platform.
      </span>
      {loading ? (
        <Spinner containerClassName="py-6" />
      ) : offer ? (
        <OfferSyncRow offer={offer} access={access} />
      ) : (
        <span className="text-sm text-muted-foreground py-2">
          Offer not found.
        </span>
      )}
    </div>
  );
};

export const CustomerSync = ({
  contentId,
  contentType,
  customerId,
  access = 'write',
}: {
  contentId: string;
  contentType: string;
  access?: 'read' | 'write';
  customerId?: string;
}) => {
  const isAllowedContext = ALLOWED_CONTENT_TYPES.includes(contentType);
  const targetCustomerId = isAllowedContext
    ? contentType === 'core:customer'
      ? contentId
      : customerId
    : undefined;

  const { customerSync, loading, refetch } = useCustomerSync(
    targetCustomerId,
  );
  const { syncCustomer, loading: syncing } = useSyncCustomer();

  if (!isAllowedContext) {
    return null;
  }

  if (!targetCustomerId) {
    return (
      <div className="flex flex-col flex-auto justify-center items-center gap-4 text-muted-foreground p-8 text-center">
        <div className="bg-background p-6 border border-dashed rounded-xl">
          <IconCloudUpload />
        </div>
        <span className="text-sm">
          No customer linked to this record yet.
        </span>
      </div>
    );
  }

  if (loading) {
    return <Spinner containerClassName="py-20" />;
  }

  const handleSync = () => {
    syncCustomer({
      variables: { customerId: targetCustomerId },
      onCompleted: () => {
        toast({ title: 'Customer synced to Block Platform', variant: 'success' });
        refetch();
      },
      onError: (error) => {
        toast({
          title: 'Sync failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-primary">Block Platform Sync</span>
          {customerSync ? (
            <Badge variant="secondary" className="gap-1">
              <IconCloudCheck className="size-3.5" />
              Synced
            </Badge>
          ) : (
            <Badge variant="secondary">Not synced</Badge>
          )}
        </div>
        {customerSync && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              Block Platform ID:{' '}
              <span className="font-mono text-foreground">
                {customerSync.blockAdminId}
              </span>
            </div>
            {customerSync.updatedAt && (
              <div>
                Last synced:{' '}
                {new Date(customerSync.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
        {access === 'write' && (
          <Button
            variant="secondary"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing && <Spinner containerClassName="flex-none" />}
            {customerSync ? 'Re-sync now' : 'Sync now'}
          </Button>
        )}
      </div>
      {contentType === 'block:contract' ? (
        <SingleContractSync contractId={contentId} access={access} />
      ) : contentType === 'block:offer' ? (
        <SingleOfferSync offerId={contentId} access={access} />
      ) : (
        <>
          <ContractSyncList customerId={targetCustomerId} access={access} />
          <OfferSyncList customerId={targetCustomerId} access={access} />
        </>
      )}
    </div>
  );
};

export default CustomerSync;
