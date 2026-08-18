import { useIsMatchingLocation, useSetHotkeyScope } from 'erxes-ui';
import { useEffect } from 'react';
import { BlockTestHotKeyScope, BlocktestPath } from './types';

export const BlocktestPageEffect = () => {
  const isMatchingLocation = useIsMatchingLocation();
  const setHotkeyScope = useSetHotkeyScope();

  useEffect(() => {
    if (isMatchingLocation(BlocktestPath.Clients)) {
      setHotkeyScope(BlockTestHotKeyScope.ClientsPage);
    }
    if (isMatchingLocation(BlocktestPath.Markets)) {
      setHotkeyScope(BlockTestHotKeyScope.MarketsPage);
    }
  }, [isMatchingLocation, setHotkeyScope]);

  return <></>;
};
