import { BtkCompanyCard } from './BtkCompanyCard';
import { useCompanyList } from '../hooks/useCompanyList';
import { Spinner } from 'erxes-ui';

export const BtkCompanyList = () => {
  const { companies, loading } = useCompanyList();
  if (loading) {
    return <Spinner containerClassName="blk:py-32" />;
  }

  return (
    <div className="grid grid-cols-1 blk:lg:grid-cols-2 blk:xl:grid-cols-3 gap-6 p-8">
      {companies?.map((companies) => (
        <BtkCompanyCard key={companies._id} {...companies} />
      ))}
    </div>
  );
};
