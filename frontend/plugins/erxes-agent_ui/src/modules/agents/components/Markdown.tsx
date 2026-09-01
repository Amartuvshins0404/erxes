import { cn } from 'erxes-ui';
import ReactMarkdown, { type Components } from 'react-markdown';

/**
 * Wide markdown tables scroll sideways inside the transcript instead of
 * squashing every column into a phone width; a table narrower than the column
 * still fills it (`min-w-full`). The horizontal scroll is contained so a
 * fling at the edge of a table does not start navigating the transcript.
 */
const COMPONENTS: Components = {
  table: ({ children, className }) => (
    <div className="my-2 overflow-x-auto overscroll-x-contain">
      <table className={cn('w-max min-w-full text-[13px]', className)}>
        {children}
      </table>
    </div>
  ),
};

/**
 * Renders assistant text as markdown. LLM output routinely contains lists,
 * code, and emphasis; plain text rendering would mangle it. Styled through
 * element selectors because the workspace does not include the Tailwind
 * typography plugin.
 */
export const Markdown = ({ content }: { content: string }) => {
  return (
    <div
      className={[
        'max-w-none break-words text-[15px] leading-relaxed md:text-[17px] md:leading-7',
        'space-y-2',
        '[&_strong]:font-semibold',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
        '[&_hr]:my-4 [&_hr]:border-border',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        'sm:[&_ul]:space-y-1 sm:[&_ol]:space-y-1',
        '[&_h1]:my-2 [&_h1]:text-lg [&_h1]:font-semibold md:[&_h1]:text-xl',
        '[&_h2]:my-2 [&_h2]:text-lg [&_h2]:font-semibold md:[&_h2]:text-xl',
        '[&_h3]:my-1.5 [&_h3]:text-base [&_h3]:font-semibold md:[&_h3]:text-lg',
        '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted/60 [&_pre]:p-3 [&_pre]:text-[13px] md:[&_pre]:text-sm',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono',
        '[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono',
        '[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline',
        '[&_th]:border-b [&_th]:py-1.5 [&_th]:pr-3 [&_th]:text-left [&_th]:font-medium',
        '[&_td]:border-b [&_td]:py-1.5 [&_td]:pr-3',
      ].join(' ')}
    >
      <ReactMarkdown components={COMPONENTS}>{content}</ReactMarkdown>
    </div>
  );
};
