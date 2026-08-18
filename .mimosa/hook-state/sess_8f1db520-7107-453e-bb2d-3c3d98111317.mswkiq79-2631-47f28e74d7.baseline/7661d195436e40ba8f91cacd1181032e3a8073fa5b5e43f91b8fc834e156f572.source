import { useForm } from 'react-hook-form';
import { AgencyGeneralInfoValues } from '../types/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agencyGeneralInfoSchema } from '../schema/form';

type Props = {
  defaultValues?: AgencyGeneralInfoValues;
};

export const useGeneralForm = ({ defaultValues }: Props) => {
  const form = useForm<AgencyGeneralInfoValues>({
    resolver: zodResolver(agencyGeneralInfoSchema),
    mode: 'onBlur',
    defaultValues,
  });

  return { form };
};
