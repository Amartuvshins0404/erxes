import { useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { MUSHOP_MEMBERSHIP_PLANS } from '../../membership-plan/graphql/queries';
import { PAYMENTS } from '../graphql/payments';
import { MUSHOP_MEMBERSHIPS } from '../graphql/queries';
import { IPaymentMethod, IMember, IMembershipPlan } from '../types';
import { addMonths } from '../utils/grantHelpers';
import { useGrantMembership } from './useGrantMembership';

export const useGrantSheetState = (open: boolean) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  const { data: plansData, loading: plansLoading } = useQuery(
    MUSHOP_MEMBERSHIP_PLANS,
    {
      variables: { isActive: true },
      skip: !open,
    },
  );

  const { data: subData } = useQuery(MUSHOP_MEMBERSHIPS, {
    variables: { searchValue: customerId, status: 'active' },
    skip: !open || !customerId,
    fetchPolicy: 'network-only',
  });

  const { data: paymentsData, loading: paymentsLoading } = useQuery(PAYMENTS, {
    variables: { status: 'active' },
    skip: !open,
  });

  const plans: IMembershipPlan[] = plansData?.mushopMembershipPlans?.list || [];

  const paymentMethods: IPaymentMethod[] = useMemo(
    () => paymentsData?.payments || [],
    [paymentsData],
  );

  const selectedPlan = plans.find((p) => p._id === planId);

  const selectedPayment = paymentMethods.find((p) => p._id === paymentMethod);
  const isKhanbank = selectedPayment?.kind === 'khanbank';

  const activeSub: IMember | undefined = (
    subData?.mushopMemberships?.list as IMember[] | undefined
  )?.find(
    (s) =>
      s.customerId === customerId &&
      s.status === 'active' &&
      (!s.endDate || new Date(s.endDate).getTime() > Date.now()),
  );

  const isExtending = Boolean(activeSub);

  const isSamePlan =
    isExtending && selectedPlan && activeSub?.plan?._id === selectedPlan._id;

  const previewEndDate: Date | null = (() => {
    if (!selectedPlan?.durationMonths) return null;
    const now = new Date();
    const base =
      activeSub?.endDate && new Date(activeSub.endDate) > now
        ? new Date(activeSub.endDate)
        : now;
    return addMonths(base, selectedPlan.durationMonths);
  })();

  const showPreview = isExtending || Boolean(selectedPlan);

  // Autofill amount from plan
  useEffect(() => {
    if (selectedPlan) setAmount(String(selectedPlan.price));
  }, [selectedPlan]);

  // Default payment method to Khanbank if available, else first
  useEffect(() => {
    if (!paymentMethod && paymentMethods.length > 0) {
      const khanbank = paymentMethods.find((p) => p.kind === 'khanbank');
      setPaymentMethod((khanbank || paymentMethods[0])._id);
    }
  }, [paymentMethods, paymentMethod]);

  const reset = () => {
    setCustomerId('');
    setPlanId('');
    setPaymentMethod('');
    setAmount('');
  };

  const { handleGrant, loading: granting } = useGrantMembership();

  const submit = async () => {
    if (!customerId || !planId) return;
    const numericAmount = amount === '' ? undefined : Number(amount);
    await handleGrant(
      customerId,
      planId,
      paymentMethod || undefined,
      Number.isFinite(numericAmount as number) ? numericAmount : undefined,
    );
  };

  return {
    // form state
    customerId,
    setCustomerId,
    planId,
    setPlanId,
    paymentMethod,
    setPaymentMethod,
    amount,
    setAmount,

    // data
    plans,
    plansLoading,
    paymentMethods,
    paymentsLoading,
    activeSub,

    // derived
    selectedPlan,
    selectedPayment,
    isKhanbank,
    isExtending,
    isSamePlan,
    previewEndDate,
    showPreview,

    // actions
    reset,
    submit,
    granting,
  };
};

export type GrantSheetState = ReturnType<typeof useGrantSheetState>;
