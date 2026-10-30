import { IconSearch } from '@tabler/icons-react';
import { Input } from 'erxes-ui';

export const SearchArticlesInput = () => (
  <div className="flex h-10 w-full items-center gap-2 rounded-full bg-card px-4 text-card-foreground shadow-card">
    <IconSearch className="size-4 shrink-0 text-muted-foreground" />
    <Input
      type="search"
      placeholder="Search for help"
      aria-label="Search articles"
      className="h-auto min-w-0 flex-1 bg-transparent px-0 shadow-none focus-visible:shadow-none"
    />
  </div>
);
