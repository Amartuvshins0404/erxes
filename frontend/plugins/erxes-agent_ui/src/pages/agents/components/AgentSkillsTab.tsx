import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
  IconBook2,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  Combobox,
  Command,
  Empty,
  Popover,
  Spinner,
  toast,
} from 'erxes-ui';
import { MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import { MASTRA_AGENT } from '~/graphql/queries';
import { useSkillList } from '~/modules/skills/hooks/useSkillList';
import { SKILLS_PATH } from '~/modules/skills/constants';

/**
 * The agent's Skills tab. `agent.skills` is an allowlist matched (by name /
 * "category/name") against the shared, published skill library, so attaching is
 * adding a skill's name to that array and detaching is removing it. Skills stay
 * a shared library (managed under Settings → Skills); this tab only wires which
 * of them this agent may use.
 */
export const AgentSkillsTab = ({
  agentId,
  skills,
}: {
  agentId: string;
  skills: string[];
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Only published skills are attachable — drafts aren't reachable at runtime.
  const { skillsList, loading } = useSkillList({
    scope: 'all',
    status: 'published',
    searchValue: search,
  });

  const [updateAgent, { loading: saving }] = useMutation(MASTRA_AGENT_UPDATE, {
    refetchQueries: [{ query: MASTRA_AGENT, variables: { _id: agentId } }],
    awaitRefetchQueries: true,
    onError: (e) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const attached = new Set(skills);

  const persist = (next: string[]) =>
    updateAgent({ variables: { _id: agentId, doc: { skills: next } } });

  const attach = (name: string) => {
    if (attached.has(name)) return;
    persist([...skills, name]);
    setPickerOpen(false);
    setSearch('');
  };

  const detach = (name: string) => persist(skills.filter((s) => s !== name));

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
      <div className="flex items-center justify-end gap-2">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <Popover.Trigger asChild>
            <Button variant="outline" disabled={saving}>
              <IconBook2 /> Attach skill
            </Button>
          </Popover.Trigger>
          <Combobox.Content>
            <Command shouldFilter={false}>
              <Command.Input
                placeholder="Search skills…"
                value={search}
                onValueChange={setSearch}
              />
              <Command.List>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Spinner />
                  </div>
                ) : (
                  <Combobox.Empty>No published skills found.</Combobox.Empty>
                )}
                {skillsList.map((skill) => (
                  <Command.Item
                    key={skill._id}
                    value={skill.name}
                    disabled={attached.has(skill.name)}
                    onSelect={() => attach(skill.name)}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{skill.name}</span>
                      {skill.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {skill.description}
                        </span>
                      )}
                    </div>
                    {attached.has(skill.name) && (
                      <Badge variant="secondary" className="ml-auto">
                        Attached
                      </Badge>
                    )}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Combobox.Content>
        </Popover>
        <Button asChild>
          <Link to={`${SKILLS_PATH}/new`}>
            <IconPlus /> New skill
          </Link>
        </Button>
      </div>

      {skills.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Empty className="border border-dashed max-w-md w-full">
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconBook2 />
              </Empty.Media>
              <Empty.Title>No skills attached</Empty.Title>
              <Empty.Description>
                Attach published skills from the shared library so this agent can
                apply them, or create a new one under Settings → Skills.
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button
                variant="outline"
                onClick={() => setPickerOpen(true)}
                disabled={saving}
              >
                <IconBook2 /> Attach skill
              </Button>
            </Empty.Content>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="gap-1.5 py-1 pl-2.5 pr-1"
            >
              <span className="font-mono">{name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                disabled={saving}
                onClick={() => detach(name)}
                aria-label={`Detach ${name}`}
              >
                <IconX className="size-3.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
