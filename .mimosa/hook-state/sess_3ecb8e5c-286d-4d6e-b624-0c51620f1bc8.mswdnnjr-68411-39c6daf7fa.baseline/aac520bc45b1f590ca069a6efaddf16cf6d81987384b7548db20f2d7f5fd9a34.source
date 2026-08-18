import { useMutation } from '@apollo/client';
import {
  ONE_FIT_CUSTOMER_UPDATE_MEMBERSHIP,
  ONE_FIT_CUSTOMER_UPDATE_CREDIT_BALANCE,
  ONE_FIT_CUSTOMER_UPDATE_BOOKING_PREFERENCES,
} from '../graphql/onefitCustomerMutations';
import { ONE_FIT_CUSTOMERS } from '../graphql/onefitCustomerQueries';
import { OneFitBookingPreferences } from '../types/onefitCustomer';

export const useOneFitCustomerMutations = () => {
  const [updateMembership, { loading: updatingMembership }] = useMutation(
    ONE_FIT_CUSTOMER_UPDATE_MEMBERSHIP,
    {
      refetchQueries: [{ query: ONE_FIT_CUSTOMERS }],
    },
  );

  const [updateCreditBalance, { loading: updatingCreditBalance }] = useMutation(
    ONE_FIT_CUSTOMER_UPDATE_CREDIT_BALANCE,
    {
      refetchQueries: [{ query: ONE_FIT_CUSTOMERS }],
    },
  );

  const [updateBookingPreferences, { loading: updatingPreferences }] =
    useMutation(ONE_FIT_CUSTOMER_UPDATE_BOOKING_PREFERENCES, {
      refetchQueries: [{ query: ONE_FIT_CUSTOMERS }],
    });

  const handleUpdateMembership = async (
    customerId: string,
    membershipPlanId: string,
    expiresAt: Date,
  ) => {
    await updateMembership({
      variables: {
        _id: customerId,
        membershipPlanId,
        expiresAt,
      },
    });
  };

  const handleUpdateCreditBalance = async (
    customerId: string,
    balance: number,
  ) => {
    await updateCreditBalance({
      variables: {
        _id: customerId,
        balance,
      },
    });
  };

  const handleUpdateBookingPreferences = async (
    customerId: string,
    preferences: OneFitBookingPreferences,
  ) => {
    await updateBookingPreferences({
      variables: {
        _id: customerId,
        preferences,
      },
    });
  };

  return {
    handleUpdateMembership,
    handleUpdateCreditBalance,
    handleUpdateBookingPreferences,
    updatingMembership,
    updatingCreditBalance,
    updatingPreferences,
  };
};

