import { BtkCompanyInfo } from '@/btk/components/BtkCompanyInfo';
import { BtkAdminCompanySidebar } from '@/btk/components/BtkAdminCompanySidebar';
import { useState } from 'react';

export const CompanyInfoPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-auto overflow-hidden">
      <BtkAdminCompanySidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-col h-full overflow-auto flex-1">
        <BtkCompanyInfo />
      </div>
    </div>
  );
};
