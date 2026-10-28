import { renderHook } from '@testing-library/react';
import { useMultiQueryState } from 'erxes-ui';
import {
  executionFilterKeys,
  useJobExecutionFilters,
} from '../useJobExecutionFilters';

jest.mock('erxes-ui', () => ({ useMultiQueryState: jest.fn() }));

test('all execution filters remain URL-owned and blanks normalize to undefined', () => {
  jest.mocked(useMultiQueryState).mockReturnValue([
    {
      searchValue: ' ',
      status: 'posted',
      jobId: ' job ',
      jobName: ' name ',
      inputProductId: 'raw',
      outputProductId: 'finished',
      laborCostName: 'labour',
      overheadCostName: 'power',
      inputAccountId: 'ia',
      inputPlaceEntityId: 'ib',
      outputAccountId: 'oa',
      outputPlaceEntityId: 'ob',
    },
    jest.fn(),
  ] as never);
  const { result } = renderHook(() => useJobExecutionFilters());
  expect(useMultiQueryState).toHaveBeenCalledWith([...executionFilterKeys]);
  expect(result.current).toEqual({
    searchValue: undefined,
    status: 'posted',
    jobId: 'job',
    jobName: 'name',
    inputProductId: 'raw',
    outputProductId: 'finished',
    laborCostName: 'labour',
    overheadCostName: 'power',
    inputAccountId: 'ia',
    inputPlaceEntityId: 'ib',
    outputAccountId: 'oa',
    outputPlaceEntityId: 'ob',
  });
});
