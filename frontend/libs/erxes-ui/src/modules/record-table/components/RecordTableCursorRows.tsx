import { ComponentProps } from 'react';
import { EnumCursorDirection } from '../types/RecordTableCursorTypes';
import {
  RecordTableBackwardSkeleton,
  RecordTableForwardSkeleton,
} from './RecordTableCursor';
import { RecordTableRowList } from './RecordTableRowList';
import { RecordTableRowSkeleton } from './RecordTableRowSkeleton';

export const RecordTableCursorRows = ({
  handleFetchMore,
  loading,
  skeletonRows = 20,
  ...rowListProps
}: ComponentProps<typeof RecordTableRowList> & {
  handleFetchMore: (params: { direction: EnumCursorDirection }) => void;
  loading?: boolean;
  skeletonRows?: number;
}) => (
  <>
    <RecordTableBackwardSkeleton handleFetchMore={handleFetchMore} />
    {loading && <RecordTableRowSkeleton rows={skeletonRows} />}
    <RecordTableRowList {...rowListProps} />
    <RecordTableForwardSkeleton handleFetchMore={handleFetchMore} />
  </>
);
