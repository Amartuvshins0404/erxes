import { PostStatus } from '../types/post';

export const POSTS_CURSOR_SESSION_KEY = 'oroltsoo-posts-cursor';

export const POSTS_PER_PAGE = 20;

export const POST_STATUS_OPTIONS: {
  value: PostStatus;
  label: string;
  badge: 'secondary' | 'success' | 'warning';
}[] = [
  { value: 'draft', label: 'Ноорог', badge: 'secondary' },
  { value: 'published', label: 'Нийтэлсэн', badge: 'success' },
  { value: 'archived', label: 'Архивласан', badge: 'warning' },
];
