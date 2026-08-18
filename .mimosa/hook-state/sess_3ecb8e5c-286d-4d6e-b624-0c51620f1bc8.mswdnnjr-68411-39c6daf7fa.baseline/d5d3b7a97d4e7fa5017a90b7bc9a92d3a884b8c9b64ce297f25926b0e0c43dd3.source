import { format } from 'date-fns';

import { IAttachment, ICar, ICompany, ICustomer } from '~/types/car';
import { EMPTY_SELECT_VALUE } from './constants';

type Translate = (key: string, options: { defaultValue: string }) => string;

export const getTranslatedLabel = (label: string, t?: Translate) =>
  t ? t(label, { defaultValue: label }) : label;

export const getCarOptionLabel = (
  options: ReadonlyArray<{ label: string; value: string }>,
  value?: string | null,
  t?: Translate,
) => {
  if (!value || value === EMPTY_SELECT_VALUE) {
    return '—';
  }

  const normalizedValue = value.toLowerCase();
  const label =
    options.find((option) => option.value.toLowerCase() === normalizedValue)
      ?.label || value;

  return getTranslatedLabel(label, t);
};

export const getCarDisplayName = (
  car?: Partial<ICar> | null,
  t?: Translate,
) => {
  if (!car) {
    return getTranslatedLabel('Unknown car', t);
  }

  return (
    car.plateNumber || car.vinNumber || getTranslatedLabel('Unknown car', t)
  );
};

export const getCustomerDisplayName = (customer: ICustomer) => {
  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ');

  return name || customer.primaryEmail || customer.primaryPhone || customer._id;
};

export const getCompanyDisplayName = (company: ICompany) => {
  return company.primaryName || company.website || company._id;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  try {
    return format(new Date(value), 'PPP p');
  } catch {
    return value;
  }
};

export const formatAttachmentUrl = (attachment?: IAttachment | null) => {
  return attachment?.url || '';
};
