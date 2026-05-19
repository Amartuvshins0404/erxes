export const ROOT_CAR_CONTENT_TYPE = 'car:car';
export const LEGACY_ROOT_CAR_CONTENT_TYPE = 'cars:car';
export const CAR_RELATION_CONTENT_TYPES = [
  ROOT_CAR_CONTENT_TYPE,
  LEGACY_ROOT_CAR_CONTENT_TYPE,
] as const;
export const CAR_SEGMENT_CONTENT_TYPE = 'car:car.car';

export const CORE_CUSTOMER_CONTENT_TYPE = 'core:customer';
export const CORE_COMPANY_CONTENT_TYPE = 'core:company';

export const CAR_SELECT_OPTIONS = {
  STATUSES: [
    { label: 'Active', value: 'Active' },
    { label: 'Deleted', value: 'Deleted' },
  ],
  BODY_TYPES: [
    { label: 'Unknown', value: '' },
    { label: 'Sedan', value: 'Sedan' },
    { label: 'SUV', value: 'SUV' },
    { label: 'Compact', value: 'Compact' },
    { label: 'Wagon', value: 'Wagon' },
    { label: 'Coupe', value: 'Coupe' },
    { label: 'Van', value: 'Van' },
    { label: 'Hatchback', value: 'Hatchback' },
    { label: 'Pickup', value: 'Pickup' },
    { label: 'Sport Coupe', value: 'SportCoupe' },
  ],
  FUEL_TYPES: [
    { label: 'Unknown', value: '' },
    { label: 'Hybrid', value: 'Hybrid' },
    { label: 'Petrol', value: 'Petrol' },
    { label: 'Diesel', value: 'Diesel' },
    { label: 'FlexiFuel', value: 'FlexiFuel' },
    { label: 'Electric', value: 'Electric' },
  ],
  GEAR_BOXES: [
    { label: 'Unknown', value: '' },
    { label: 'Automatic', value: 'Automatic' },
    { label: 'Manual', value: 'Manual' },
    { label: 'CVT', value: 'CVT' },
    { label: 'Semi automatic', value: 'SemiAutomatic' },
  ],
} as const;
