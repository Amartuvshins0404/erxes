import { useEffect, useRef } from 'react';
import { Sidebar } from 'erxes-ui';

// Collapses the global app sidebar so voice mode owns the whole screen, and
// restores the prior state on exit. Mounted only while voice is active, so the
// useSidebar() context lookup never runs on provider-less routes (e.g. preview).
// Renders nothing.

export const VoiceStageTakeover = () => {
  const { open, setOpen } = Sidebar.useSidebar();
  const wasOpen = useRef(open);

  useEffect(() => {
    wasOpen.current = open;
    setOpen(false);
    return () => setOpen(wasOpen.current);
    // Mount/unmount only: capture state on enter, restore on leave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
