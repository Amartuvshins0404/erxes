import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { ProviderIcon } from '@/agent/components/ProviderIcon';

import type { IConnectionType } from '../types';
import { getCategoryLabel } from '../utils/categories';

interface IConnectionTypeGridProps {
  types: IConnectionType[];
  selected?: string;
  onSelect: (type: IConnectionType) => void;
}

export const ConnectionTypeGrid = ({
  types,
  selected,
  onSelect,
}: IConnectionTypeGridProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const categories = Array.from(new Set(types.map((type) => type.category)));

  return (
    <div className="flex flex-col gap-5">
      {categories.map((category) => (
        <section key={category} className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            {getCategoryLabel(category, t)}
          </h3>
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            role="group"
            aria-label={getCategoryLabel(category, t)}
          >
            {types
              .filter((type) => type.category === category)
              .map((type) => {
                const isSelected = type.type === selected;

                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => onSelect(type)}
                    aria-pressed={isSelected}
                    className={`relative flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <ProviderIcon provider={type.type} className="size-9" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">
                        {type.label}
                      </span>
                      {type.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {type.description}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <IconCheck
                        className="absolute right-2.5 top-2.5 size-4 text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
};
