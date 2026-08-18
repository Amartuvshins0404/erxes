import { UploadButton, UploadCard } from '@/block/components/UploadCard';
import { useState } from 'react';

export const UnitDocument = () => {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [value2, setValue2] = useState<string | undefined>(undefined);
  return (
    <div className="p-8 grid grid-cols-2 gap-4">
      <UploadCard
        title="Ownership Certificate"
        value={value}
        acceptedFileTypes={['application/pdf']}
      >
        <div className="grid grid-cols-2 gap-2">
          <UploadButton value={value} />
        </div>
      </UploadCard>
      <UploadCard
        title="Contract"
        value={value2}
        acceptedFileTypes={['application/pdf']}
      >
        <div className="grid grid-cols-2 gap-2">
          <UploadButton value={value2} />
        </div>
      </UploadCard>
    </div>
  );
};
