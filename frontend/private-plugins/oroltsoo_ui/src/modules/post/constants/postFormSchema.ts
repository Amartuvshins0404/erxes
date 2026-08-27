import { z } from 'zod';

export const postFormSchema = z.object({
  title: z.string().trim().min(1, 'Гарчгийг оруулна уу'),
  excerpt: z.string().trim(),
  content: z.string(),
  coverImage: z.string().trim(),
  tags: z.array(z.string().trim().min(1)),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.date().nullable(),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

export const EMPTY_POST_FORM_VALUES: PostFormValues = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: [],
  status: 'draft',
  publishedAt: null,
};
