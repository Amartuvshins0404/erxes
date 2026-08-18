import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Badge,
  Breadcrumb,
  Button,
  Form,
  PageContainer,
  ScrollArea,
  Separator,
  Sidebar,
  Spinner,
  toast,
  useToast,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import {
  IconCheck,
  IconCloudUpload,
  IconHomeSearch,
} from '@tabler/icons-react';
import { IListing } from '~/modules/listing/types/listing';
import { useListingForm } from '~/modules/listing/hooks/useListingForm';
import { useUpdateListing } from '~/modules/listing/hooks/useUpdateListing';
import { useGetListingDetail } from '~/modules/listing/hooks/useGetListingDetail';
import { useAutoSave } from '~/modules/listing/hooks/useAutoSave';
import { ListingMainInfo } from '~/modules/listing/components/ListinMainInfo';
import { ListingLocation } from '~/modules/listing/components/ListingLocation';
import { ListingPricing } from '~/modules/listing/components/ListingPricing';
import { ListingSpecs } from '~/modules/listing/components/ListingSpecs';
import { ListingMediaAttachments } from '~/modules/listing/components/ListingMediaAttachments';
import { ListingMemberSection } from '~/modules/listing/components/ListingMemberSection';
import { useState } from 'react';

const TABS = [
  { key: 'info', label: 'Basic Info' },
  { key: 'location', label: 'Location' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'specs', label: 'Specifications' },
  { key: 'media', label: 'Media' },
  { key: 'agent', label: 'Agent' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'info' | 'secondary'
> = {
  active: 'success',
  inactive: 'warning',
  sold: 'info',
  draft: 'secondary',
};

export const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const { listing, loading: detailLoading } = useGetListingDetail(id);
  const { form } = useListingForm();
  const { reset } = form;
  const { updateListing } = useUpdateListing();

  const resetListingIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (listing && resetListingIdRef.current !== listing._id) {
      reset(listing as unknown as Partial<IListing>);
      resetListingIdRef.current = listing._id;
    }
  }, [listing, reset]);

  const onSave = useCallback(
    async (data: IListing) => {
      if (!id) return;
      await updateListing({ variables: { _id: id, input: data } });
    },
    [updateListing, id],
  );

  const { status: saveStatus } = useAutoSave({ form, onSave });
  console.log('saveStatus', saveStatus);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" onClick={() => navigate('../listing')}>
                  <IconHomeSearch />
                  Listing
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>
                  {detailLoading ? '...' : listing?.title || 'Listing'}
                </Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      {detailLoading ? (
        <Spinner containerClassName="py-32" />
      ) : (
        <>
          {/* Profile strip */}
          <div className="flex items-center gap-3 border-b px-8 py-4">
            <h1 className="text-lg font-semibold">{listing?.title}</h1>
            {listing?.status && (
              <Badge variant={STATUS_VARIANT[listing.status] ?? 'secondary'}>
                {listing.status}
              </Badge>
            )}
            {listing?.type && (
              <Badge variant="ghost" className="capitalize">
                {listing.type}
              </Badge>
            )}
            <SaveStatusIndicator status={saveStatus} />
          </div>

          <Form {...form}>
            <div className="flex flex-auto overflow-hidden">
              {/* Sidebar */}
              <Sidebar
                collapsible="none"
                className="border-r flex-none [--sidebar-width:200px]"
              >
                <Sidebar.Group>
                  <Sidebar.GroupContent>
                    <Sidebar.GroupLabel>LISTING</Sidebar.GroupLabel>
                    <Sidebar.Menu>
                      {TABS.map((tab) => (
                        <Sidebar.MenuItem key={tab.key}>
                          <Sidebar.MenuButton
                            isActive={tab.key === activeTab}
                            onClick={() => setActiveTab(tab.key)}
                            className="capitalize"
                          >
                            {tab.label}
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
                  {activeTab === 'info' && <ListingMainInfo form={form} />}
                  {activeTab === 'location' && <ListingLocation form={form} />}
                  {activeTab === 'pricing' && <ListingPricing form={form} />}
                  {activeTab === 'specs' && <ListingSpecs form={form} />}
                  {activeTab === 'media' && (
                    <ListingMediaAttachments form={form} />
                  )}
                  {activeTab === 'agent' && (
                    <ListingMemberSection form={form} />
                  )}
                </div>
                <ScrollArea.Bar orientation="horizontal" />
              </ScrollArea>
            </div>
          </Form>
        </>
      )}
    </PageContainer>
  );
};

const SaveStatusIndicator = ({
  status,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
}) => {
  if (status === 'idle') return null;

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Spinner className="size-3.5" />
        Saving…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <IconCheck size={14} className="text-success" />
        Saved
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-destructive">
        <IconCloudUpload size={14} />
        Save failed
      </span>
    );
  }

  return null;
};
