import React, { useState } from 'react';
import { InfoCard, InfoCardContent } from '@/btk/components/card';
import {
  Upload,
  UploadProvider,
  UploadRemoveButton,
} from '@/btk/components/upload';
import { useNewsDetail, useCompany } from '~/modules/news/hooks/useNewsDetail';
import { useUpdateNewsGeneralInfo } from '~/modules/news/hooks/useUpdateNews';
import { IconPhotoCirclePlus, IconUpload, IconX } from '@tabler/icons-react';
import { Button, Form, readImage, Input, Dialog, Select } from 'erxes-ui';
import {
  RemoveButton,
  UploadButton,
  UploadCard,
} from '@/btk/components/UploadCard';
import { BtkEditorField } from '~/modules/btk/components/BtkEditor';
import { btkNewsSchema } from '~/modules/btk/constants/btkNewsSchema';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NEWS_AMENITIES } from '~/modules/news/constants/amenities';
import { Label, Badge, Combobox, Popover, Command } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useEffect } from 'react';

export const NewsDetailMedia = () => {
  return (
    <div className="p-8 blk:lg:grid-cols-2 grid gap-6">
      <NewsCompanySelect />
      <NewsDetailAmenities />
      {/* <NewsImage field="coverImage" /> */}
      <NewsImages field="images" />
      <NewsVideo />
      <NewsDetailText />
    </div>
  );
};

export const NewsCompanySelect = () => {
  const { companies } = useCompany();
  const { news } = useNewsDetail();
  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();

  const form = useForm<{ companyId: string }>({
    defaultValues: {
      companyId: news?.companyId || '',
    },
  });

  const selectedCompanyId = form.watch('companyId');

  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== news?.companyId) {
      updateNewsGeneralInfo(news?._id || '', { companyId: selectedCompanyId });
    }
  }, [selectedCompanyId, news?._id, news?.companyId, updateNewsGeneralInfo]);

  return (
    <InfoCard title="Company">
      <InfoCardContent>
        <Form {...form}>
          <Form.Field
            name="companyId"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Company</Form.Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select company" />
                  </Select.Trigger>
                  <Select.Content>
                    {companies.map((company) => (
                      <Select.Item key={company._id} value={company._id}>
                        {company.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Item>
            )}
          />
        </Form>
      </InfoCardContent>
    </InfoCard>
  );
};
export const NewsImage = ({ field }: { field: 'coverImage' | 'logo' }) => {
  const { news } = useNewsDetail();
  const [imageValue, setImageValue] = useState<string | undefined>(
    news?.[field],
  );
  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();

  const onValueChange = (value?: string) => {
    const finalValue = value || '';
    setImageValue(finalValue);
    updateNewsGeneralInfo(news?._id || '', { [field]: finalValue || null });
  };

  const handleUpload = (value: string | string[]) => {
    const finalValue = Array.isArray(value) ? value[0] : value;
    onValueChange(finalValue);
  };

  return (
    <UploadCard
      title={field === 'coverImage' ? 'News Cover' : 'News Logo'}
      value={imageValue}
      onValueChange={onValueChange}
      fit="cover"
    >
      <div className="w-full mb-3 relative group">
        {imageValue ? (
          <>
            {/* Preview */}
            <Dialog>
              <Dialog.Trigger asChild>
                <img
                  src={readImage(imageValue)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition"
                />
              </Dialog.Trigger>

              <Dialog.Content className="p-0 max-w-screen-xl w-auto border-0 bg-transparent">
                <img
                  src={readImage(imageValue)}
                  alt="news"
                  className="rounded-lg max-h-[90vh] max-w-[90vw] object-contain mx-auto"
                />
              </Dialog.Content>

              <Dialog.Close asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 z-50"
                >
                  <IconX />
                </Button>
              </Dialog.Close>
            </Dialog>
          </>
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center border rounded-lg">
            <span className="opacity-50">No image uploaded</span>
          </div>
        )}
      </div>

      <UploadProvider
        mode="single"
        value={imageValue}
        onValueChange={handleUpload as any}
      >
        <div className="grid grid-cols-2 gap-2">
          <UploadButton value={imageValue} />
          <RemoveButton value={imageValue} />
        </div>
      </UploadProvider>const NewsDetailMedia: () => JSX.Element

    </UploadCard>
  );
};

export const NewsDetailText = () => {
  const { news } = useNewsDetail();
  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();
  const [showAll, setShowAll] = React.useState(false);

  const form = useForm<z.infer<typeof btkNewsSchema>>({
    defaultValues: {
      content: news?.content || '',
    },
  });

  const saveContent = async () => {
    const currentContent = form.getValues().content;
    await updateNewsGeneralInfo(news?._id || '', { content: currentContent });
  };

  return (
    <InfoCard title="News Text">
      <InfoCardContent className="space-y-4">
        <Form {...form}>
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 h-auto p-0 text-xs text-primary z-10"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show less' : 'Show all'}
            </Button>
            <BtkEditorField
              control={form.control}
              setValue={form.setValue}
              name="content"
              label="Content"
              initialContent={news?.content || ''}
              editorClassName={showAll ? 'h-auto' : 'min-h-56'}
            />
          </div>
          <Button type="button" className="mt-2" onClick={saveContent}>
            Save Content
          </Button>
        </Form>
      </InfoCardContent>
    </InfoCard>
  );
};

export const NewsImages = ({ field }: { field: 'images' }) => {
  const { news } = useNewsDetail();
  const [images, setImages] = useState<string[]>(news?.images || []);

  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();

  const onImagesChange = async (value: string[]) => {
    setImages(value);
    await updateNewsGeneralInfo(news?._id || '', { [field]: value });
  };

  return (
    <InfoCard title="News images">
      <InfoCardContent>
        <UploadProvider
          mode="multiple"
          value={images}
          onValueChange={(value) => onImagesChange(value as string[])}
        >
          <div className="grid gap-3 grid-cols-6">
            {images.length > 0 ? (
              images.map((image) => (
                <div
                  key={readImage(image)}
                  className="relative aspect-square bg-muted rounded-lg flex items-center justify-center group"
                >
                  <img
                    src={readImage(image)}
                    className="size-full absolute inset-0 object-cover rounded-lg"
                    alt="news"
                  />
                  <Dialog>
                    <Dialog.Trigger asChild>
                      <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                    </Dialog.Trigger>
                    <Dialog.Content className="p-0 max-w-screen-xl w-auto border-0 bg-transparent">
                      <img
                        src={readImage(image)}
                        alt="news"
                        className="rounded-lg max-h-[90vh] max-w-[90vw] object-contain mx-auto"
                      />
                    </Dialog.Content>
                  </Dialog>
                  <UploadRemoveButton url={readImage(image)}>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconX />
                    </Button>
                  </UploadRemoveButton>
                </div>
              ))
            ) : (
              <div className="relative aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <IconPhotoCirclePlus className="size-8 text-scroll" />
              </div>
            )}
          </div>

          <Upload>
            <Button asChild className="w-full" variant="secondary">
              <div>
                <IconUpload />
                Add images
              </div>
            </Button>
          </Upload>
        </UploadProvider>
      </InfoCardContent>
    </InfoCard>
  );
};

export const NewsVideo = () => {
  const [videoValue, setVideoValue] = useState<string | undefined>(undefined);
  return (
    <div>
      <InfoCard title="News video">
        <InfoCardContent>
          <Input
            type="text"
            placeholder="Video URL"
            value={videoValue}
            onChange={(e) => setVideoValue(e.target.value)}
          />
          <Dialog>
            <Dialog.Trigger asChild>
              <Button variant="secondary" disabled={!videoValue}>
                Preview
              </Button>
            </Dialog.Trigger>
            <Dialog.Content className="p-4 border-0 overflow-hidden">
              <iframe
                src={videoValue}
                title="News video"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full aspect-video rounded-lg overflow-hidden"
              />
              <div className="w-full">
                <Dialog.Close asChild>
                  <Button variant="secondary" className="w-full">
                    Close preview
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};

export const NewsDetailAmenities = () => {
  const { news } = useNewsDetail();
  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();
  const [open, setOpen] = useState(false);
  const [newsAmenities, setNewsAmenities] = useState<
    { category: string; amenities: string[] }[]
  >([]);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (news?.newsAmenities) {
      setNewsAmenities(
        news.newsAmenities.map((amenity) => ({
          category: amenity.category,
          amenities: amenity.amenities,
        })),
      );
    }
  }, [news?.newsAmenities]);

  const handleSelectAmenity = (amenity: (typeof NEWS_AMENITIES)[0]) => {
    const categoryKey = amenity.category_code || amenity.category;
    let newAmenityGroups = newsAmenities || [];

    const existingCategory = newAmenityGroups.find(
      (a) => a.category === categoryKey,
    );

    if (existingCategory) {
      const hasAmenity = existingCategory.amenities.includes(amenity.label_mn);
      newAmenityGroups = newAmenityGroups.map((amenityGroup) =>
        amenityGroup.category === categoryKey
          ? {
              ...amenityGroup,
              amenities: hasAmenity
                ? amenityGroup.amenities.filter((am) => am !== amenity.label_mn)
                : [...amenityGroup.amenities, amenity.label_mn],
            }
          : amenityGroup,
      );
    } else {
      newAmenityGroups = [
        ...newAmenityGroups,
        { category: categoryKey, amenities: [amenity.label_mn] },
      ];
    }

    setNewsAmenities([...newAmenityGroups]);
    setIsChanged(true);
  };

  const isChecked = (amenity: string, category_code: string) => {
    const existingAmenityGroup = newsAmenities?.find(
      (amenityGroup) => amenityGroup.category === category_code,
    );
    return existingAmenityGroup?.amenities.includes(amenity) || false;
  };

  const amenitiesByCategory = NEWS_AMENITIES.reduce((acc, amenity) => {
    acc[amenity.category_code] = [
      ...(acc[amenity.category_code] || []),
      amenity,
    ];
    return acc;
  }, {} as Record<string, typeof NEWS_AMENITIES>);

  const handleRemoveAmenity = (amenity: string, category_code: string) => {
    const updatedAmenities = newsAmenities
      ?.map((amenityGroup) => {
        if (amenityGroup.category === category_code) {
          return {
            ...amenityGroup,
            amenities: amenityGroup.amenities.filter((am) => am !== amenity),
          };
        }
        return amenityGroup;
      })
      .filter((amenityGroup) => amenityGroup.amenities.length > 0);

    setNewsAmenities(updatedAmenities || []);
    updateNewsGeneralInfo(news?._id || '', { newsAmenities: updatedAmenities });
  };

  useEffect(() => {
    if (!open && isChanged) {
      updateNewsGeneralInfo(news?._id || '', { newsAmenities });
      setIsChanged(false);
    }
  }, [open, isChanged, newsAmenities, news?._id, updateNewsGeneralInfo]);

  return (
    <InfoCard title="CATEGORY" description="Amenities">
        <InfoCardContent>
          <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
              <Popover.Trigger asChild>
                <Button variant="outline">
                  <IconPlus />
                  Add category
                </Button>
              </Popover.Trigger>

              <Combobox.Content className="min-w-96">
                <Command>
                  <Command.Input placeholder="Search amenities..." />
                  <Command.List>
                    {Object.entries(amenitiesByCategory).map(
                      ([category, amenities]) => {
                        if (!amenities?.length) return null;
                        return (
                          <Command.Group
                            key={category}
                            heading={amenities[0]?.category || category}
                          >
                            {amenities.map((am) => (
                              <Command.Item
                                className="h-auto"
                                key={am.label_mn}
                                value={am.label_mn}
                                onSelect={() => handleSelectAmenity(am)}
                              >
                                {am.label_mn}
                                <Combobox.Check
                                  checked={isChecked(
                                    am.label_mn,
                                    am.category_code,
                                  )}
                                />
                              </Command.Item>
                            ))}
                          </Command.Group>
                        );
                      },
                    )}
                  </Command.List>
                </Command>
              </Combobox.Content>
            </Popover>

            {newsAmenities?.map((amenityGroup) => (
              <div key={amenityGroup.category} className="pt-2 space-y-2">
                <Label className="block">
                  {amenitiesByCategory[amenityGroup.category]?.[0]?.category ||
                    amenityGroup.category}
                </Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {amenityGroup.amenities.map((am) => (
                    <Badge
                      key={am}
                      variant="secondary"
                      onClose={() =>
                        handleRemoveAmenity(am, amenityGroup.category)
                      }
                    >
                      {am}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </InfoCardContent>
      </InfoCard>
  );
};
