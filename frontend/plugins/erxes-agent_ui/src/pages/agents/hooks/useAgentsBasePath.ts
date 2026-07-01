import { useLocation } from 'react-router-dom';
import { resolveAgentsBasePath } from '../utils';

/**
 * Agent pages mount in two shells — the AI-Agents console (`/erxes-agent`) and
 * generic Settings (`/settings/erxes-agent`). Resolve the agents base for the
 * shell the user is currently in so create/edit navigation and breadcrumbs stay
 * inside that shell instead of jumping between the two.
 */
export const useAgentsBasePath = (): string =>
  resolveAgentsBasePath(useLocation().pathname);
