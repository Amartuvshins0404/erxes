import { useTranslation } from 'react-i18next';

import type { IConnection, IConnectionType } from '../types';
import { getCategoryLabel } from '../utils/categories';
import { ConnectionRow } from './ConnectionRow';

interface IConnectionsListProps {
  connections: IConnection[];
  typesByName: Map<string, IConnectionType>;
  canManage: boolean;
  testingId: string | null;
  onTest: (connection: IConnection) => void;
  onEdit: (connection: IConnection) => void;
  onRemove: (connection: IConnection) => void;
}

const UNKNOWN_CATEGORY = 'other';

export const ConnectionsList = ({
  connections,
  typesByName,
  canManage,
  testingId,
  onTest,
  onEdit,
  onRemove,
}: IConnectionsListProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });

  const grouped = new Map<string, IConnection[]>();
  for (const connection of connections) {
    const category =
      typesByName.get(connection.type)?.category ?? UNKNOWN_CATEGORY;
    grouped.set(category, [...(grouped.get(category) ?? []), connection]);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <section key={category} className="flex flex-col gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">
            {getCategoryLabel(category, t)}
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((connection) => (
              <ConnectionRow
                key={connection._id}
                connection={connection}
                type={typesByName.get(connection.type)}
                canEdit={connection.scope === 'personal' || canManage}
                testing={testingId === connection._id}
                testDisabled={testingId !== null}
                onTest={onTest}
                onEdit={onEdit}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
