import { useEffect } from 'react';
import '../styles.css';

export default function FloatingWidget() {
  useEffect(() => {
    const collapsibleMenus = document.querySelectorAll(
      '[data-sidebar="group"]',
    );

    if (collapsibleMenus.length > 0) {
      const lastMenu = collapsibleMenus[
        collapsibleMenus.length - 1
      ] as HTMLElement | null;

      if (lastMenu) lastMenu.style.display = 'none';
    }
  }, []);
  return null;
}
