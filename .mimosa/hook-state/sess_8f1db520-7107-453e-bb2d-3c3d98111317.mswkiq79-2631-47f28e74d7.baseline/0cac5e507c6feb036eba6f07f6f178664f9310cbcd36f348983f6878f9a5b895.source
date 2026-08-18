import { Button, Form, Label, Spinner, Textarea, toast } from 'erxes-ui';
import { useAgentForm } from '../hooks/useAgentForm';
import { SelectArea } from '~/modules/agency/form/SelectArea';
import { useGetMemberProfile } from '../hooks/useGetMemberProfile';
import { useUpdateMemberProfile } from '../hooks/useUpdateMemberProfile';
import React from 'react';
import { SocialLinkInput } from '~/modules/agency/form/SocialLinkInput';
import { UploadAttachments } from '~/modules/agency/form/upload';

export const ProfileForm = () => {
  const { form } = useAgentForm();
  const { profile } = useGetMemberProfile();
  const { onSubmit, loading } = useUpdateMemberProfile({
    onCompleted: () => {
      toast({ title: 'Agent profile updated successfully' });
    },
    onError(error) {
      toast({
        variant: 'destructive',
        title: 'Error occurred',
        description: error.message,
      });
    },
  });
  const city = form.watch('city');

  React.useEffect(() => {
    if (profile) {
      form.reset(profile);
    }
  }, [profile]);

  return (
    <Form {...form}>
      <form
        className="h-full flex flex-col gap-3 justify-between"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="gap-3 grid grid-cols-2 flex-none">
          <Label className="col-span-2" asChild>
            <span className="text-muted-foreground">Address</span>
          </Label>
          <Form.Field
            control={form.control}
            name="city"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>City</Form.Label>
                <Form.Control>
                  <SelectArea
                    city={field.value as string}
                    onCityChange={field.onChange}
                  >
                    <SelectArea.City />
                  </SelectArea>
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="district"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>District</Form.Label>
                <Form.Control>
                  <SelectArea
                    city={city as string}
                    district={field.value as string}
                    onDistrictChange={field.onChange}
                  >
                    <SelectArea.District />
                  </SelectArea>
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => (
              <Form.Item className="col-span-2">
                <Form.Label>Description</Form.Label>
                <Form.Control>
                  <Textarea
                    placeholder="Short description for address"
                    {...field}
                  />
                </Form.Control>
                <Form.Description className="text-right">
                  {field.value?.length} / 300
                </Form.Description>
              </Form.Item>
            )}
          />
          <Label className="col-span-2" asChild>
            <span className="text-muted-foreground">Social Links</span>
          </Label>
          {/* social links */}
          <Form.Field
            control={form.control}
            name="facebookUrl"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Facebook</Form.Label>
                <Form.Control>
                  <SocialLinkInput placeholder="Facebook URL" {...field} />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="instagramUrl"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Instagram</Form.Label>
                <Form.Control>
                  <SocialLinkInput placeholder="Instagram URL" {...field} />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="linkedUrl"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Linkedin</Form.Label>
                <Form.Control>
                  <SocialLinkInput placeholder="Linkedin URL" {...field} />
                </Form.Control>
              </Form.Item>
            )}
          />
          {/* Certificate */}
          <Label className="col-span-2" asChild>
            <span className="text-muted-foreground">Certificate</span>
          </Label>
          <Form.Field
            control={form.control}
            name="certificatePhotos"
            render={({ field }) => (
              <Form.Item className="col-span-2">
                <Form.Control>
                  <UploadAttachments
                    values={field.value as string[]}
                    onValueChange={(values) => {
                      field.onChange(values);
                    }}
                    className="size-auto"
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-1/4 self-end">
          {loading ? <Spinner /> : 'Save'}
        </Button>
      </form>
    </Form>
  );
};
