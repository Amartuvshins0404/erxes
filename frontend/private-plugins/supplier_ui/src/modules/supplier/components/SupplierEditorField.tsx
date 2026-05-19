import type React from 'react';
import { Form, Editor } from 'erxes-ui';
import { Block } from '@blocknote/core';
import { Control, UseFormSetValue } from 'react-hook-form';
import { z } from 'zod';
import { supplierProfileSchema } from '../constants/supplierProfileSchema';

interface SupplierEditorFieldProps {
  control: Control<z.infer<typeof supplierProfileSchema>>;
  setValue: UseFormSetValue<z.infer<typeof supplierProfileSchema>>;
  name: keyof z.infer<typeof supplierProfileSchema>;
  label: string;
  initialContent?: string;
}

export const SupplierEditorField: React.FC<SupplierEditorFieldProps> = ({
  control,
  setValue,
  name,
  label,
  initialContent,
}) => {
  const handleEditorChange = async (value: string, editorInstance?: any) => {
    try {
      const blocks: Block[] = JSON.parse(value);
      if (editorInstance?.blocksToHTMLLossy) {
        const htmlContent = await editorInstance.blocksToHTMLLossy(blocks);
        setValue(name, htmlContent);
      } else {
        const htmlContent = blocks
          .map((block: Block) => {
            if (block.type === 'paragraph' && block.content) {
              const textContent = block.content
                .map((item: any) => item.text || '')
                .join('');
              return textContent ? `<p>${textContent}</p>` : '';
            }
            if (block.type === 'heading' && block.content) {
              const textContent = block.content
                .map((item: any) => item.text || '')
                .join('');
              const level = (block.props as any)?.level || 1;
              return textContent ? `<h${level}>${textContent}</h${level}>` : '';
            }
            return '';
          })
          .filter(Boolean)
          .join('');

        setValue(name, htmlContent, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        });
      }
    } catch (error) {
      console.error(`Error processing editor content for field '${name}':`, {
        error: error instanceof Error ? error.message : String(error),
      });

      setValue(name, '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    }
  };

  const convertHTMLToBlocks = (htmlContent: string): Block[] => {
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

    const blocks: Block[] = [];
    const children = Array.from(container.children);

    if (children.length === 0) {
      const textContent = container.textContent || container.innerText || '';
      if (textContent.trim()) {
        blocks.push({
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
          let blockType = 'paragraph';
          const props: any = {
            textColor: 'default',
            backgroundColor: 'default',
            textAlignment: 'left',
          };

          if (tagName.match(/^h[1-6]$/)) {
            blockType = 'heading';
            props.level = parseInt(tagName.charAt(1));
          }

          blocks.push({
            id: crypto.randomUUID(),
            type: blockType as 'paragraph' | 'heading',
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

    return blocks.length > 0
      ? blocks
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
      } catch {}
    }

    if (content.includes('<') && content.includes('>')) {
      const blocks = convertHTMLToBlocks(content);
      return JSON.stringify(blocks);
    }

    if (content.trim()) {
      const blocks = convertHTMLToBlocks(`<p>${content}</p>`);
      return JSON.stringify(blocks);
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
            />
          </Form.Control>
          <Form.Message className="text-destructive" />
        </Form.Item>
      )}
    />
  );
};

