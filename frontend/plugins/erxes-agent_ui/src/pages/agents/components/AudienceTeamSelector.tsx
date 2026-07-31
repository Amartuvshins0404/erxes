import { useState } from 'react';
import { Combobox, Command, Popover } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import type { AudienceTeamOption } from '../graphql/access';

export const AudienceTeamSelector = ({
  teams,
  value,
  onChange,
  loading,
}: {
  teams: AudienceTeamOption[];
  value: string[];
  onChange: (teamIds: string[]) => void;
  loading?: boolean;
}) => {
  const { t } = useTranslation('erxes-agent');
  const [open, setOpen] = useState(false);
  const selectedNames = teams
    .filter((team) => value.includes(team._id))
    .map((team) => team.name)
    .join(', ');

  const toggleTeam = (teamId: string) => {
    onChange(
      value.includes(teamId)
        ? value.filter((selectedId) => selectedId !== teamId)
        : [...value, teamId],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger className="w-full">
        <Combobox.Value
          value={selectedNames}
          placeholder={t('agent-settings-audience-teams-placeholder')}
          loading={loading && Boolean(value.length) && !teams.length}
        />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input
            placeholder={t('agent-settings-audience-search-teams')}
          />
          <Command.List>
            <Combobox.Empty loading={loading} />
            {teams.map((team) => (
              <Command.Item
                key={team._id}
                value={`${team.name} ${team.description ?? ''}`}
                onSelect={() => toggleTeam(team._id)}
              >
                <span className="min-w-0 flex-1 truncate">{team.name}</span>
                <Combobox.Check checked={value.includes(team._id)} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
