import { Form, Editor } from 'erxes-ui';
import { Control, FieldValues, Path, UseFormSetValue } from 'react-hook-form';
import { Block } from '@blocknote/core';

interface BtkEditorFieldProps<T extends FieldValues> {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  name: Path<T>;
  label: string;
  initialContent?: string;
  editorClassName?: string;
}

export const BtkEditorField = <T extends FieldValues>({
  control,
  setValue,
  name,
  label,
  initialContent,
  editorClassName,
}: BtkEditorFieldProps<T>) => {
  const handleEditorChange = async (value: string, editorInstance?: any) => {
    try {
      const btks: Block[] = JSON.parse(value);
      if (editorInstance?.btksToHTMLLossy) {
        const htmlContent = await editorInstance.btksToHTMLLossy(btks);
        setValue(name, htmlContent as any);
      } else {
        const htmlContent = btks
          .map((btk: Block) => {
            if (btk.type === 'paragraph' && btk.content) {
              const textContent = btk.content
                .map((item: any) => item.text || '')
                .join('');
              return textContent ? `<p>${textContent}</p>` : '';
            }
            if (btk.type === 'heading' && btk.content) {
              const textContent = btk.content
                .map((item: any) => item.text || '')
                .join('');
              const level = (btk.props as any)?.level || 1;
              return textContent ? `<h${level}>${textContent}</h${level}>` : '';
            }
            return '';
          })
          .filter(Boolean)
          .join('');

        setValue(name, htmlContent as any, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        });
      }
    } catch (error) {
      console.error(`Error processing editor content for field '${name}':`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        value: value?.substring(0, 200) + (value?.length > 200 ? '...' : ''),
        editorInstanceAvailable: !!editorInstance,
        hasBtksToHTMLLossy: !!editorInstance?.btksToHTMLLossy,
      });

      setValue(name, '' as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    }
  };

  const convertHTMLToBtks = (htmlContent: string): Block[] => {
    if (!htmlContent || htmlContent.trim() === '') {
      return [
        {
          id: crypto.randomUUID(),
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
            textAlignment: 'left',
          },
          content: [],
          children: [],
        },
      ];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const container = doc.body;

    const btks: Block[] = [];
    const children = Array.from(container.children);

    if (children.length === 0) {
      const textContent = container.textContent || container.innerText || '';
      if (textContent.trim()) {
        btks.push({
          id: crypto.randomUUID(),
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
            textAlignment: 'left',
          },
          content: [
            {
              type: 'text',
              text: textContent,
              styles: {},
            },
          ],
          children: [],
        });
      }
    } else {
      children.forEach((element) => {
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent || '';

        if (textContent.trim()) {
          let btkType = 'paragraph';
          const props: any = {
            textColor: 'default',
            backgroundColor: 'default',
            textAlignment: 'left',
          };

          if (tagName.match(/^h[1-6]$/)) {
            btkType = 'heading';
            props.level = parseInt(tagName.charAt(1));
          }

          btks.push({
            id: crypto.randomUUID(),
            type: btkType as 'paragraph' | 'heading',
            props,
            content: [
              {
                type: 'text',
                text: textContent,
                styles: {},
              },
            ],
            children: [],
          });
        }
      });
    }

    return btks.length > 0
      ? btks
      : [
          {
            id: crypto.randomUUID(),
            type: 'paragraph',
            props: {
              textColor: 'default',
              backgroundColor: 'default',
              textAlignment: 'left',
            },
            content: [],
            children: [],
          },
        ];
  };

  const formatInitialContent = (content?: string): string | undefined => {
    if (!content || content.trim() === '') {
      return undefined;
    }

    if (content.startsWith('[')) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return content;
        }
      } catch (e) {
        console.error('Failed to parse initial content as JSON:', e);
      }
    }

    if (content.includes('<') && content.includes('>')) {
      const btks = convertHTMLToBtks(content);
      return JSON.stringify(btks);
    }

    if (content.trim()) {
      const btks = convertHTMLToBtks(`<p>${content}</p>`);
      return JSON.stringify(btks);
    }

    return undefined;
  };

  return (
    <Form.Field
      control={control}
      name={name}
      render={() => (
        <Form.Item className="col-span-2">
          <Form.Label>{label}</Form.Label>
          <Form.Control>
            <Editor
              initialContent={formatInitialContent(initialContent)}
              onChange={handleEditorChange}
              className={editorClassName}
            />
          </Form.Control>
          <Form.Description>
            A detailed overview that tells the story, mission, and deeper
            context behind the news, company company or organization.
          </Form.Description>
          <Form.Message className="text-destructive" />
        </Form.Item>
      )}
    />
  );
};
