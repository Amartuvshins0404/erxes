import { IconListCheck } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  recordTableCursorAtomFamily,
  ToggleGroup,
} from 'erxes-ui';
import { useSetAtom } from 'jotai';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BLOCK_FORMS } from '../constants/blockForms';

export const SubmissionBreadcrumb = () => {
  const { id } = useParams();
  const { pathname } = useLocation();

  const setCursor = useSetAtom(recordTableCursorAtomFamily(''));

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.List className="gap-1">
          <Breadcrumb.Item>
            <Button variant="ghost" asChild>
              <Link to="/blockadmin/form">
                <IconListCheck className="text-accent-foreground" />
                Form
              </Link>
            </Button>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <ToggleGroup type="single" value={pathname}>
            <ToggleGroup.Item
              value="/blockadmin/form/submissions"
              asChild
              onClick={() => setCursor('')}
            >
              <Link to="/blockadmin/form/submissions">Submissions</Link>
            </ToggleGroup.Item>
          </ToggleGroup>
          <Breadcrumb.Separator />
          <ToggleGroup type="single" value={pathname}>
            <ToggleGroup.Item
              value={`/blockadmin/form/submissions/${id}`}
              asChild
              onClick={() => setCursor('')}
            >
              <Link to={`/blockadmin/form/submissions/${id}`}>
                {BLOCK_FORMS[Number(id)].title}
              </Link>
            </ToggleGroup.Item>
          </ToggleGroup>
        </Breadcrumb.List>
      </Breadcrumb>
    </>
  );
};
