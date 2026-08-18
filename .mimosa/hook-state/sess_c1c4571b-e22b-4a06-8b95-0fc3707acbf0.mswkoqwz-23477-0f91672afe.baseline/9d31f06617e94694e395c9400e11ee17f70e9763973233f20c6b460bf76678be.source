import { NavigationMenuLinkItem } from 'erxes-ui';
import {
  IconBuildingEstate,
  IconChartArcs,
  IconHomeSearch,
  IconId,
  IconUserHexagon,
} from '@tabler/icons-react';
import { AgencyPaths } from './types/AgencyPaths';
import { Can } from 'ui-modules';

export const BlockagencyNavigation = () => {
  return (
    <>
      <Can module="agency">
        <NavigationMenuLinkItem
          name="agency profile"
          icon={IconId}
          pathPrefix="blockagency"
          path={AgencyPaths.AGENCY_PROFILE}
        />
      </Can>
      <Can module="agency">
        <NavigationMenuLinkItem
          name="dashboard"
          icon={IconChartArcs}
          pathPrefix="blockagency"
          path={AgencyPaths.AGENCY_DASHBOARD}
        />
      </Can>
      <Can module="member">
        <NavigationMenuLinkItem
          name="profile"
          icon={IconUserHexagon}
          pathPrefix="blockagency"
          path={AgencyPaths.PROFILE}
        />
      </Can>
      <NavigationMenuLinkItem
        name="listing"
        icon={IconHomeSearch}
        pathPrefix="blockagency"
        path={AgencyPaths.LISTING}
      />
      <NavigationMenuLinkItem
        name="units"
        icon={IconBuildingEstate}
        pathPrefix="blockagency"
        path={AgencyPaths.UNITS}
      />
    </>
  );
};
