import { useAtom } from 'jotai';
import { editListingAtom } from '../states/listing';
import { Button, Form, Sheet, Spinner, toast } from 'erxes-ui';
import { useListingForm } from '../hooks/useListingForm';
import { useUpdateListing } from '../hooks/useUpdateListing';
import { useGetListingDetail } from '../hooks/useGetListingDetail';
import { useCallback, useEffect } from 'react';
import { IListing } from '../types/listing';
import { ListingLocation } from './ListingLocation';
import { ListingPricing } from './ListingPricing';
import { ListingSpecs } from './ListingSpecs';
import { ListingMainInfo } from './ListinMainInfo';
import { ListingMediaAttachments } from './ListingMediaAttachments';
import { ListingMemberSection } from './ListingMemberSection';

export const EditListingSheet = () => {
  const [editListing, setEditListing] = useAtom(editListingAtom);
  const open = !!editListing;

  const { listing, loading: detailLoading } = useGetListingDetail(
    editListing?._id,
  );

  const { form } = useListingForm();
  const { handleSubmit, reset } = form;
  const { updateListing, loading: saving } = useUpdateListing();

  useEffect(() => {
    if (listing) {
      reset(listing as unknown as Partial<IListing>);
    }
  }, [listing, reset]);

  const onSubmit = useCallback(
    async (data: IListing) => {
      if (!editListing?._id) return;
      try {
        await updateListing({
          variables: { _id: editListing._id, input: data },
        });
        toast({ variant: 'success', title: 'Listing updated successfully' });
        setEditListing(null);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to update listing',
          description: error.message,
        });
      }
    },
    [updateListing, editListing, setEditListing],
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && setEditListing(null)}>
      <Form {...form}>
        <Sheet.View className="sm:max-w-7xl">
          <form onSubmit={handleSubmit(onSubmit)} className="contents">
            <Sheet.Header>
              <Sheet.Title>Edit Listing</Sheet.Title>
              <Sheet.Description className="sr-only">
                Үл хөдлөхийн мэдээллийг засварлана уу.
              </Sheet.Description>
            </Sheet.Header>
            <Sheet.Content className="p-3 px-6 flex-1 overflow-y-auto">
              {detailLoading ? (
                <Spinner containerClassName="py-32" />
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  <ListingMainInfo form={form} />
                  <ListingLocation form={form} />
                  <ListingPricing form={form} />
                  <ListingSpecs form={form} />
                  <ListingMediaAttachments form={form} />
                  <ListingMemberSection form={form} />
                </div>
              )}
            </Sheet.Content>
            <Sheet.Footer>
              <Button
                type="button"
                onClick={() => setEditListing(null)}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={detailLoading || saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Sheet.Footer>
          </form>
        </Sheet.View>
      </Form>
    </Sheet>
  );
};
