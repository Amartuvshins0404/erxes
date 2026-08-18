import { Resizable, ScrollArea } from 'erxes-ui';

import { Agents } from './Agents';
import { AgentContent } from './AgentContent';
import { SettingsContent, SettingsItem } from './SettingsContent';
import { useState } from 'react';

export const AgentDetailsLayout = () => {
  const [selectedId, setSelectedId] = useState<string | null>('main');

  const isSettings = selectedId?.startsWith('settings:');

  return (
    <Resizable.PanelGroup
      direction="horizontal"
      className="flex-1 overflow-hidden"
    >
      <Resizable.Panel
        minSize={20}
        defaultSize={20}
        className="hidden sm:flex min-w-80 max-w-lg"
      >
        <ScrollArea.Root className="w-full h-full overflow-hidden relative bg-sidebar">
          <ScrollArea.Viewport className="[&>div]:block!">
            <div className="py-3 px-4 flex flex-col gap-2 w-full overflow-hidden">
              <h4 className="text-sm font-medium text-muted-foreground">
                Agents
              </h4>
              <Agents selectedId={selectedId} setSelectedId={setSelectedId} />
              <h4 className="text-sm font-medium text-muted-foreground ">
                Settings
              </h4>
              <SettingsItem
                id="general"
                label="Settings"
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            </div>
          </ScrollArea.Viewport>

          <ScrollArea.Bar orientation="vertical" />
        </ScrollArea.Root>
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel minSize={20} defaultSize={70}>
        {isSettings ? (
          <SettingsContent selectedId={selectedId} />
        ) : (
          <AgentContent selectedId={selectedId} />
        )}
      </Resizable.Panel>
    </Resizable.PanelGroup>
  );
};
