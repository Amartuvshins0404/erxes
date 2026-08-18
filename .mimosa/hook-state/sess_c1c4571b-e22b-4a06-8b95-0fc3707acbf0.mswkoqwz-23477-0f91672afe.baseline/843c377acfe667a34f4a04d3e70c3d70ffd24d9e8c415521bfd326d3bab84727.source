import { cn, useQueryState } from 'erxes-ui';
import { UNIT_SALE_STATUS } from '@/unit/constants/unit';
import { IUnit } from '@/unit/types/unitType';

export const StackingUnitItem = ({ number, size, _id, status }: IUnit) => {
  const [, setUnitId] = useQueryState<string>('unitId');

  return (
    <div
      key={number}
      className={cn('ba:size-28 flex-none overflow-hidden min-w-px bgborder')}
      onClick={() => setUnitId(_id)}
      style={{
        // width: `${Math.max(size * 4 - 12, 0)}px`,
        backgroundColor:
          UNIT_SALE_STATUS[
            (status as keyof typeof UNIT_SALE_STATUS) || 'available'
          ]?.color,
      }}
    >
      <div className="p-3">
        <div className="font-bold mb-4">{number}</div>

        <div className="text-xs">{size} m²</div>
        <div className="text-xs">
          {
            UNIT_SALE_STATUS[
              (status as keyof typeof UNIT_SALE_STATUS) || 'available'
            ]?.mn
          }
        </div>
      </div>
    </div>
  );
};
