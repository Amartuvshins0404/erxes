import { Block } from '@blocknote/core';
import { Editor, Form } from 'erxes-ui';
import type React from 'react';
import { Control } from 'react-hook-form';
import { z } from 'zod';
import { developerInfoSchema } from '../constants/developerInfoSchema';

interface BlockEditorFieldProps {
  control: Control<z.infer<typeof developerInfoSchema>>;
  name: keyof z.infer<typeof developerInfoSchema>;
  label: string;
  initialContent?: string;
}

export const BlockEditorField: React.FC<BlockEditorFieldProps> = ({
  control,
  name,
  label,
  initialContent,
}) => {
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
      } catch (e) {
        console.error('Failed to parse initial content as JSON:', e);
      }
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
      name={name as keyof z.infer<typeof developerInfoSchema>}
      render={() => (
        <Form.Item className="col-span-2">
          <Form.Label>{label}</Form.Label>
          <Form.Control>
            <Editor
              readonly
              initialContent={formatInitialContent(initialContent)}
              onChange={() => {}}
            />
          </Form.Control>
          <Form.Description>
            A detailed overview that tells the story, mission, and deeper
            context behind the project, developer company or organization.
          </Form.Description>
          <Form.Message className="text-destructive" />
        </Form.Item>
      )}
    />
  );
};
