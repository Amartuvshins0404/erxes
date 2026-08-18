import { NavigationMenuLinkItem } from 'erxes-ui';
import {
  IconActivity,
  IconLayoutDashboard,
  IconCalendar,
  IconBike,
  IconTags,
  IconCreditCard,
  IconShoppingCart,
  IconCoins,
  IconUsers,
  IconBuildingStore,
  IconPhoto,
  IconTicket,
  IconReportMoney,
  IconChartBar,
} from '@tabler/icons-react';
import { Can } from 'ui-modules';
import { useOneFitMode } from './config/hooks/useOneFitMode';

export const OneFitNavigation = () => {
  const { isSlaveMode } = useOneFitMode();

  return (
    <>
      <NavigationMenuLinkItem
        name="OneFit"
        icon={IconActivity}
        pathPrefix="onefit"
        path=""
      />
      <Can module="dashboard">
        <NavigationMenuLinkItem
          name="Dashboard"
          icon={IconLayoutDashboard}
          pathPrefix="onefit"
          path="dashboard"
        />
      </Can>
      {!isSlaveMode && (
        <Can module="onefitCustomer">
          <NavigationMenuLinkItem
            name="Customers"
            icon={IconUsers}
            pathPrefix="onefit"
            path="customers"
          />
        </Can>
      )}

      <Can module="booking">
        <NavigationMenuLinkItem
          name="Bookings"
          icon={IconCalendar}
          pathPrefix="onefit"
          path="bookings"
        />
      </Can>
      <Can module="schedule">
        <NavigationMenuLinkItem
          name="Schedules"
          icon={IconCalendar}
          pathPrefix="onefit"
          path="schedules"
        />
      </Can>
      <Can module="activityType">
        <NavigationMenuLinkItem
          name="Activity Types"
          icon={IconBike}
          pathPrefix="onefit"
          path="activity-types"
        />
      </Can>
      {!isSlaveMode && (
        <Can module="category">
          <NavigationMenuLinkItem
            name="Categories"
            icon={IconTags}
            pathPrefix="onefit"
            path="categories"
          />
        </Can>
      )}
      {!isSlaveMode && (
        <Can module="membership">
          <NavigationMenuLinkItem
            name="Membership Plans"
            icon={IconCreditCard}
            pathPrefix="onefit"
            path="membership-plans"
          />
        </Can>
      )}
      {!isSlaveMode && (
        <Can module="membership">
          <NavigationMenuLinkItem
            name="Membership Purchases"
            icon={IconShoppingCart}
            pathPrefix="onefit"
            path="membership-purchases"
          />
        </Can>
      )}
      {!isSlaveMode && (
        <Can module="membership">
          <NavigationMenuLinkItem
            name="Purchase reports"
            icon={IconChartBar}
            pathPrefix="onefit"
            path="reports/membership-purchases"
          />
        </Can>
      )}
      {!isSlaveMode && (
        <Can module="transaction">
          <NavigationMenuLinkItem
            name="Credit Transactions"
            icon={IconCoins}
            pathPrefix="onefit"
            path="credit-transactions"
          />
        </Can>
      )}
      <Can module="provider">
        <NavigationMenuLinkItem
          name="Providers"
          icon={IconBuildingStore}
          pathPrefix="onefit"
          path="providers"
        />
      </Can>
      <Can module="provider">
        <NavigationMenuLinkItem
          name="Account Statement"
          icon={IconReportMoney}
          pathPrefix="onefit"
          path="providers/account-statement"
        />
      </Can>
      {!isSlaveMode && (
        <Can module="transaction">
          <NavigationMenuLinkItem
            name="Credit Consumption"
            icon={IconCoins}
            pathPrefix="onefit"
            path="credit-consumption"
          />
        </Can>
      )}
      {!isSlaveMode && (
        <Can module="banner">
          <NavigationMenuLinkItem
            name="Banners"
            icon={IconPhoto}
            pathPrefix="onefit"
            path="banners"
          />
        </Can>
      )}
      {!isSlaveMode && (
        <Can module="promoCode">
          <NavigationMenuLinkItem
            name="Promo Codes"
            icon={IconTicket}
            pathPrefix="onefit"
            path="promo-codes"
          />
        </Can>
      )}
    </>
  );
};
