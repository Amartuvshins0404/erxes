import { IconMessageCircle } from '@tabler/icons-react';
import { useAtom, useAtomValue } from 'jotai';
import { messengerTabVariantAtom } from '../../states/tabs';
import React, { useMemo } from 'react';
import { ETabVariant, INavigationProviderProps } from './types';
import { NAVIGATION_MENU } from './constants';
import { TabsVariantContext, useTabsVariant } from './context';
import { cn } from 'erxes-ui';
import { useMessenger } from '../../hooks/useMessenger';
import { useConversations } from '../../hooks/useConversations';
import { AnimatePresence, motion } from 'motion/react';
import { hasKnowledgeBaseTopicAtom, hasTicketConfigAtom } from '../../states';

export const NavigationProvider: React.FC<INavigationProviderProps> = ({
  value,
  children,
}) => {
  const [, setVariant] = useAtom(messengerTabVariantAtom);

  React.useEffect(() => {
    if (value === 'fluid') setVariant(ETabVariant.FLUID);
    else setVariant(ETabVariant.PILL);
  }, [value]);

  const [variant] = useAtom(messengerTabVariantAtom);

  return (
    <TabsVariantContext.Provider value={{ variant }}>
      {children}
    </TabsVariantContext.Provider>
  );
};

export const FluidTabs = () => {
  const { activeTab, switchToTab } = useMessenger();
  const { conversations } = useConversations();
  const hasKnowledgeBase = useAtomValue(hasKnowledgeBaseTopicAtom);
  const hasTicketConfig = useAtomValue(hasTicketConfigAtom);

  const visibleMenu = useMemo(
    () =>
      NAVIGATION_MENU.filter((item) => {
        if (item.tab === 'faq') return hasKnowledgeBase;
        if (item.tab === 'ticket') return hasTicketConfig;
        return true;
      }),
    [hasKnowledgeBase, hasTicketConfig],
  );

  const totalUnreadCount = useMemo(
    () =>
      conversations.reduce((acc, conv) => {
        const lastMessage = conv.messages?.[conv.messages.length - 1];
        if (!lastMessage?.isCustomerRead) {
          const count = conv.messages?.filter(
            (msg) => !msg.isCustomerRead && msg.userId !== null,
          ).length;
          return acc + (count || 0);
        }
        return acc;
      }, 0),
    [conversations],
  );

  return (
    <nav className="px-1 py-1.5 flex-none bg-muted border-t border-border flex">
      <ul className="inline-flex items-center justify-center w-full mx-auto">
        {visibleMenu.map((item, ind) => {
          const Icon = item.Icon || IconMessageCircle;
          const isActive = activeTab === item.tab;
          const showBadge = item.tab === 'messages' && totalUnreadCount > 0;
          return (
            <li
              className="pt-2 pb-2.5 flex-1 relative"
              key={`${ind}-${item.label}`}
            >
              {isActive && (
                <motion.span
                  layoutId="fluid-active-bg"
                  className={cn(
                    {
                      'rounded-sm':
                        ind !== 0 || ind !== visibleMenu.length - 1,
                      'rounded-r-sm rounded-tl-sm rounded-bl-2xl': ind === 0,
                      'rounded-l-sm rounded-tr-sm rounded-br-2xl':
                        ind === visibleMenu.length - 1,
                    },
                    'absolute inset-x-1 inset-y-0 bg-primary/10',
                  )}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.button
                onClick={() => switchToTab(item.tab)}
                className={cn(
                  'relative w-full flex flex-col items-center justify-center gap-1 cursor-pointer',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                animate={{
                  scale: isActive ? 1 : 0.95,
                  opacity: isActive ? 1 : 0.7,
                }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="relative">
                  <Icon size={22} />
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="absolute -top-1 -right-1.5 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1"
                      >
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={cn(
                    {
                      'text-primary': isActive,
                      'text-muted-foreground': !isActive,
                    },
                    'text-xs font-normal',
                  )}
                >
                  {item.label}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export const PillTabs = () => {
  const { activeTab, switchToTab } = useMessenger();
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const { conversations } = useConversations();
  const hasKnowledgeBase = useAtomValue(hasKnowledgeBaseTopicAtom);
  const hasTicketConfig = useAtomValue(hasTicketConfigAtom);

  const visibleMenu = useMemo(
    () =>
      NAVIGATION_MENU.filter((item) => {
        if (item.tab === 'faq') return hasKnowledgeBase;
        if (item.tab === 'ticket') return hasTicketConfig;
        return true;
      }),
    [hasKnowledgeBase, hasTicketConfig],
  );

  const totalUnreadCount = useMemo(
    () =>
      conversations.reduce((acc, conv) => {
        const lastMessage = conv.messages?.[conv.messages.length - 1];
        if (!lastMessage?.isCustomerRead) {
          const count = conv.messages?.filter(
            (msg) => !msg.isCustomerRead && msg.userId !== null,
          ).length;
          return acc + (count || 0);
        }
        return acc;
      }, 0),
    [conversations],
  );

  return (
    <nav className="py-2 px-3 flex items-center justify-center bg-background flex-none">
      <ul
        className="inline-flex flex-none items-center w-auto bg-card/90 backdrop-blur-xl shadow-md rounded-full p-1.5"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {visibleMenu.map((item, ind) => {
          const Icon = item.Icon || IconMessageCircle;
          const isActive = activeTab === item.tab;
          const showLabel = isActive
            ? hoveredIndex === null || hoveredIndex === ind
            : hoveredIndex === ind;
          const showBadge = item.tab === 'messages' && totalUnreadCount > 0;

          return (
            <li key={`${ind}-${item.label}`} className="relative">
              {isActive && (
                <motion.span
                  layoutId="pill-active-bg"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.button
                onClick={() => switchToTab(item.tab)}
                onMouseEnter={() => setHoveredIndex(ind)}
                className={cn(
                  'relative flex items-center gap-1.5 px-2.5 py-2 rounded-full cursor-pointer group',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground transition-colors',
                )}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <div className="relative">
                  <Icon size={20} />
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        key="pill-badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="absolute -top-1 -right-1.5 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1"
                      >
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence initial={false}>
                  {showLabel && (
                    <motion.span
                      key={`label-${ind}`}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                      className={cn(
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground',
                        'text-xs font-medium whitespace-nowrap overflow-hidden block',
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export const NavigationBar = () => {
  const { variant } = useTabsVariant();
  return variant === ETabVariant.FLUID ? <FluidTabs /> : <PillTabs />;
};

export const Navigation = Object.assign(NavigationProvider, {
  Fluid: FluidTabs,
  Pill: PillTabs,
  Bar: NavigationBar,
});
