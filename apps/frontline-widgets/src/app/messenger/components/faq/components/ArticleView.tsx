import { useAtom, useAtomValue } from 'jotai';
import { connectionAtom, faqArticleIdAtom } from '../../../states';
import { useGetKnowledgeBaseTopicDetails } from '../../../hooks/useGetKnowledgeBaseTopicDetails';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { cn } from 'erxes-ui';

export const ArticleView = () => {
  const [connection] = useAtom(connectionAtom);
  const { messengerData } = connection.widgetsMessengerConnect;
  const { knowledgeBaseTopicId } = messengerData || {};
  const articleId = useAtomValue(faqArticleIdAtom);

  const { details } = useGetKnowledgeBaseTopicDetails({
    variables: { _id: knowledgeBaseTopicId },
    skip: !knowledgeBaseTopicId,
  });

  const allArticles = [
    ...(details?.parentCategories?.flatMap((c) => c.articles || []) ?? []),
    ...(details?.categories?.flatMap((c) => c.articles || []) ?? []),
  ];

  const article = allArticles.find((a) => a._id === articleId);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return '';
    }
  };

  if (!article) return null;

  const { title, content, modifiedDate } = article;

  return (
    <div className="flex flex-col bg-transparent overflow-hidden">
      <div className="p-5 pb-4 border-b">
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1">
          {title}
        </h1>
        {modifiedDate && (
          <span className="text-xs text-muted-foreground">
            Updated {formatDate(modifiedDate)}
          </span>
        )}
      </div>

      <div
        className={cn(
          'flex-1 px-5 py-4 text-sm text-foreground leading-relaxed',
          'prose prose-sm max-w-none',
          '[&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2',
          '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
          '[&_p]:mb-3 [&_p]:leading-relaxed',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3',
          '[&_li]:mb-1',
          '[&_strong]:font-semibold',
          '[&_a]:text-primary [&_a]:underline',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
          '[&_code]:bg-muted [&_code]:rounded-xs [&_code]:px-1 [&_code]:text-xs',
          '[&_pre]:bg-muted [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:overflow-x-auto',
        )}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || '') }}
      />
    </div>
  );
};
