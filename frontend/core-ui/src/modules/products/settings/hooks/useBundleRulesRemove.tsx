import { useTranslation } from 'react-i18next';
import {
  MutationFunctionOptions,
  MutationHookOptions,
  useMutation,
} from '@apollo/client';
import { BUNDLE_RULES_REMOVE } from '../graphql/mutations/bundleRules';
import { useToast } from 'erxes-ui';

export const useBundleRulesRemove = (options?: MutationHookOptions) => {
  const { toast } = useToast();
  const { t } = useTranslation('product', { keyPrefix: 'bundle-rules' });
  const [_remove, { loading, error }] = useMutation(
    BUNDLE_RULES_REMOVE,
    options,
  );

  const removeBundleRules = (options?: MutationFunctionOptions) => {
    _remove({
      ...options,
      onError: (e) => {
        toast({
          title: t('error'),
          description: e?.message,
          variant: 'destructive',
        });
        options?.onError?.(e);
      },
      onCompleted: (data) => {
        toast({
          title: t('success'),
          description: t('rule-removed'),
          variant: 'default',
        });
        options?.onCompleted?.(data);
      },
    });
  };

  return {
    removeBundleRules,
    loading,
    error,
  };
};
