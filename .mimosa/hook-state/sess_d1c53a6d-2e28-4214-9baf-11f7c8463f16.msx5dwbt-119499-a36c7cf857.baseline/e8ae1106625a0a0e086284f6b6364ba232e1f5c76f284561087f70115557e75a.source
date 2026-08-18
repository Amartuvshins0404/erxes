import {
  Upload,
  UploadProvider,
  UploadRemoveButton,
} from '@/block/components/upload';
import { useCurrency } from '@/project/hooks/useCurrency';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { unitTypeSchema } from '@/unit/constants/unitTypeSchema';
import { useUnitTypeUpdate } from '@/unit/hooks/useUnitTypeUpdate';
import { IUnitType } from '@/unit/types/unitType';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconPhotoCirclePlus,
  IconPlus,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import {
  Button,
  CurrencyField,
  Dialog,
  Editor,
  Form,
  Input,
  Label,
  readImage,
  ScrollArea,
  Sheet,
  Spinner,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { SelectTenureType } from './SelectTenureType';
import { SelectUsageType } from './SelectUsageType';
import {
  SelectUsageFeatureType,
  SelectUsageSubType,
  SelectUsageTypeRoom,
} from './SelectUsageTypeRoom';

export const UpdateUnitType = ({
  unitType,
  onClose,
}: {
  unitType: IUnitType;
  onClose: () => void;
}) => {
  const { id } = useParams();

  const { mainCurrency } = useCurrency();
  const { project } = useProjectDetail();

  const form = useForm<z.infer<typeof unitTypeSchema>>({
    resolver: zodResolver(unitTypeSchema),
    defaultValues: {
      name: unitType.name || '',
      description: unitType.description || '',
      size: unitType.size || undefined,
      type: unitType.type || '',
      subTypes: unitType.subTypes || '',
      featureTypes: unitType.featureTypes || [],
      areaType: unitType.areaType || '',
      tenureTypes: unitType.tenureTypes || '',
      content: unitType.content || '',
      price: unitType.price || undefined,
      prices: unitType.prices?.length ? unitType.prices?.map((p) => ({
        currency: p.currency,
        price: p.price,
        priceType: p.priceType as 'priceBySize' | 'priceByUnit',
      })) : [
        {
          price: 0,
          priceType: 'priceBySize',
          currency: mainCurrency || 'MNT',
        },
      ],
      status: unitType.status || '',
      rooms:
        unitType.rooms?.map((r) => ({
          type: r.type,
          count: r.count,
        })) || [],
      roomsCount: unitType.roomsCount || undefined,
    },
  });

  const usageType = form.watch('type');
  const areaType = form.watch('areaType');
  const tenureTypes = form.watch('tenureTypes');

  const [coverImage, setCoverImage] = useState<string>(
    unitType?.coverImage || '',
  );
  const [images, setImages] = useState<string[]>(unitType?.images || []);
  const [planImages, setPlanImages] = useState<string[]>(
    unitType?.planImages || [],
  );

  const { updateUnitType, loading } = useUnitTypeUpdate({ id: unitType._id });

  useEffect(() => {
    if (unitType.price) {
      form.setValue('price', unitType.price);
    }
  }, [unitType.price]);

  const onSubmit = (data: z.infer<typeof unitTypeSchema>) => {
    if (areaType === 'private' && tenureTypes?.length) {
      data['tenureTypes'] = [];
    }

    updateUnitType({
      ...data,
      images,
      planImages,
      coverImage,
      project: id || '',
    });
    onClose();
  };

  const onCoverImageChange = (value?: string[] | string) => {
    if (Array.isArray(value)) {
      setCoverImage(value[0]);
    } else if (typeof value === 'string') {
      setCoverImage(value);
    }
  };

  const onValueChange = (value?: string[] | string) => {
    if (Array.isArray(value)) {
      setImages(value);
    } else if (typeof value === 'string') {
      setImages((prev) => [...prev, value]);
    }
  };

  const onValuesChange = (value?: string[] | string) => {
    if (Array.isArray(value)) {
      setPlanImages(value);
    } else if (typeof value === 'string') {
      setPlanImages((prev) => [...prev, value]);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'prices',
  });

  const {
    fields: roomFields,
    append: appendRoom,
    remove: removeRoom,
  } = useFieldArray({
    control: form.control,
    name: 'rooms',
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto overflow-hidden"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="blk:space-y-5 p-6">
              <Form.Field
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Name</Form.Label>
                    <Input {...field} />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="description"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Description</Form.Label>
                    <Editor
                      isHTML
                      initialContent={field.value}
                      onChange={field.onChange}
                    />
                  </Form.Item>
                )}
              />

              <div className="gap-3 grid blk:grid-cols-3">
                <Form.Field
                  name="type"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Type</Form.Label>
                      <SelectUsageType
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);

                          form.setValue('subTypes', []);
                          form.setValue('featureTypes', []);
                          form.setValue('rooms', []);
                        }}
                        inForm
                      />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="subTypes"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Sub Type</Form.Label>
                      <SelectUsageSubType
                        type={usageType}
                        value={field.value}
                        onValueChange={field.onChange}
                        inForm
                      />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="featureTypes"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Feature Type</Form.Label>
                      <SelectUsageFeatureType
                        type={usageType}
                        value={field.value}
                        onValueChange={field.onChange}
                        inForm
                      />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="tenureType"
                  render={() => (
                    <Form.Item>
                      <Form.Label>Tenure Type</Form.Label>
                      <SelectTenureType
                        value={{
                          areaType,
                          tenureTypes,
                        }}
                        onValueChange={(areaType, tenureTypes) => {
                          form.setValue('areaType', areaType);
                          form.setValue('tenureTypes', tenureTypes);
                        }}
                        inForm
                      />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="size"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Size</Form.Label>
                      <CurrencyField.ValueInput placeholder="0" {...field} />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="price"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Price per m²</Form.Label>
                      <CurrencyField.ValueInput placeholder="0" {...field} />
                    </Form.Item>
                  )}
                />
              </div>

              <div className="gap-3 grid grid-cols-2">
                <div className="space-y-2">
                  <Label asChild>
                    <legend>Prices per m²</legend>
                  </Label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-1 gap-2 grid grid-cols-3">
                        <Form.Field
                          name={`prices.${index}.currency`}
                          render={({ field }) => (
                            <Form.Item>
                              <CurrencyField.SelectCurrency
                                {...field}
                                value={mainCurrency || 'MNT'}
                                display="code"
                              />
                            </Form.Item>
                          )}
                        />
                        <Form.Field
                          name={`prices.${index}.price`}
                          render={({ field }) => (
                            <Form.Item className="col-span-2">
                              <CurrencyField.ValueInput
                                placeholder="0"
                                {...field}
                              />
                            </Form.Item>
                          )}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="bg-destructive/10 hover:bg-destructive/20 size-8 text-destructive"
                        onClick={() => remove(index)}
                        type="button"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      append({
                        currency: '',
                        price: 0,
                        priceType: 'priceBySize',
                      })
                    }
                    type="button"
                  >
                    <IconPlus className="mr-2 w-4 h-4" /> Add Price
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label asChild>
                    <legend>Rooms</legend>
                  </Label>
                  <Form.Field
                    name={'roomsCount'}
                    render={({ field }) => (
                      <Form.Item>
                        <Input
                          placeholder="Total room count"
                          value={field?.value}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </Form.Item>
                    )}
                  />
                  {roomFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-1 gap-2 grid grid-cols-4">
                        <Form.Field
                          name={`rooms.${index}.type`}
                          render={({ field }) => (
                            <Form.Item className="col-span-3">
                              <SelectUsageTypeRoom
                                type={usageType}
                                value={field.value}
                                onValueChange={field.onChange}
                                inForm
                              />
                            </Form.Item>
                          )}
                        />
                        <Form.Field
                          name={`rooms.${index}.count`}
                          render={({ field }) => (
                            <Form.Item>
                              <Input
                                type="number"
                                placeholder="Count"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </Form.Item>
                          )}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="bg-destructive/10 hover:bg-destructive/20 size-8 text-destructive"
                        onClick={() => removeRoom(index)}
                        type="button"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      appendRoom({
                        type: '',
                        count: 1,
                      })
                    }
                    type="button"
                  >
                    <IconPlus className="mr-2 w-4 h-4" /> Add Room
                  </Button>
                </div>
              </div>

              <div className="flex">
                <div className="flex flex-col gap-3">
                  <Label>Cover image</Label>
                  <UploadProvider
                    mode="single"
                    value={coverImage}
                    onValueChange={onCoverImageChange}
                  >
                    <div className="gap-3 grid grid-cols-6">
                      {coverImage ? (
                        <div
                          key={coverImage}
                          className="group relative flex justify-center items-center bg-muted rounded-lg aspect-square"
                        >
                          <img
                            src={readImage(coverImage)}
                            className="absolute inset-0 rounded-lg size-full object-cover"
                            alt="project"
                          />
                          <Dialog>
                            <Dialog.Trigger asChild>
                              <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                            </Dialog.Trigger>
                            <Dialog.Content className="bg-transparent p-0 border-0 w-auto max-w-screen-xl">
                              <img
                                src={readImage(coverImage)}
                                alt="project"
                                className="mx-auto rounded-lg max-w-[90vw] max-h-[90vh] object-contain"
                              />
                              <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                            </Dialog.Content>
                          </Dialog>
                          <UploadRemoveButton url={coverImage}>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="-top-2 -right-2 absolute opacity-0 group-hover:opacity-100 size-6 transition-opacity"
                            >
                              <IconX />
                            </Button>
                          </UploadRemoveButton>
                        </div>
                      ) : (
                        <div className="relative flex justify-center items-center bg-muted rounded-lg aspect-square overflow-hidden">
                          <IconPhotoCirclePlus className="size-8 text-scroll" />
                        </div>
                      )}
                      <Upload>
                        <div className="relative flex justify-center items-center bg-muted p-2 rounded-lg aspect-square overflow-hidden">
                          <IconUpload />
                        </div>
                      </Upload>
                    </div>
                  </UploadProvider>
                </div>

                <div className="flex flex-col gap-3">
                  <Label>Images</Label>
                  <UploadProvider
                    mode="multiple"
                    value={images}
                    onValueChange={onValueChange}
                  >
                    <div className="gap-3 grid grid-cols-6">
                      {images.length > 0 ? (
                        images.map((image) => (
                          <div
                            key={image}
                            className="group relative flex justify-center items-center bg-muted rounded-lg aspect-square"
                          >
                            <img
                              src={readImage(image)}
                              className="absolute inset-0 rounded-lg size-full object-cover"
                              alt="project"
                            />
                            <Dialog>
                              <Dialog.Trigger asChild>
                                <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                              </Dialog.Trigger>
                              <Dialog.Content className="bg-transparent p-0 border-0 w-auto max-w-screen-xl">
                                <img
                                  src={readImage(image)}
                                  alt="project"
                                  className="mx-auto rounded-lg max-w-[90vw] max-h-[90vh] object-contain"
                                />
                                <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                              </Dialog.Content>
                            </Dialog>
                            <UploadRemoveButton url={image}>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="-top-2 -right-2 absolute opacity-0 group-hover:opacity-100 size-6 transition-opacity"
                              >
                                <IconX />
                              </Button>
                            </UploadRemoveButton>
                          </div>
                        ))
                      ) : (
                        <div className="relative flex justify-center items-center bg-muted rounded-lg aspect-square overflow-hidden">
                          <IconPhotoCirclePlus className="size-8 text-scroll" />
                        </div>
                      )}
                      <Upload>
                        <div className="relative flex justify-center items-center bg-muted p-2 rounded-lg aspect-square overflow-hidden">
                          <IconUpload />
                        </div>
                      </Upload>
                    </div>
                  </UploadProvider>
                </div>

                <div className="flex flex-col gap-3">
                  <Label>Plan images</Label>
                  <UploadProvider
                    mode="multiple"
                    value={planImages}
                    onValueChange={onValuesChange}
                  >
                    <div className="gap-3 grid grid-cols-6">
                      {planImages.length > 0 ? (
                        planImages.map((image) => (
                          <div
                            key={image}
                            className="group relative flex justify-center items-center bg-muted rounded-lg aspect-square"
                          >
                            <img
                              src={readImage(image)}
                              className="absolute inset-0 rounded-lg size-full object-cover"
                              alt="project"
                            />
                            <Dialog>
                              <Dialog.Trigger asChild>
                                <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                              </Dialog.Trigger>
                              <Dialog.Content className="bg-transparent p-0 border-0 w-auto max-w-screen-xl">
                                <img
                                  src={readImage(image)}
                                  alt="project"
                                  className="mx-auto rounded-lg max-w-[90vw] max-h-[90vh] object-contain"
                                />
                                <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                              </Dialog.Content>
                            </Dialog>
                            <UploadRemoveButton url={image}>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="-top-2 -right-2 absolute opacity-0 group-hover:opacity-100 size-6 transition-opacity"
                              >
                                <IconX />
                              </Button>
                            </UploadRemoveButton>
                          </div>
                        ))
                      ) : (
                        <div className="relative flex justify-center items-center bg-muted rounded-lg aspect-square overflow-hidden">
                          <IconPhotoCirclePlus className="size-8 text-scroll" />
                        </div>
                      )}
                      <Upload>
                        <div className="relative flex justify-center items-center bg-muted p-2 rounded-lg aspect-square overflow-hidden">
                          <IconUpload />
                        </div>
                      </Upload>
                    </div>
                  </UploadProvider>
                </div>
              </div>
            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Update unit type
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
