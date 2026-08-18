import { InfoCard, InfoCardContent } from '@/block/components/card';
import { Editor, Label } from 'erxes-ui';
import { useState } from 'react';

export const ProjectDetailPolicies = () => {
  const [policies, setPolicies] = useState<string>('');
  return (
    <div className="p-8">
      <InfoCard title="Policies">
        <InfoCardContent>
          <div className="space-y-2">
            <Label>RESERVATION POLICY</Label>
            <Editor onChange={setPolicies} scope="project" />
          </div>
          <div className="space-y-2">
            <Label>LEASING POLICY</Label>
            <Editor onChange={setPolicies} scope="project" />
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
