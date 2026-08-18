import { BtkCompanyCard } from './BtkCompanyCard';
import { useCompanyList } from '../hooks/useCompanyList';
import { Input, Spinner } from 'erxes-ui';
import { useState } from 'react';

export const BtkCompanyList = () => {
  const { companies, loading } = useCompanyList();
  const [search, setSearch] = useState('');

  const filtered = companies?.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <Spinner containerClassName="blk:py-32" />;
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      <Input
        placeholder="Хайх..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid grid-cols-1 blk:lg:grid-cols-2 blk:xl:grid-cols-3 gap-6">
        {filtered?.map((company) => (
          <BtkCompanyCard key={company._id} {...company} />
        ))}
      </div>
    </div>
  );
};
