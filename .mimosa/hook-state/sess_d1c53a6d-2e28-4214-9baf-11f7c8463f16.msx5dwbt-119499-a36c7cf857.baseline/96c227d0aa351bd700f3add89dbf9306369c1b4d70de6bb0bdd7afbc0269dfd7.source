import { useMutation, useQuery } from '@apollo/client';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Form,
  Input,
  Label,
  PageSubHeader,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  ScrollArea,
  Spinner,
} from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ONE_FIT_CITIES_ADMIN,
  ONE_FIT_DISTRICTS_ADMIN,
} from '../graphql/locationMasterQueries';
import {
  ONE_FIT_CITY_CREATE,
  ONE_FIT_CITY_UPDATE,
  ONE_FIT_CITY_REMOVE,
  ONE_FIT_DISTRICT_CREATE,
  ONE_FIT_DISTRICT_UPDATE,
  ONE_FIT_DISTRICT_REMOVE,
} from '../graphql/locationMasterMutations';
import type {
  OneFitCity,
  OneFitDistrict,
  MultilingualString,
} from '~/modules/provider/types/provider';

const citySchema = z.object({
  name: z.object({
    en: z.string().min(1, { message: 'City name (English) is required' }),
    mn: z.string().min(1, { message: 'City name (Mongolian) is required' }),
  }),
  code: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CityFormData = z.infer<typeof citySchema>;

const districtSchema = z.object({
  name: z.object({
    en: z.string().min(1, { message: 'District name (English) is required' }),
    mn: z.string().min(1, { message: 'District name (Mongolian) is required' }),
  }),
  code: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DistrictFormData = z.infer<typeof districtSchema>;

interface CityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city?: OneFitCity;
  onCompleted: () => void;
}

const CityDialog = ({
  open,
  onOpenChange,
  city,
  onCompleted,
}: CityDialogProps) => {
  const isEditMode = !!city;
  const [createCity, { loading: createLoading }] = useMutation(
    ONE_FIT_CITY_CREATE,
    {
      refetchQueries: [ONE_FIT_CITIES_ADMIN],
    },
  );
  const [updateCity, { loading: updateLoading }] = useMutation(
    ONE_FIT_CITY_UPDATE,
    {
      refetchQueries: [ONE_FIT_CITIES_ADMIN],
    },
  );

  const form = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: {
        en: city?.name.en ?? '',
        mn: city?.name.mn ?? '',
      },
      code: city?.code ?? '',
      isActive: city?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (city) {
      form.reset({
        name: {
          en: city.name.en,
          mn: city.name.mn,
        },
        code: city.code ?? '',
        isActive: city.isActive ?? true,
      });
    } else {
      form.reset({
        name: { en: '', mn: '' },
        code: '',
        isActive: true,
      });
    }
  }, [city, form]);

  const loading = createLoading || updateLoading;

  const onSubmit = async (data: CityFormData) => {
    try {
      if (isEditMode && city) {
        await updateCity({
          variables: {
            _id: city._id,
            name: data.name,
            code: data.code || undefined,
            isActive: data.isActive,
          },
        });
      } else {
        await createCity({
          variables: {
            name: data.name,
            code: data.code || undefined,
            isActive: data.isActive,
          },
        });
      }
      onCompleted();
      onOpenChange(false);
    } catch {
      // errors surfaced via Apollo / UI
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            {isEditMode ? 'Edit City' : 'Create City'}
          </Dialog.Title>
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            <Form.Field
              control={form.control}
              name="name.en"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>City Name (English) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter city name in English"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="name.mn"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>City Name (Mongolian) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter city name in Mongolian"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Code (optional)</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="e.g. ulaanbaatar"
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
                <Form.Item className="flex flex-row items-center gap-2">
                  <Form.Control>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.Control>
                  <Label>Active</Label>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Spinner show={loading} />
                {isEditMode ? 'Update City' : 'Create City'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

interface DistrictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityId: string;
  cityName?: MultilingualString;
  district?: OneFitDistrict;
  onCompleted: () => void;
}

const DistrictDialog = ({
  open,
  onOpenChange,
  cityId,
  cityName,
  district,
  onCompleted,
}: DistrictDialogProps) => {
  const isEditMode = !!district;
  const [createDistrict, { loading: createLoading }] = useMutation(
    ONE_FIT_DISTRICT_CREATE,
    {
      refetchQueries: [ONE_FIT_DISTRICTS_ADMIN],
    },
  );
  const [updateDistrict, { loading: updateLoading }] = useMutation(
    ONE_FIT_DISTRICT_UPDATE,
    {
      refetchQueries: [ONE_FIT_DISTRICTS_ADMIN],
    },
  );

  const form = useForm<DistrictFormData>({
    resolver: zodResolver(districtSchema),
    defaultValues: {
      name: {
        en: district?.name.en ?? '',
        mn: district?.name.mn ?? '',
      },
      code: district?.code ?? '',
      isActive: district?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (district) {
      form.reset({
        name: {
          en: district.name.en,
          mn: district.name.mn,
        },
        code: district.code ?? '',
        isActive: district.isActive ?? true,
      });
    } else {
      form.reset({
        name: { en: '', mn: '' },
        code: '',
        isActive: true,
      });
    }
  }, [district, form]);

  const loading = createLoading || updateLoading;

  const onSubmit = async (data: DistrictFormData) => {
    try {
      if (isEditMode && district) {
        await updateDistrict({
          variables: {
            _id: district._id,
            cityId,
            name: data.name,
            code: data.code || undefined,
            isActive: data.isActive,
          },
        });
      } else {
        await createDistrict({
          variables: {
            cityId,
            name: data.name,
            code: data.code || undefined,
            isActive: data.isActive,
          },
        });
      }
      onCompleted();
      onOpenChange(false);
    } catch {
      // errors surfaced via Apollo / UI
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            {isEditMode ? 'Edit District' : 'Create District'}
          </Dialog.Title>
          {cityName && (
            <Dialog.Description>
              For city: {cityName.en} / {cityName.mn}
            </Dialog.Description>
          )}
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            <Form.Field
              control={form.control}
              name="name.en"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>District Name (English) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter district name in English"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="name.mn"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>District Name (Mongolian) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter district name in Mongolian"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Code (optional)</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="e.g. bayangol"
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
                <Form.Item className="flex flex-row items-center gap-2">
                  <Form.Control>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.Control>
                  <Label>Active</Label>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Spinner show={loading} />
                {isEditMode ? 'Update District' : 'Create District'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

export const CityDistrictManagement = () => {
  const [citySearch, setCitySearch] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<OneFitCity | undefined>(
    undefined,
  );
  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<
    OneFitDistrict | undefined
  >(undefined);

  const {
    data: citiesData,
    loading: citiesLoading,
    refetch: refetchCities,
  } = useQuery(ONE_FIT_CITIES_ADMIN, {
    variables: {
      isActive: undefined,
      searchValue: citySearch || undefined,
    },
  });

  const cities: OneFitCity[] = citiesData?.oneFitCitiesAdmin ?? [];

  const activeCityId =
    selectedCityId && cities.some((c) => c._id === selectedCityId)
      ? selectedCityId
      : cities[0]?._id ?? null;

  const activeCity = cities.find((c) => c._id === activeCityId);

  const {
    data: districtsData,
    loading: districtsLoading,
    refetch: refetchDistricts,
  } = useQuery(ONE_FIT_DISTRICTS_ADMIN, {
    variables: {
      cityId: activeCityId ?? undefined,
      isActive: undefined,
      searchValue: undefined,
    },
    skip: !activeCityId,
  });

  const districts: OneFitDistrict[] = districtsData?.oneFitDistrictsAdmin ?? [];

  const [removeCity] = useMutation(ONE_FIT_CITY_REMOVE, {
    refetchQueries: [ONE_FIT_CITIES_ADMIN, ONE_FIT_DISTRICTS_ADMIN],
  });
  const [removeDistrict] = useMutation(ONE_FIT_DISTRICT_REMOVE, {
    refetchQueries: [ONE_FIT_DISTRICTS_ADMIN],
  });

  const cityColumns: ColumnDef<OneFitCity>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'City',
        cell: ({ row }) => (
          <RecordTableInlineCell className="text-xs font-medium">
            {row.original.name.en} / {row.original.name.mn}
          </RecordTableInlineCell>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ cell }) => (
          <RecordTableInlineCell className="text-xs font-mono">
            {(cell.getValue() as string) || '—'}
          </RecordTableInlineCell>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ cell }) => {
          const isActive = cell.getValue() as boolean | undefined;
          return (
            <RecordTableInlineCell>
              <Badge variant={isActive ? 'success' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ cell }) => {
          const value = cell.getValue() as string | undefined;
          if (!value) {
            return (
              <RecordTableInlineCell className="text-xs text-muted-foreground">
                —
              </RecordTableInlineCell>
            );
          }
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              <RelativeDateDisplay value={value} asChild>
                <RelativeDateDisplay.Value value={value} />
              </RelativeDateDisplay>
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const city = row.original;
          return (
            <RecordTableInlineCell>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCity(city);
                    setCityDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await removeCity({ variables: { _id: city._id } });
                    await refetchCities();
                    await refetchDistricts();
                  }}
                >
                  Remove
                </Button>
              </div>
            </RecordTableInlineCell>
          );
        },
      },
    ],
    [refetchCities, refetchDistricts, removeCity],
  );

  const districtColumns: ColumnDef<OneFitDistrict>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'District',
        cell: ({ row }) => (
          <RecordTableInlineCell className="text-xs font-medium">
            {row.original.name.en} / {row.original.name.mn}
          </RecordTableInlineCell>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ cell }) => (
          <RecordTableInlineCell className="text-xs font-mono">
            {(cell.getValue() as string) || '—'}
          </RecordTableInlineCell>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ cell }) => {
          const isActive = cell.getValue() as boolean | undefined;
          return (
            <RecordTableInlineCell>
              <Badge variant={isActive ? 'success' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ cell }) => {
          const value = cell.getValue() as string | undefined;
          if (!value) {
            return (
              <RecordTableInlineCell className="text-xs text-muted-foreground">
                —
              </RecordTableInlineCell>
            );
          }
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              <RelativeDateDisplay value={value} asChild>
                <RelativeDateDisplay.Value value={value} />
              </RelativeDateDisplay>
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const district = row.original;
          return (
            <RecordTableInlineCell>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingDistrict(district);
                    setDistrictDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await removeDistrict({ variables: { _id: district._id } });
                    await refetchDistricts();
                  }}
                >
                  Remove
                </Button>
              </div>
            </RecordTableInlineCell>
          );
        },
      },
    ],
    [refetchDistricts, removeDistrict],
  );

  return (
    <div className="flex flex-col h-full">
      <PageSubHeader>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search cities..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditingCity(undefined);
                setCityDialogOpen(true);
              }}
            >
              Create City
            </Button>
            {activeCity && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingDistrict(undefined);
                  setDistrictDialogOpen(true);
                }}
              >
                Create District
              </Button>
            )}
          </div>
        </div>
      </PageSubHeader>
      <ScrollArea className="flex-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="border rounded-lg bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="font-semibold text-sm">Cities</h3>
                <p className="text-xs text-muted-foreground">
                  Manage cities used in provider locations.
                </p>
              </div>
            </div>
            <RecordTable.Provider
              columns={cityColumns}
              data={cities}
              className="m-3"
            >
              <RecordTable>
                <RecordTable.Header />
                <RecordTable.Body>
                  {citiesLoading && <RecordTable.RowSkeleton rows={10} />}
                  <RecordTable.RowList
                    Row={(props) => {
                      const { original, className, onClick, ...rest } = props;
                      const city = original as OneFitCity | undefined;

                      if (!city) {
                        return <RecordTable.Row {...rest} />;
                      }

                      const isActive = city._id === activeCityId;

                      return (
                        <RecordTable.Row
                          {...rest}
                          original={original}
                          onClick={(event) => {
                            setSelectedCityId(city._id);
                            onClick?.(event);
                          }}
                          className={`cursor-pointer ${
                            isActive ? 'bg-muted' : ''
                          } ${className || ''}`}
                        />
                      );
                    }}
                  />
                </RecordTable.Body>
              </RecordTable>
            </RecordTable.Provider>
          </div>

          <div className="border rounded-lg bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="font-semibold text-sm">Districts</h3>
                <p className="text-xs text-muted-foreground">
                  {activeCity
                    ? `Districts for ${activeCity.name.en} / ${activeCity.name.mn}`
                    : 'Select a city to manage its districts.'}
                </p>
              </div>
            </div>
            {activeCity ? (
              <RecordTable.Provider
                columns={districtColumns}
                data={districts}
                className="m-3"
              >
                <RecordTable>
                  <RecordTable.Header />
                  <RecordTable.Body>
                    {districtsLoading && <RecordTable.RowSkeleton rows={10} />}
                    <RecordTable.RowList />
                  </RecordTable.Body>
                </RecordTable>
              </RecordTable.Provider>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                Select a city to view and manage its districts.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <CityDialog
        open={cityDialogOpen}
        onOpenChange={setCityDialogOpen}
        city={editingCity}
        onCompleted={() => {
          refetchCities();
          refetchDistricts();
        }}
      />

      {activeCity && (
        <DistrictDialog
          open={districtDialogOpen}
          onOpenChange={setDistrictDialogOpen}
          cityId={activeCity._id}
          cityName={activeCity.name}
          district={editingDistrict}
          onCompleted={() => {
            refetchDistricts();
          }}
        />
      )}
    </div>
  );
};
