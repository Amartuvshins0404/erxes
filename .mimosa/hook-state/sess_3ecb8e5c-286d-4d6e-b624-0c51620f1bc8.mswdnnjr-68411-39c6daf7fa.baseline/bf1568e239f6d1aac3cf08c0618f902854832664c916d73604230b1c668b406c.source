import { useCarMutations } from './useCarMutations';
import { propertiesDataToCustomFieldsData } from '~/lib/customFields';

export const useCarCustomFieldEdit = () => {
  const { carsEdit, loading } = useCarMutations();

  return {
    mutate: (
      variables: {
        _id: string;
        propertiesData?: Record<string, unknown>;
      } & Record<string, unknown>,
    ) => {
      const { propertiesData, ...rest } = variables;

      return carsEdit({
        // Shared properties UI mutates via `propertiesData`; car_api expects `customFieldsData`.
        variables: {
          ...rest,
          customFieldsData: propertiesDataToCustomFieldsData(propertiesData),
        },
      });
    },
    loading,
  };
};
