'use client';

import { type Tag, TagInput } from 'emblor';
import { cn } from 'erxes-ui/lib';
import { useState } from 'react';
import { handleStringArrayPaste } from '../utils/string-array';

export function StringArrayInput({
  value,
  onValueChange,
  id,
  placeholder,
  styleClasses,
  onBlur,
  splitOnPaste = false,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  id?: string;
  placeholder?: string;
  styleClasses?: {
    inlineTagsContainer?: string;
    input?: string;
    tag?: {
      body?: string;
      closeButton?: string;
    };
  };
  onBlur?: () => void;
  splitOnPaste?: boolean;
}) {
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  return (
    <TagInput
      activeTagIndex={activeTagIndex}
      placeholder={placeholder || 'Add a tag'}
      setActiveTagIndex={setActiveTagIndex}
      id={id}
      setTags={(newTags) => {
        onValueChange((newTags as Tag[]).map((tag) => tag.text as string));
      }}
      styleClasses={{
        inlineTagsContainer: cn(
          'h-auto min-h-8 flex-wrap gap-1 rounded-lg border-none bg-card p-1 shadow-button-outline outline-none transition-[box-shadow] ease-out focus-within:shadow-focus',
          styleClasses?.inlineTagsContainer,
        ),
        input: cn(
          'h-6 w-full min-w-20 bg-transparent px-2 shadow-none placeholder:text-muted-foreground',
          styleClasses?.input,
        ),
        tag: {
          body: cn(
            'relative h-6 rounded-full border-none bg-secondary ps-2.5 pe-6 text-xs font-medium text-secondary-foreground shadow-2xs hover:bg-secondary',
            styleClasses?.tag?.body,
          ),
          closeButton: cn(
            'absolute inset-y-0 end-0 flex size-6 rounded-full p-0 text-muted-foreground outline-none transition-colors hover:text-foreground',
            styleClasses?.tag?.closeButton,
          ),
        },
      }}
      tags={value.map((tag) => ({ id: tag, text: tag }))}
      onBlur={onBlur}
      inputProps={{
        onPaste: (event) =>
          splitOnPaste &&
          handleStringArrayPaste({ event, value, onValueChange }),
      }}
    />
  );
}
