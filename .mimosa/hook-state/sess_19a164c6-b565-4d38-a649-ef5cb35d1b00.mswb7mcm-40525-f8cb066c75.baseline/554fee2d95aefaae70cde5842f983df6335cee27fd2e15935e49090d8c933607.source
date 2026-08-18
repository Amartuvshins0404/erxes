import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_SCHEDULE_TEMPLATE_CREATE,
  ONE_FIT_SCHEDULE_TEMPLATE_UPDATE,
  ONE_FIT_SCHEDULE_TEMPLATE_COPY_PREVIOUS_MONTH,
  ONE_FIT_SCHEDULE_TEMPLATES_REMOVE,
  ONE_FIT_SCHEDULE_EXCEPTION_CREATE,
  ONE_FIT_SCHEDULE_EXCEPTION_REMOVE,
  ONE_FIT_SCHEDULE_EXCEPTIONS_REMOVE,
} from '../graphql/scheduleMutations';
import {
  ONE_FIT_SCHEDULE_TEMPLATES,
  ONE_FIT_SCHEDULE_EXCEPTIONS,
} from '../graphql/scheduleQueries';

export function useCreateScheduleTemplate() {
  const [createScheduleTemplateMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_TEMPLATE_CREATE,
  );

  const createScheduleTemplate = (options: MutationFunctionOptions) => {
    return createScheduleTemplateMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_TEMPLATES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Schedule template created successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { createScheduleTemplate, loading };
}

export function useUpdateScheduleTemplate() {
  const [updateScheduleTemplateMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_TEMPLATE_UPDATE,
  );

  const updateScheduleTemplate = (options: MutationFunctionOptions) => {
    return updateScheduleTemplateMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_TEMPLATES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Schedule template updated successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { updateScheduleTemplate, loading };
}

export function useCopyPreviousMonthTemplate() {
  const [copyPreviousMonthMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_TEMPLATE_COPY_PREVIOUS_MONTH,
  );

  const copyPreviousMonth = (options: MutationFunctionOptions) => {
    return copyPreviousMonthMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_TEMPLATES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        const result = data?.oneFitScheduleTemplateCopyPreviousMonth;
        const count = result?.templates?.length ?? 0;
        const skipped = result?.skippedProviderIds ?? [];
        let description: string;
        if (count === 0 && skipped.length > 0) {
          description = `No templates copied — target month already has a schedule for: ${skipped.join(', ')}`;
        } else if (skipped.length > 0) {
          description = `${count} schedule template${count === 1 ? '' : 's'} copied. Skipped ${skipped.length} (target month already scheduled): ${skipped.join(', ')}`;
        } else {
          description = `${count} schedule template${count === 1 ? '' : 's'} copied successfully`;
        }
        toast({
          title: 'Success',
          description,
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { copyPreviousMonth, loading };
}

export function useRemoveScheduleTemplates() {
  const [removeScheduleTemplatesMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_TEMPLATES_REMOVE,
  );

  const removeScheduleTemplates = (ids: string[]) => {
    return removeScheduleTemplatesMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_TEMPLATES }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Schedule templates removed successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { removeScheduleTemplates, loading };
}

export function useCreateScheduleException() {
  const [createScheduleExceptionMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_EXCEPTION_CREATE,
  );

  const createScheduleException = (options: MutationFunctionOptions) => {
    return createScheduleExceptionMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_EXCEPTIONS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Schedule exception created successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { createScheduleException, loading };
}

export function useRemoveScheduleException() {
  const [removeScheduleExceptionMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_EXCEPTION_REMOVE,
  );

  const removeScheduleException = (id: string) => {
    return removeScheduleExceptionMutation({
      variables: { _id: id },
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_EXCEPTIONS }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Schedule exception removed successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { removeScheduleException, loading };
}

export function useRemoveScheduleExceptions() {
  const [removeScheduleExceptionsMutation, { loading }] = useMutation(
    ONE_FIT_SCHEDULE_EXCEPTIONS_REMOVE,
  );

  const removeScheduleExceptions = (ids: string[]) => {
    return removeScheduleExceptionsMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_SCHEDULE_EXCEPTIONS }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Schedule exceptions removed successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { removeScheduleExceptions, loading };
}



