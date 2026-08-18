import { useAtom } from 'jotai';
import { createListingSheetAtom } from '../states/listing';
import { Button, Form, Sheet, Spinner, cn, toast } from 'erxes-ui';
import { useListingForm } from '../hooks/useListingForm';
import { useCreateListing } from '../hooks/useCreateListing';
import { useCallback, useState } from 'react';
import { IListing } from '../types/listing';
import { ListingLocation } from './ListingLocation';
import { ListingPricing } from './ListingPricing';
import { ListingSpecs } from './ListingSpecs';
import { ListingMainInfo } from './ListinMainInfo';
import { ListingMediaAttachments } from './ListingMediaAttachments';
import { ListingMemberSection } from './ListingMemberSection';
import {
  IconInfoCircle,
  IconMapPin,
  IconCurrencyDollar,
  IconRuler,
  IconPhoto,
  IconUser,
  IconCheck,
} from '@tabler/icons-react';

const STEPS = [
  { key: 'info', label: 'Basic Info', icon: IconInfoCircle },
  { key: 'location', label: 'Location', icon: IconMapPin },
  { key: 'pricing', label: 'Pricing', icon: IconCurrencyDollar },
  { key: 'specs', label: 'Specifications', icon: IconRuler },
  { key: 'media', label: 'Media', icon: IconPhoto },
  { key: 'agent', label: 'Agent', icon: IconUser },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export const CreateListingSheet = () => {
  const [open, setOpen] = useAtom(createListingSheetAtom);
  const [activeStep, setActiveStep] = useState<StepKey>('info');
  const { form } = useListingForm();
  const { handleSubmit, reset } = form;
  const { createListing, loading } = useCreateListing();

  const currentIndex = STEPS.findIndex((s) => s.key === activeStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  const handleClose = () => {
    setOpen(false);
    setActiveStep('info');
    reset();
  };

  const onSubmit = useCallback(
    async (data: IListing) => {
      try {
        await createListing({ variables: { input: data } });
        toast({ variant: 'success', title: 'Listing created successfully' });
        handleClose();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to create listing',
          description: error.message,
        });
      }
    },
    [createListing],
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <Form {...form}>
        <Sheet.View className="sm:max-w-5xl">
          <form onSubmit={handleSubmit(onSubmit)} className="contents">
            <Sheet.Header>
              <Sheet.Title>Create Listing</Sheet.Title>
              <Sheet.Description className="sr-only">
                Үл хөдлөхийн мэдээллийг бөглөж, зарыг үүсгэнэ үү.
              </Sheet.Description>
            </Sheet.Header>

            <Sheet.Content className="flex-1 overflow-hidden p-0 flex">
              {/* Step sidebar */}
              <div className="w-44 border-r flex flex-col py-4 gap-1 px-2 shrink-0">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = step.key === activeStep;
                  const isDone = idx < currentIndex;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setActiveStep(step.key)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'size-5 rounded-full flex items-center justify-center text-xs shrink-0 border',
                          isActive
                            ? 'border-primary-foreground/40 text-primary-foreground'
                            : isDone
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30',
                        )}
                      >
                        {isDone ? <IconCheck className="size-3" /> : idx + 1}
                      </span>
                      {step.label}
                    </button>
                  );
                })}
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeStep === 'info' && <ListingMainInfo form={form} />}
                {activeStep === 'location' && <ListingLocation form={form} />}
                {activeStep === 'pricing' && <ListingPricing form={form} />}
                {activeStep === 'specs' && <ListingSpecs form={form} />}
                {activeStep === 'media' && (
                  <ListingMediaAttachments form={form} />
                )}
                {activeStep === 'agent' && <ListingMemberSection form={form} />}
              </div>
            </Sheet.Content>

            <Sheet.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <div className="flex gap-2 ml-auto">
                {!isFirst && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(STEPS[currentIndex - 1].key)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                {!isLast ? (
                  <Button
                    type="button"
                    onClick={() => setActiveStep(STEPS[currentIndex + 1].key)}
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner className="size-4" />
                        Creating...
                      </>
                    ) : (
                      'Create Listing'
                    )}
                  </Button>
                )}
              </div>
            </Sheet.Footer>
          </form>
        </Sheet.View>
      </Form>
    </Sheet>
  );
};
