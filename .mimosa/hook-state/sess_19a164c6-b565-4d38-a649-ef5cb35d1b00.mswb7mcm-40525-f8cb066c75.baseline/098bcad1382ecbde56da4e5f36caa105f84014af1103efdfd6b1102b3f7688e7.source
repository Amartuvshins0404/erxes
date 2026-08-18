import { Button, Dialog } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { BtkCompanyInfoForm } from './BtkCompanyInfo';
import { z } from 'zod';
import { companyInfoSchema } from '@/btk/constants/companyInfoSchema';
import { ADDRESS_CITY } from '~/modules/news/constants/address';

export const CreateCompany = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <IconPlus />
          Create Company
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <Dialog.Header className="sticky top-0 bg-background z-10 border-b">
          <Dialog.Title>Create Company</Dialog.Title>
        </Dialog.Header>
        <div className="p-4">
          <CreateCompanyForm onClose={() => setOpen(false)} />
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

const CreateCompanyForm = ({ onClose }: { onClose: () => void }) => {
  const emptyCompany: z.infer<typeof companyInfoSchema> = {
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    website: '',
    email: '',
    primaryPhone: '',
    phones: [],
    dateFounded: '',
    about: '',
    address: {
      city: ADDRESS_CITY[0],
      district: '',
      address: '',
    },
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    },
  };

  return (
    <BtkCompanyInfoForm companyInfo={emptyCompany} isCreate onClose={onClose} />
  );
};
