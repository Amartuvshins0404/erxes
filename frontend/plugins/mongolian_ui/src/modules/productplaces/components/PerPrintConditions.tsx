import { Button } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { SelectStructureEntities } from 'ui-modules';

import { STOCK_PLACE_CAPABILITY } from '../constants';
import { Condition } from '../types';

type PrintCondition = Condition & {
  placeEntityId?: string;
  responsibleEntityId?: string;
};

type Props = {
  condition: PrintCondition;
  onChange: (id: string, condition: PrintCondition) => void;
  onRemove: (id: string) => void;
  onAddCondition?: () => void;
};

export const PerPrintConditions = ({
  condition,
  onChange,
  onRemove,
  onAddCondition,
}: Props) => {
  const { t } = useTranslation('mongolian');
  const onChangeConfig = (key: string, value: string) => {
    onChange(condition.id, { ...condition, [key]: value });
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <SelectStructureEntities.Root
            value={condition.placeEntityId || ''}
            capability={STOCK_PLACE_CAPABILITY}
            placeholder={t('set-place')}
            onValueChange={(placeEntityId) =>
              onChangeConfig(
                'placeEntityId',
                typeof placeEntityId === 'string' ? placeEntityId : '',
              )
            }
          />
        </div>
        <div>
          <SelectStructureEntities.Root
            value={condition.responsibleEntityId || ''}
            placeholder={t('set-responsible')}
            onValueChange={(responsibleEntityId) =>
              onChangeConfig(
                'responsibleEntityId',
                typeof responsibleEntityId === 'string'
                  ? responsibleEntityId
                  : '',
              )
            }
          />
        </div>
      </div>
      <div className="flex gap-2 h-8">
        <Button
          type="button"
          className="h-8"
          variant="outline"
          size="sm"
          onClick={() => onRemove(condition.id)}
        >
          ✕ {t('delete-condition')}
        </Button>
        {onAddCondition && (
          <Button
            type="button"
            className="h-8"
            variant="outline"
            size="sm"
            onClick={onAddCondition}
          >
            + {t('add-condition')}
          </Button>
        )}
      </div>
    </div>
  );
};
