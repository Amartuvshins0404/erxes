import { useMemo } from 'react';
import { IconBulb, IconPinFilled } from '@tabler/icons-react';
import { IdentityCell } from '~/components/RecordTableShared';
import { ILearningRow } from '../types';

export const LearningStatementCell = ({
  learning,
  setSelected,
}: {
  learning: ILearningRow;
  setSelected: (item: ILearningRow) => void;
}) => {
  const name = useMemo(
    () => (
      <button
        type="button"
        onClick={() => setSelected(learning)}
        className="text-left font-medium hover:underline line-clamp-1 cursor-pointer"
      >
        {learning.statement || 'Untitled'}
      </button>
    ),
    [learning, setSelected],
  );
  return (
    <IdentityCell
      icon={learning.pinned ? IconPinFilled : IconBulb}
      tone={learning.pinned ? 'primary' : 'muted'}
      name={name}
    />
  );
};
