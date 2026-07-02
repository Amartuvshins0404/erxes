import { resolveRegistrationMembershipFee } from '@/registration/utils/resolveRegistrationMembershipFee';

describe('resolveRegistrationMembershipFee', () => {
  it('returns 1,200,000 for organization membership types', () => {
    expect(resolveRegistrationMembershipFee('tour_operator', {})).toBe(
      1_200_000,
    );
    expect(resolveRegistrationMembershipFee('tourism_service_org', {})).toBe(
      1_200_000,
    );
    expect(resolveRegistrationMembershipFee('travel_agent', {})).toBe(
      1_200_000,
    );
  });

  it('returns 300,000 for tourist transport driver', () => {
    expect(resolveRegistrationMembershipFee('tourist_transport_driver', {})).toBe(
      300_000,
    );
  });

  it('returns fee based on tour guide registration option', () => {
    expect(
      resolveRegistrationMembershipFee('tour_guide', {
        registration_option: 'option1_exam',
      }),
    ).toBe(150_000);
    expect(
      resolveRegistrationMembershipFee('tour_guide', {
        registration_option: 'option2_member',
      }),
    ).toBe(300_000);
  });

  it('throws for invalid tour guide registration option', () => {
    expect(() =>
      resolveRegistrationMembershipFee('tour_guide', {
        registration_option: 'invalid',
      }),
    ).toThrow('valid registration option');
  });

  it('returns fee based on local community service types', () => {
    expect(
      resolveRegistrationMembershipFee('local_community', {
        service_types: ['tbb_members'],
      }),
    ).toBe(1_200_000);
    expect(
      resolveRegistrationMembershipFee('local_community', {
        service_types: ['guest_house'],
      }),
    ).toBe(300_000);
  });

  it('throws for unknown membership type', () => {
    expect(() =>
      resolveRegistrationMembershipFee('unknown_type', {}),
    ).toThrow('Unknown membership type');
  });
});
