import { Marker } from './bot-marker';

export function BotSeparator({ content }: { content: string }) {
  return (
    <Marker variant={'separator'}>
      <Marker.Content className="text-xs text-muted-foreground font-medium">
        {content}
      </Marker.Content>
    </Marker>
  );
}
