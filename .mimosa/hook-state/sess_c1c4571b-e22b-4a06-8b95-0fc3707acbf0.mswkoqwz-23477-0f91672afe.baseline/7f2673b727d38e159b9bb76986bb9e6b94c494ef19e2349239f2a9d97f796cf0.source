import {
  EMPTY_SELECT_VALUE,
  fromSelectValue,
  toSelectValue,
} from './constants';
import {
  customFieldsDataToPropertiesData,
  propertiesDataToCustomFieldsData,
} from './customFields';

describe('cars ui field adapters', () => {
  it('maps legacy customFieldsData arrays into shared propertiesData maps', () => {
    const location = { type: 'Point', coordinates: [106.9, 47.9] };

    expect(
      customFieldsDataToPropertiesData([
        { field: 'plate-note', stringValue: 'inspection passed' },
        { field: 'mileage', numberValue: 12000 },
        { field: 'seen-at', locationValue: location },
        { field: 'status', value: 'available', stringValue: 'ignored' },
        { value: 'missing field' },
      ]),
    ).toEqual({
      'plate-note': 'inspection passed',
      mileage: 12000,
      'seen-at': location,
      status: 'available',
    });
  });

  it('maps shared propertiesData maps back to legacy customFieldsData arrays', () => {
    const serviceDate = new Date('2026-01-01T00:00:00.000Z');
    const location = { type: 'Point', coordinates: [106.9, 47.9] };

    expect(
      propertiesDataToCustomFieldsData({
        note: 'freshly imported',
        mileage: 5000,
        serviceDate,
        location,
      }),
    ).toEqual([
      {
        field: 'note',
        value: 'freshly imported',
        stringValue: 'freshly imported',
      },
      { field: 'mileage', value: 5000, numberValue: 5000 },
      { field: 'serviceDate', value: serviceDate, dateValue: serviceDate },
      { field: 'location', value: location, locationValue: location },
    ]);
  });

  it('uses a non-empty select sentinel for optional Radix select values', () => {
    expect(toSelectValue('')).toBe(EMPTY_SELECT_VALUE);
    expect(toSelectValue(null)).toBe(EMPTY_SELECT_VALUE);
    expect(toSelectValue('Sedan')).toBe('Sedan');
    expect(fromSelectValue(EMPTY_SELECT_VALUE)).toBe('');
    expect(fromSelectValue('Sedan')).toBe('Sedan');
  });
});
