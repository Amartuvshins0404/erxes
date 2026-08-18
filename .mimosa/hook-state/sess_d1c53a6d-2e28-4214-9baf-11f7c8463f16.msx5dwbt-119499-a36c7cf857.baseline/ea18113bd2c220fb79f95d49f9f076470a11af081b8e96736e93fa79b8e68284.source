import {
  IconBuilding,
  IconCaretRightFilled,
  IconCoins,
  IconContract,
  IconInvoice,
  IconShield,
  IconUser,
  IconCategory,
} from '@tabler/icons-react';
import {
  Collapsible,
  NavigationMenuLinkItem,
  Sidebar,
  Button,
  TextOverflowTooltip,
} from 'erxes-ui';

export const BlocktestNavigation = () => {
  return (
    <>
      <div className="relative">
        <span className="absolute bt:-top-6.5 bt:left-8 bg-sidebar font-semibold text-xs text-accent-foreground">
          Coverhill insurance modules
        </span>
      </div>
      <NavigationMenuLinkItem
        name="Clients"
        icon={IconUser}
        pathPrefix="blocktest"
        path="clients"
      />
      <NavigationMenuLinkItem
        name="Markets"
        icon={IconBuilding}
        pathPrefix="blocktest"
        path="markets"
      />
      <Collapsible className="group/collapsible">
        <Sidebar.Group className="p-0">
          <div className="w-full relative group/trigger hover:cursor-pointer">
            <Collapsible.Trigger asChild>
              <div className="w-full flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="px-2 flex min-w-0 justify-start"
                >
                  <IconShield className="text-accent-foreground shrink-0" />
                  <TextOverflowTooltip
                    className="font-sans font-semibold normal-case flex-1 min-w-0"
                    value="Risk"
                  />
                  <span className="ml-auto shrink-0">
                    <IconCaretRightFilled className="size-3 transition-transform group-data-[state=open]/collapsible:rotate-90 text-accent-foreground" />
                  </span>
                </Button>
                <div className="size-5 min-w-5 mr-2"></div>
              </div>
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content className="pt-1">
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <NavigationMenuLinkItem
                  name="Risk Groups"
                  className="pl-6 font-medium"
                  pathPrefix="blocktest"
                  icon={IconCategory}
                  path="risk-groups"
                />
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Collapsible.Content>
        </Sidebar.Group>
      </Collapsible>
      <NavigationMenuLinkItem
        name="Contracts"
        icon={IconContract}
        pathPrefix="blocktest"
        path="contracts"
      />
      <NavigationMenuLinkItem
        name="Claims"
        icon={IconCoins}
        pathPrefix="blocktest"
        path="claims"
      />
      <NavigationMenuLinkItem
        name="Payments"
        icon={IconInvoice}
        pathPrefix="blocktest"
        path="payments"
      />
    </>
  );
};
