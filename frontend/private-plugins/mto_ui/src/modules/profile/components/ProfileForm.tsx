import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Badge,
  Button,
  Form,
  InfoCard,
  Input,
  Spinner,
  Switch,
  Textarea,
  toast,
} from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';
import {
  ProfileFormData,
  profileFormSchema,
} from '@/profile/constants/profileSchema';
import { useMyProfile } from '@/profile/hooks/useMyProfile';
import { useProfile } from '@/profile/hooks/useProfile';
import { useSaveProfile } from '@/profile/hooks/useSaveProfile';
import {
  MtoProfile,
  ProfileMutationVariables,
  ProfileStatus,
} from '@/profile/types/profile';
import { MtoUpload } from '~/components/MtoUpload';

const DEFAULT_VALUES: ProfileFormData = {
  businessNameEn: '',
  businessNameMn: '',
  descriptionEn: '',
  descriptionMn: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  certificateNo: '',
  isActive: true,
  icon: '',
  coverImages: [],
};

const statusVariant = (status?: ProfileStatus) => {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'destructive' as const;
  return 'secondary' as const;
};

const toFormValues = (profile: MtoProfile | null): ProfileFormData => {
  if (!profile) return DEFAULT_VALUES;

  return {
    businessNameEn: profile.businessName?.en ?? '',
    businessNameMn: profile.businessName?.mn ?? '',
    descriptionEn: profile.description?.en ?? '',
    descriptionMn: profile.description?.mn ?? '',
    phone: profile.contactInfo?.phone ?? '',
    email: profile.contactInfo?.email ?? '',
    website: profile.contactInfo?.website ?? '',
    address: profile.address ?? '',
    certificateNo: profile.certificateNo ?? '',
    isActive: profile.isActive ?? true,
    icon: profile.icon ?? '',
    coverImages: profile.coverImages ?? [],
  };
};

const toMutationVariables = (
  data: ProfileFormData,
): ProfileMutationVariables => {
  const descriptionEn = data.descriptionEn?.trim();
  const descriptionMn = data.descriptionMn?.trim();
  const website = data.website?.trim();
  const icon = data.icon?.trim();
  const address = data.address?.trim();
  const certificateNo = data.certificateNo?.trim();

  return {
    businessName: {
      en: data.businessNameEn,
      mn: data.businessNameMn,
    },
    description:
      descriptionEn || descriptionMn
        ? {
            en: descriptionEn || undefined,
            mn: descriptionMn || undefined,
          }
        : undefined,
    contactInfo: {
      phone: data.phone,
      email: data.email,
      website: website || undefined,
    },
    isActive: data.isActive,
    icon: icon || undefined,
    coverImages: data.coverImages,
    address: address || '',
    certificateNo: certificateNo || '',
  };
};

export interface ProfileFormProps {
  profileId?: string | null;
  source?: 'my' | 'id';
  layout?: 'page' | 'sheet';
  onSaved?: () => void;
}

export function ProfileForm({
  profileId,
  source = 'my',
  layout = 'page',
  onSaved,
}: ProfileFormProps) {
  const myProfile = useMyProfile(source !== 'my');
  const byId = useProfile(source === 'id' ? profileId : undefined);
  const profile = source === 'id' ? byId.profile : myProfile.profile;
  const profileLoading =
    source === 'id' ? Boolean(profileId) && byId.loading : myProfile.loading;
  const { saveProfile, loading: saving } = useSaveProfile();
  const { uploadUrl } = useUploadConfig();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const resetFromProfile = useCallback(() => {
    form.reset(toFormValues(profile));
  }, [form, profile]);

  useEffect(() => {
    if (profileLoading) return;
    resetFromProfile();
  }, [profileLoading, resetFromProfile]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await saveProfile(profile?._id, toMutationVariables(data));
      toast({
        title: 'Saved',
        description: profile?._id ? 'Profile updated' : 'Profile created',
      });
      onSaved?.();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to save profile',
        variant: 'destructive',
      });
    }
  };

  const isRejected = profile?.status === 'rejected';
  const icon = form.watch('icon');
  const coverImages = form.watch('coverImages');

  if (profileLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className={
        layout === 'sheet'
          ? 'flex flex-col gap-6 w-full p-5'
          : 'flex flex-col gap-6 mx-auto p-6 w-full max-w-6xl'
      }
    >
      <div className="flex justify-between items-center">
        {layout === 'page' ? (
          <h1 className="font-bold text-lg">Profile</h1>
        ) : (
          <span className="font-medium text-sm text-muted-foreground">
            {profile?._id ? 'Edit profile' : 'New profile'}
          </span>
        )}
        <Badge variant={statusVariant(profile?.status)}>
          {profile?.status || 'new'}
        </Badge>
      </div>
      {isRejected && profile?.rejectionReason && (
        <div className="bg-destructive/10 px-4 py-3 border border-destructive/50 rounded-lg text-destructive text-sm">
          <p className="mb-1 font-medium">Profile rejected</p>
          <p>{profile.rejectionReason}</p>
        </div>
      )}
      <Form {...form}>
        <form
          className="gap-4 grid grid-cols-1 lg:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <fieldset disabled={isRejected || saving} className="contents">
            <InfoCard title="Branding">
              <InfoCard.Content>
                <Form.Field
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Logo</Form.Label>
                      <MtoUpload.Root
                        value={field.value || ''}
                        onChange={(value) =>
                          field.onChange(
                            typeof value.url === 'string'
                              ? value.url
                              : field.value,
                          )
                        }
                        uploadUrl={uploadUrl}
                      >
                        <div className="flex items-center gap-3">
                          {icon ? (
                            <img
                              src={readImage(icon)}
                              alt="Logo preview"
                              className="h-16 w-16 rounded object-cover border"
                            />
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <MtoUpload.Button
                              variant="outline"
                              size="sm"
                              type="button"
                            >
                              {icon ? 'Change logo' : 'Upload logo'}
                            </MtoUpload.Button>
                            {icon ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                onClick={() => field.onChange('')}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </MtoUpload.Root>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="coverImages"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Cover images</Form.Label>
                      <div className="flex flex-wrap gap-3">
                        {coverImages.map((url) => (
                          <div key={url} className="relative">
                            <img
                              src={readImage(url)}
                              alt="Cover preview"
                              className="h-16 w-24 rounded object-cover border"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-0 right-0 h-6 px-1 text-muted-foreground"
                              onClick={() =>
                                field.onChange(
                                  field.value.filter((item) => item !== url),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <MtoUpload.Root
                          value=""
                          onChange={(value) => {
                            if (typeof value.url !== 'string' || !value.url) {
                              return;
                            }
                            if (field.value.includes(value.url)) return;
                            field.onChange([...field.value, value.url]);
                          }}
                          uploadUrl={uploadUrl}
                        >
                          <MtoUpload.Button
                            variant="outline"
                            size="sm"
                            type="button"
                          >
                            Add cover
                          </MtoUpload.Button>
                        </MtoUpload.Root>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </InfoCard.Content>
            </InfoCard>

            <InfoCard title="Contact">
              <InfoCard.Content>
                <Form.Field
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Phone *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Phone number" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Email *</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@example.com"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Website</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="https://" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Address</Form.Label>
                      <Form.Control>
                        <Textarea
                          {...field}
                          placeholder="Street, city"
                          rows={2}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Form.Item className="flex items-center gap-3">
                      <Form.Control>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </Form.Control>
                      <Form.Label className="!mt-0">Active</Form.Label>
                    </Form.Item>
                  )}
                />
              </InfoCard.Content>
            </InfoCard>

            <InfoCard title="Basic information" className="lg:col-span-2">
              <InfoCard.Content>
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="businessNameEn"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Business name (EN) *</Form.Label>
                        <Form.Control>
                          <Input {...field} placeholder="English name" />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="businessNameMn"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Business name (MN) *</Form.Label>
                        <Form.Control>
                          <Input {...field} placeholder="Монгол нэр" />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="certificateNo"
                    render={({ field }) => (
                      <Form.Item className="md:col-span-2">
                        <Form.Label>Certificate No</Form.Label>
                        <Form.Control>
                          <Input {...field} placeholder="Certificate number" />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Description (EN)</Form.Label>
                        <Form.Control>
                          <Textarea
                            {...field}
                            placeholder="English description"
                            rows={3}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="descriptionMn"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Description (MN)</Form.Label>
                        <Form.Control>
                          <Textarea
                            {...field}
                            placeholder="Монгол тайлбар"
                            rows={3}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </InfoCard.Content>
            </InfoCard>
          </fieldset>

          <Button
            type="submit"
            className="lg:col-span-2 mt-2"
            disabled={saving || isRejected || !form.formState.isDirty}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
