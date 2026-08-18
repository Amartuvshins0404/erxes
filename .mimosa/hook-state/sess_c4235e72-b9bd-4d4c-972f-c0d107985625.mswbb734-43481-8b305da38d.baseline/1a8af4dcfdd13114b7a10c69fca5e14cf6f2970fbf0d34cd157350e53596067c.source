import { useState } from 'react';
import { Separator } from 'erxes-ui';
import { ListingKPI } from '~/modules/listing/components/ListingKPI';
import {
  ListingFilter,
  ListingFilterValue,
} from '~/modules/listing/components/ListingFilter';
import { ListingRecordTable } from '~/modules/listing/components/ListingRecordTable';

export const ListingIndexPage = () => {
  const [filter, setFilter] = useState<ListingFilterValue>({});

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ListingFilter filter={filter} onFilterChange={setFilter} />
      <ListingKPI />
      <Separator />
      <ListingRecordTable filter={filter} />
    </div>
  );
};
