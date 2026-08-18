export type EventStatus = 'draft' | 'published';

export interface MtoEventCategory {
  _id?: string;
  name?: { en?: string; mn?: string };
}

export interface MtoEvent {
  _id: string;
  title?: { en?: string; mn?: string };
  description?: { en?: string; mn?: string };
  image?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  categoryIds?: string[];
  categories?: MtoEventCategory[];
  status?: EventStatus;
  isActive?: boolean;
  createdAt?: string;
  modifiedAt?: string;
}
