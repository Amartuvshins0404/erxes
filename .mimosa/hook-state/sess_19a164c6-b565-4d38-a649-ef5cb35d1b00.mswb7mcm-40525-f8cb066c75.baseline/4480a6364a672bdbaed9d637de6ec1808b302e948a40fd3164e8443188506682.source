import { IconArrowLeft } from '@tabler/icons-react';
import { Button, Spinner } from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { OneFitPageLayout } from '~/components/OneFitPageLayout';
import { OneFitCustomerDetailContent } from '~/modules/onefitCustomer/components/OneFitCustomerDetailContent';
import { useOneFitCustomerDetail } from '~/modules/onefitCustomer/hooks/useOneFitCustomerDetail';
import { UpdateMembershipDialog } from '~/modules/onefitCustomer/components/UpdateMembershipDialog';
import { UpdateCreditBalanceDialog } from '~/modules/onefitCustomer/components/UpdateCreditBalanceDialog';
import { UpdateBookingPreferencesDialog } from '~/modules/onefitCustomer/components/UpdateBookingPreferencesDialog';
import { CreateMembershipPurchaseDialog } from '~/modules/membership-purchase/components/CreateMembershipPurchaseDialog';
import { useState } from 'react';

function getCustomerDisplayName(
  customer:
    | {
        firstName?: string;
        lastName?: string;
        primaryEmail?: string;
        primaryPhone?: string;
      }
    | null
    | undefined,
) {
  if (!customer) return 'Customer';
  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (name) return name;
  return customer.primaryEmail || customer.primaryPhone || 'Customer';
}

export function OneFitCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { oneFitCustomer, loading, refetch } = useOneFitCustomerDetail({
    variables: { _id: id ?? '' },
    skip: !id,
  });
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  const notFound = !loading && id && !oneFitCustomer;
  const displayName = getCustomerDisplayName(oneFitCustomer);

  if (notFound) {
    return (
      <OneFitPageLayout pageName="Customer">
        <div className="p-6 flex flex-col gap-4">
          <p className="text-muted-foreground">Customer not found.</p>
          <Button asChild variant="outline">
            <Link to="/onefit/customers">
              <IconArrowLeft />
              Back to customers
            </Link>
          </Button>
        </div>
      </OneFitPageLayout>
    );
  }

  return (
    <OneFitPageLayout
      pageName={displayName}
      headerActions={
        id ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMembershipDialogOpen(true)}
            >
              Update membership
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreditDialogOpen(true)}
            >
              Update credit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreferencesDialogOpen(true)}
            >
              Update preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurchaseDialogOpen(true)}
            >
              Purchase membership
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex w-full min-w-0 flex-col gap-4 p-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to="/onefit/customers">
            <IconArrowLeft />
            Back to customers
          </Link>
        </Button>
        {loading && !oneFitCustomer ? (
          <Spinner containerClassName="py-20" />
        ) : id ? (
          <OneFitCustomerDetailContent
            customerId={id}
            oneFitCustomer={oneFitCustomer}
            loading={loading}
            refetch={refetch}
          />
        ) : (
          <Spinner containerClassName="py-20" />
        )}
      </div>
      {id && (
        <>
          <UpdateMembershipDialog
            customerId={id}
            open={membershipDialogOpen}
            onOpenChange={setMembershipDialogOpen}
          />
          <UpdateCreditBalanceDialog
            customerId={id}
            open={creditDialogOpen}
            onOpenChange={setCreditDialogOpen}
          />
          <UpdateBookingPreferencesDialog
            customerId={id}
            open={preferencesDialogOpen}
            onOpenChange={setPreferencesDialogOpen}
          />
          <CreateMembershipPurchaseDialog
            defaultUserId={id}
            open={purchaseDialogOpen}
            onOpenChange={setPurchaseDialogOpen}
          />
        </>
      )}
    </OneFitPageLayout>
  );
}
