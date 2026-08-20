import { useQuery } from '@apollo/client';
import { IconListDetails, IconTag } from '@tabler/icons-react';
import {
  NavigationMenuGroup,
  NavigationMenuLinkItem,
  Skeleton,
  useQueryState,
} from 'erxes-ui';
import { useLocation } from 'react-router-dom';
import { MTO_REGISTRATION_MEMBERSHIP_SUMMARIES } from '@/registration/graphql/registrationQueries';

interface MembershipSummary {
  membershipTypeId: string;
  title: string;
  schemaVersion: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full h-4" />
      ))}
    </div>
  );
}

export const MtoRegistrationsNavigation = () => {
  const { pathname } = useLocation();
  const [membershipTypeId] = useQueryState<string>('membershipTypeId');
  const { data, loading } = useQuery(MTO_REGISTRATION_MEMBERSHIP_SUMMARIES);
  const summaries = (data?.mtoRegistrationMembershipSummaries ??
    []) as MembershipSummary[];

  const onRegistrations = pathname.startsWith('/mto/registrations');

  return (
    <NavigationMenuGroup name="Registration types">
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <NavigationMenuLinkItem
            name="All types"
            icon={IconListDetails}
            pathPrefix="mto"
            path="registrations"
            isActive={onRegistrations && !membershipTypeId}
          />
          {summaries.map((summary) => (
            <NavigationMenuLinkItem
              key={summary.membershipTypeId}
              name={summary.title}
              icon={IconTag}
              pathPrefix="mto"
              path={`registrations?membershipTypeId=${encodeURIComponent(summary.membershipTypeId)}`}
              isActive={
                onRegistrations &&
                membershipTypeId === summary.membershipTypeId
              }
            />
          ))}
        </>
      )}
    </NavigationMenuGroup>
  );
};
