import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Breadcrumb,
  Button,
  Form,
  PageContainer,
  ScrollArea,
  Separator,
  Sidebar,
  Spinner,
  toast,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { IconHomeSearch } from '@tabler/icons-react';
import { IListing } from '~/modules/listing/types/listing';
import { useListingForm } from '~/modules/listing/hooks/useListingForm';
import { useCreateListing } from '~/modules/listing/hooks/useCreateListing';
import { ListingMainInfo } from '~/modules/listing/components/ListinMainInfo';
import { ListingLocation } from '~/modules/listing/components/ListingLocation';
import { ListingPricing } from '~/modules/listing/components/ListingPricing';
import { ListingSpecs } from '~/modules/listing/components/ListingSpecs';
import { ListingMediaAttachments } from '~/modules/listing/components/ListingMediaAttachments';
import { ListingMemberSection } from '~/modules/listing/components/ListingMemberSection';

const STEPS = [
  { key: 'info', label: 'Basic Info' },
  { key: 'location', label: 'Location' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'specs', label: 'Specifications' },
  { key: 'media', label: 'Media' },
  { key: 'agent', label: 'Agent' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<StepKey>('info');
  const { form } = useListingForm();
  const { handleSubmit } = form;
  const { createListing, loading } = useCreateListing();

  const currentIndex = STEPS.findIndex((s) => s.key === activeStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  const handleCancel = () => navigate(-1);

  const onSubmit = useCallback(
    async (data: IListing) => {
      try {
        await createListing({ variables: { input: data } });
        toast({ variant: 'success', title: 'Listing created successfully' });
        navigate(-1);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to create listing',
          description: error.message,
        });
      }
    },
    [createListing, navigate],
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" onClick={handleCancel}>
                  <IconHomeSearch />
                  Listing
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>Create Listing</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
        </PageHeader.Start>
        <PageHeader.End>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          {!isFirst && (
            <Button
              variant="outline"
              onClick={() => setActiveStep(STEPS[currentIndex - 1].key)}
              disabled={loading}
            >
              Back
            </Button>
          )}
          {!isLast ? (
            <Button
              onClick={() => setActiveStep(STEPS[currentIndex + 1].key)}
              disabled={loading}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="size-4" /> Creating...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          )}
        </PageHeader.End>
      </PageHeader>

      <Form {...form}>
        <div className="flex flex-auto overflow-hidden">
          {/* Sidebar — identical pattern to ProjectDetailSidebar */}
          <Sidebar
            collapsible="none"
            className="border-r flex-none [--sidebar-width:200px]"
          >
            <Sidebar.Group>
              <Sidebar.GroupContent>
                <Sidebar.GroupLabel>NEW LISTING</Sidebar.GroupLabel>
                <Sidebar.Menu>
                  {STEPS.map((step, idx) => (
                    <Sidebar.MenuItem key={step.key}>
                      <Sidebar.MenuButton
                        isActive={step.key === activeStep}
                        onClick={() => setActiveStep(step.key)}
                        className="capitalize"
                      >
                        {idx < currentIndex ? `✓ ${step.label}` : step.label}
                      </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  ))}
                </Sidebar.Menu>
              </Sidebar.GroupContent>
            </Sidebar.Group>
          </Sidebar>

          {/* Content */}
          <ScrollArea className="flex-auto bg-sidebar">
            <div className="p-8 flex flex-col gap-6 max-w-4xl">
              {activeStep === 'info' && <ListingMainInfo form={form} />}
              {activeStep === 'location' && <ListingLocation form={form} />}
              {activeStep === 'pricing' && <ListingPricing form={form} />}
              {activeStep === 'specs' && <ListingSpecs form={form} />}
              {activeStep === 'media' && (
                <ListingMediaAttachments form={form} />
              )}
              {activeStep === 'agent' && <ListingMemberSection form={form} />}
            </div>
            <ScrollArea.Bar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Form>
    </PageContainer>
  );
};
