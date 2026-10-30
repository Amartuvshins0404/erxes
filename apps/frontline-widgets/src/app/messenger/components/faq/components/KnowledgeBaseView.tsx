import { useAtom, useAtomValue } from 'jotai';
import { useGetKnowledgeBaseTopicDetails } from '../../../hooks/useGetKnowledgeBaseTopicDetails';
import {
  connectionAtom,
  faqCategoryStackAtom,
  faqCurrentViewAtom,
} from '../../../states';
import { cn, Empty, IconComponent } from 'erxes-ui';
import { IconArrowRight, IconBook } from '@tabler/icons-react';
import { CategoryView } from './CategoryView';
import { ArticleView } from './ArticleView';

export const KnowledgeBaseView = () => {
  const [connection] = useAtom(connectionAtom);
  const { messengerData } = connection.widgetsMessengerConnect;
  const { knowledgeBaseTopicId } = messengerData || {};
  const { details, parentCategories, error } = useGetKnowledgeBaseTopicDetails({
    variables: { _id: knowledgeBaseTopicId },
    skip: !knowledgeBaseTopicId,
  });

  const currentView = useAtomValue(faqCurrentViewAtom);
  const [, setCategoryStack] = useAtom(faqCategoryStackAtom);

  const handleCategoryClick = (categoryId: string) => {
    setCategoryStack((prev) => [...prev, categoryId]);
  };

  if (currentView === 'category') return <CategoryView />;
  if (currentView === 'article') return <ArticleView />;

  if (error) {
    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconBook />
          </Empty.Media>
          <Empty.Title>{error.name}</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className={cn('px-4 flex flex-col gap-2.5 relative z-30')}>
      {parentCategories &&
        parentCategories.map((parent, index) => (
          <div
            key={parent._id}
            className={cn(
              { '-mt-8': index === 0 },
              'group rounded-2xl bg-card shadow-card p-3.5 flex items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus',
            )}
            onClick={() => handleCategoryClick(parent._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' && handleCategoryClick(parent._id)
            }
          >
            <span
              className="shrink-0 size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
              style={
                details?.color ? { backgroundColor: details.color } : undefined
              }
            >
              <IconComponent
                className="size-4"
                name={parent.icon || 'help-circle'}
              />
            </span>
            <span className="flex-1 overflow-hidden min-w-0">
              <h1 className="text-sm font-medium text-foreground">
                {parent.title}
              </h1>
              <p className="text-xs mt-0.5 line-clamp-2 text-muted-foreground">
                {parent.description}
              </p>
              <span className="text-xs text-muted-foreground">
                {parent.numOfArticles === 1
                  ? '1 article'
                  : `${parent.numOfArticles} articles`}
                {parent.childrens?.length
                  ? ` · ${parent.childrens.length} sections`
                  : ''}
              </span>
            </span>
            <span className="shrink-0">
              <IconArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        ))}
    </div>
  );
};
