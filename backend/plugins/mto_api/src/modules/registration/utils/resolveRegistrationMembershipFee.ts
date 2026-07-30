const FEE_ORGANIZATION = 1_200_000;
const FEE_INDIVIDUAL = 300_000;
const FEE_TOUR_GUIDE_EXAM = 150_000;

const ORGANIZATION_MEMBERSHIP_TYPES = new Set([
  'tour_operator',
  'tourism_service_org',
  'travel_agent',
]);

const LOCAL_COMMUNITY_ORG_SERVICE_TYPES = new Set([
  'tbb_members',
  'tbb_public',
  'branch_member',
]);

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export function resolveRegistrationMembershipFee(
  membershipTypeId: string,
  answers: Record<string, unknown>,
): number {
  if (ORGANIZATION_MEMBERSHIP_TYPES.has(membershipTypeId)) {
    return FEE_ORGANIZATION;
  }

  if (membershipTypeId === 'tourist_transport_driver') {
    return FEE_INDIVIDUAL;
  }

  if (membershipTypeId === 'tour_guide') {
    const option = answers.registration_option;

    if (option === 'option1_exam') {
      return FEE_TOUR_GUIDE_EXAM;
    }

    if (option === 'option2_member') {
      return FEE_INDIVIDUAL;
    }

    throw new Error(
      'Tour guide registration requires a valid registration option for fee calculation',
    );
  }

  if (membershipTypeId === 'local_community') {
    const serviceTypes = asStringArray(answers.service_types);
    const hasOrgServiceType = serviceTypes.some((type) =>
      LOCAL_COMMUNITY_ORG_SERVICE_TYPES.has(type),
    );

    return hasOrgServiceType ? FEE_ORGANIZATION : FEE_INDIVIDUAL;
  }

  throw new Error(
    `Unknown membership type for fee calculation: ${membershipTypeId}`,
  );
}
