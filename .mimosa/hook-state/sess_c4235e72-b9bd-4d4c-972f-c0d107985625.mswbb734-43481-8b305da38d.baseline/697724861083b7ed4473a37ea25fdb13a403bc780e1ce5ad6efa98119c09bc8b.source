import { useCompanyList } from '../hooks/useCompanyList';
import { Button, cn, Input, Sidebar, Spinner } from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from '@tabler/icons-react';
import { useState } from 'react';

export const BtkAdminCompanySidebar = ({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) => {
  const { companies, loading } = useCompanyList(true);
  const { id } = useParams();
  const [search, setSearch] = useState('');

  const filtered = companies?.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r flex-none transition-all duration-200 overflow-hidden',
        open ? 'w-[269px]' : 'w-10',
      )}
    >
      <div className={cn('flex p-1', open ? 'justify-end' : 'justify-center')}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          {open ? <IconLayoutSidebarLeftCollapse /> : <IconLayoutSidebarLeftExpand />}
        </Button>
      </div>
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <div className="px-3 pt-2 pb-2 flex-none">
          <Input
            placeholder="Хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Sidebar.GroupLabel className="px-6 pt-3 pb-5 flex-none">Компаниуд</Sidebar.GroupLabel>
        <div className="flex-1 overflow-auto">
          <Sidebar collapsible="none" className="border-r-0 w-full">
            <Sidebar.Group className="pt-0">
              <Sidebar.GroupContent>
                <Sidebar.Menu>
                  {loading ? (
                    <Spinner containerClassName="py-4" />
                  ) : (
                    filtered?.map((company) => (
                      <Sidebar.MenuItem key={company._id}>
                        <Sidebar.MenuButton isActive={id === company._id} asChild>
                          <Link to={`/btkadmin/companies/${company._id}`}>
                            {company.name || 'Нэргүй'}
                          </Link>
                        </Sidebar.MenuButton>
                      </Sidebar.MenuItem>
                    ))
                  )}
                </Sidebar.Menu>
              </Sidebar.GroupContent>
            </Sidebar.Group>
          </Sidebar>
        </div>
      </div>
    </div>
  );
};
