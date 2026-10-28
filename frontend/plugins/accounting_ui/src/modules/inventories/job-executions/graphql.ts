import { gql } from '~/gql';

export const executionFields = gql(`
  fragment AccountingJobExecutionFields on JobExecution {
    _id date description status parentId ptrId error
    inputAccountId inputPlaceEntityId
    outputAccountId outputPlaceEntityId
    jobs {
      _id jobId jobName quantity
      inputs { productId uom quantity costRatio }
      outputs { productId uom quantity costRatio }
      laborCosts { name accountId amount }
      overheadCosts { name accountId amount }
    }
  }
`);
export const GET_EXECUTIONS = gql(`
  query AccountingJobExecutions(
    $searchValue: String, $status: String, $jobId: String, $jobName: String,
    $inputProductId: String, $outputProductId: String,
    $laborCostName: String, $overheadCostName: String,
    $inputAccountId: String, $inputPlaceEntityId: String,
    $outputAccountId: String, $outputPlaceEntityId: String,
    $page: Int, $perPage: Int
  ) {
    jobExecutions(
      searchValue: $searchValue, status: $status, jobId: $jobId, jobName: $jobName,
      inputProductId: $inputProductId, outputProductId: $outputProductId,
      laborCostName: $laborCostName, overheadCostName: $overheadCostName,
      inputAccountId: $inputAccountId, inputPlaceEntityId: $inputPlaceEntityId
      outputAccountId: $outputAccountId, outputPlaceEntityId: $outputPlaceEntityId
      page: $page, perPage: $perPage
    ) {
      rows { ...AccountingJobExecutionFields }
      totalCount
    }
  }
`);
export const SAVE_EXECUTION = gql(`
  mutation AccountingJobExecutionSave($_id: String, $input: JobExecutionInput!) {
    jobExecutionSave(_id: $_id, input: $input) { ...AccountingJobExecutionFields }
  }
`);
export const POST_EXECUTION = gql(`
  mutation AccountingJobExecutionPost($_id: String!) {
    jobExecutionPost(_id: $_id) { ...AccountingJobExecutionFields }
  }
`);
export const UNDO_EXECUTION = gql(`
  mutation AccountingJobExecutionUndo($_id: String!) {
    jobExecutionUndo(_id: $_id) { ...AccountingJobExecutionFields }
  }
`);
export const REMOVE_EXECUTION = gql(`
  mutation AccountingJobExecutionRemove($_id: String!) {
    jobExecutionRemove(_id: $_id)
  }
`);
