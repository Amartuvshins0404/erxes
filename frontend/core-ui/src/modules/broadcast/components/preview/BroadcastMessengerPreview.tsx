import { BroadcastEditor } from '../BroadcastEditor';

export const BroadcastMessengerPreview = () => {
  return (
    <div className="h-full p-10">
      <div className="h-full rounded-xl border bg-background py-8">
        <BroadcastEditor attribute />
      </div>
    </div>
  );
};
