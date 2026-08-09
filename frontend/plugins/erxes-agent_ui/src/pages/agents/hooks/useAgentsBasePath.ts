import { useLocation } from 'react-router-dom';
import { resolveAgentsBasePath } from '../utils';

export const useAgentsBasePath = () =>
  resolveAgentsBasePath(useLocation().pathname);
