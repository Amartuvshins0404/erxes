import { useForm } from 'react-hook-form';
import { TAgentForm } from '../types/member';
import { zodResolver } from '@hookform/resolvers/zod';
import { agentFormSchema } from '../schema/member';

export const useAgentForm = () => {
  const form = useForm<TAgentForm>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      city: '',
      district: '',
      description: '',
      facebookUrl: '',
      instagramUrl: '',
      linkedUrl: '',
      certificatePhotos: [],
    },
  });

  return {
    form,
  };
};
