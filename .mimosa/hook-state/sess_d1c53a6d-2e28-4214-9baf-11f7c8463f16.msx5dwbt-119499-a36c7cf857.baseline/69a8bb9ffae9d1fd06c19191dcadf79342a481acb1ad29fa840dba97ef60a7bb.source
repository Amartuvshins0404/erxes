import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';

const agentFormSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9]+$/, 'Only English letters and numbers allowed'),
});

export const useAgentForm = () => {
  const form = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
    },
  });
  return {
    form,
  };
};
