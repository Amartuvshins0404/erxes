import { ICarCustomFieldValue } from '~/types/car';

export type CarCustomFieldValue = ICarCustomFieldValue;

const getCustomFieldValue = (customField: CarCustomFieldValue) => {
  if (customField.value !== undefined) {
    return customField.value;
  }

  if (customField.stringValue !== undefined) {
    return customField.stringValue;
  }

  if (customField.numberValue !== undefined) {
    return customField.numberValue;
  }

  if (customField.dateValue !== undefined) {
    return customField.dateValue;
  }

  if (customField.locationValue !== undefined) {
    return customField.locationValue;
  }

  return undefined;
};

export const customFieldsDataToPropertiesData = (
  customFieldsData?: CarCustomFieldValue[] | Record<string, unknown> | null,
) => {
  if (!customFieldsData) {
    return {};
  }

  if (!Array.isArray(customFieldsData)) {
    return customFieldsData;
  }

  // Shared property UI reads field values from a field-id keyed object.
  return customFieldsData.reduce<Record<string, unknown>>(
    (propertiesData, item) => {
      if (!item?.field) {
        return propertiesData;
      }

      propertiesData[item.field] = getCustomFieldValue(item);

      return propertiesData;
    },
    {},
  );
};

export const propertiesDataToCustomFieldsData = (
  propertiesData?: Record<string, unknown> | null,
) => {
  if (!propertiesData) {
    return [];
  }

  // Cars still persists the legacy customFieldsData array shape.
  return Object.entries(propertiesData).map(([field, value]) => {
    const customField: CarCustomFieldValue = {
      field,
      value,
    };

    if (typeof value === 'string') {
      customField.stringValue = value;
    }

    if (typeof value === 'number') {
      customField.numberValue = value;
    }

    if (value instanceof Date) {
      customField.dateValue = value;
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value as { type?: string }).type === 'Point'
    ) {
      customField.locationValue = value as CarCustomFieldValue['locationValue'];
    }

    return customField;
  });
};
