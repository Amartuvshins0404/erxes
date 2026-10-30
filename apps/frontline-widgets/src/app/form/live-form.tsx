import { useEffect, useState } from 'react';
import { useWidgetConnect } from './hooks/useWidgetConnect';
import { Dialog, Skeleton } from 'erxes-ui';
import { applyPrimaryColor } from '@libs/tw-utils';
import { ErxesFormProvider } from './context/erxesFormContext';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  activeStepAtom,
  browserInfoAtom,
  calloutPassedAtom,
  customerIdAtom,
  showConfirmationAtom,
} from './states/erxesFormStates';
import { ErxesFormValues } from './components/ErxesFormValues';
import { ErxesFormFinal } from './components/ErxesFormFinal';
import { ErxesFormCallout } from './components/ErxesFormCallout';
import { isCalloutVisible } from './utils/formUtils';
import { useParams } from 'react-router-dom';
import { getVisitorId } from '@libs/utils';

export const LiveForm = () => {
  const { id: channelId, formId } = useParams<{ id: string; formId: string }>();
  const { connectMutation, form, loading } = useWidgetConnect();
  const [settingAppearance, setSettingAppearance] = useState(true);
  const activeStep = useAtomValue(activeStepAtom);
  const setBrowserInfo = useSetAtom(browserInfoAtom);
  const showConfirmation = useAtomValue(showConfirmationAtom);
  const calloutPassed = useAtomValue(calloutPassedAtom);
  const customerId = useAtomValue(customerIdAtom);

  useEffect(() => {
    setBrowserInfo({
      userAgent: navigator.userAgent,
      url: window.location.href,
      language: navigator.language,
    });
  }, []);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (formId && channelId) {
      const connect = async () => {
        const cachedCustomerId = customerId || (await getVisitorId());
        connectMutation({
          variables: {
            channelId,
            formCode: formId,
            cachedCustomerId,
          },
        });
      };
      connect();
    }
  }, [connectMutation, formId, channelId, customerId]);

  useEffect(() => {
    applyPrimaryColor(form?.leadData?.primaryColor);
    setTimeout(() => setSettingAppearance(false));
  }, [form?.leadData?.primaryColor]);

  const { steps } = form?.leadData || {};

  const stepsArray = Object.values(steps || {});

  if (loading || settingAppearance) {
    return <Skeleton className="h-full" />;
  }

  if (!form) {
    return null;
  }

  const showCallout = isCalloutVisible(form.callout) && !calloutPassed;

  const formContent = (
    <ErxesFormProvider form={form}>
      {showConfirmation ? (
        <ErxesFormFinal />
      ) : showCallout ? (
        <ErxesFormCallout />
      ) : (
        stepsArray.length > 0 &&
        stepsArray
          .filter((step) => activeStep === step.order)
          .map((step) => (
            <ErxesFormValues
              key={step.name}
              step={step}
              stepsLength={stepsArray.length}
              isLastStep={
                step.order ===
                stepsArray.reduce(
                  (acc, curr) => (curr.order > acc ? curr.order : acc),
                  0,
                )
              }
            />
          ))
      )}
    </ErxesFormProvider>
  );

  return (
    <Dialog open>
      <Dialog.Content className="p-0 gap-0 max-w-xl shadow-none border-none bg-transparent">
        {formContent}
      </Dialog.Content>
    </Dialog>
  );
};
