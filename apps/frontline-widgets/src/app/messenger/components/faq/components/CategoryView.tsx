import { useAtom, useAtomValue } from 'jotai';
import {
  connectionAtom,
  faqArticleIdAtom,
  faqCategoryStackAtom,
} from '../../../states';
import { useGetKnowledgeBaseTopicDetails } from '../../../hooks/useGetKnowledgeBaseTopicDetails';
import { IKnowledgeBaseArticle } from '../../../types/knowledgeBase';
import { IconArrowRight, IconBook } from '@tabler/icons-react';
import { cn, Empty, IconComponent } from 'erxes-ui';
import { format } from 'date-fns';

export const CategoryView = () => {
  const [connection] = useAtom(connectionAtom);
  const { messengerData } = connection.widgetsMessengerConnect;
  const { knowledgeBaseTopicId } = messengerData || {};
  const categoryStack = useAtomValue(faqCategoryStackAtom);
  const currentCategoryId = categoryStack[categoryStack.length - 1];
  const [, setArticleId] = useAtom(faqArticleIdAtom);
  const [, setCategoryStack] = useAtom(faqCategoryStackAtom);

  const { details, categories } = useGetKnowledgeBaseTopicDetails({
    variables: { _id: knowledgeBaseTopicId },
    skip: !knowledgeBaseTopicId,
  });

  const currentCategory =
    details?.categories?.find((c) => c._id === currentCategoryId) ||
    details?.parentCategories?.find((c) => c._id === currentCategoryId);

  const subCategories =
    categories?.filter((c) => c.parentCategoryId === currentCategoryId) || [];

  const articles = currentCategory?.articles || [];

  const handleSubCategoryClick = (subCatId: string) => {
    setCategoryStack((prev) => [...prev, subCatId]);
  };

  const handleArticleClick = (article: IKnowledgeBaseArticle) => {
    setArticleId(article._id);
  };

  const formatDate = (dateStr: string) => {
    try {
      return `Updated ${format(new Date(dateStr), 'MMM yyyy')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="p-4 flex flex-col gap-2.5 relative">
      {subCategories.length > 0 && (
        <>
          {subCategories.map((subCat) => (
            <div
              key={subCat._id}
              className={cn(
                'group rounded-2xl bg-card shadow-card p-3.5 flex items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus',
              )}
              onClick={() => handleSubCategoryClick(subCat._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleSubCategoryClick(subCat._id)
              }
            >
              <span
                className="shrink-0 size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
                style={
                  details?.color
                    ? { backgroundColor: details.color }
                    : undefined
                }
              >
                <IconComponent
                  className="size-4"
                  name={subCat.icon || 'help-circle'}
                />
              </span>
              <span className="flex-1 overflow-hidden min-w-0">
                <h2 className="text-sm font-medium text-foreground">
                  {subCat.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {subCat.numOfArticles === 1
                    ? '1 article'
                    : `${subCat.numOfArticles} articles`}
                </span>
              </span>
              <span className="shrink-0">
                <IconArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          ))}
        </>
      )}

      {articles.length > 0 && (
        <div className={cn('flex flex-col gap-2')}>
          {subCategories.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground px-1 pt-2">
              Articles
            </span>
          )}
          {articles.map((article) => (
            <div
              key={article._id}
              className={cn(
                'group rounded-2xl bg-card shadow-card p-3.5 flex items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus',
              )}
              onClick={() => handleArticleClick(article)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleArticleClick(article)
              }
            >
              <span className="shrink-0 size-9 rounded-xl bg-muted flex items-center justify-center">
                <IconBook className="size-4 text-muted-foreground" />
              </span>
              <span className="flex-1 overflow-hidden min-w-0">
                <h2 className="text-sm font-medium text-foreground truncate">
                  {article.title}
                </h2>
                {article.modifiedDate && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(article.modifiedDate)}
                  </span>
                )}
              </span>
              <span className="shrink-0">
                <IconArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          ))}
        </div>
      )}

      {subCategories.length === 0 && articles.length === 0 && (
        <Empty className="rounded-2xl bg-card py-10 shadow-card">
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconBook />
            </Empty.Media>
            <Empty.Title>No articles yet</Empty.Title>
            <Empty.Description>
              This category does not have any published articles.
            </Empty.Description>
          </Empty.Header>
        </Empty>
      )}
    </div>
  );
};
