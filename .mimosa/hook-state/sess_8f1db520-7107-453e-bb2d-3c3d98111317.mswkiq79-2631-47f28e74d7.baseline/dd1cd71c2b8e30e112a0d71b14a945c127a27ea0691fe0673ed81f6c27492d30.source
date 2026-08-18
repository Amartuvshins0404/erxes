import { useForm } from 'react-hook-form';
import { IListing } from '../types/listing';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema } from '../form/listing';
import { CurrencyCode } from 'erxes-ui';

export const useListingForm = (defaultValues?: Partial<IListing>) => {
  const form = useForm<IListing>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      type: 'sale',
      propertyType: '',
      status: 'draft',
      description: '',
      mediaAttachments: [],
      location: {
        city: '',
        district: '',
        subDistrict: '',
        short: '',
        lat: 0,
        lng: 0,
      },
      pricing: {
        amount: 0,
        currency: 'MNT' as CurrencyCode,
        priceType: 'fixed',
      },
      specs: {
        area: 0,
      },
      ...defaultValues,
    },
  });

  return { form };
};
