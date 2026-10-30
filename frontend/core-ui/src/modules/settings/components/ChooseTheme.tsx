import { IconCheck } from '@tabler/icons-react';
import { Label, RadioGroup, ThemeOption, themeState } from 'erxes-ui';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

const items = [
  {
    id: 'theme-light',
    value: 'light',
    label: 'Light',
    image: '/assets/ui-light.webp',
  },
  {
    id: 'theme-dark',
    value: 'dark',
    label: 'Dark',
    image: '/assets/ui-dark.webp',
  },
  {
    id: 'theme-system',
    value: 'system',
    label: 'System',
    image: '/assets/ui-system.webp',
  },
];

export function ChooseTheme() {
  const [theme, setTheme] = useAtom(themeState);
  const { t } = useTranslation('common', { keyPrefix: 'sidebar' });

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 text-sm font-medium text-foreground">
        {t('appearance')}
      </legend>
      <RadioGroup
        className="flex flex-wrap gap-4"
        value={theme}
        onValueChange={(value) => setTheme(value as ThemeOption)}
      >
        {items.map((item) => (
          <Label
            key={item.id}
            variant="peer"
            htmlFor={item.id}
            className="group flex cursor-pointer flex-col gap-2"
          >
            <RadioGroup.Item
              id={item.id}
              value={item.value}
              className="peer sr-only"
            />
            <img
              src={item.image}
              alt={item.label}
              width={140}
              height={70}
              className="overflow-hidden rounded-xl shadow-card transition-shadow peer-focus-visible:shadow-focus peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary peer-data-[state=checked]:ring-offset-2 peer-data-[state=checked]:ring-offset-background peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50"
            />
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground peer-data-[state=checked]:text-foreground">
              <IconCheck
                className="size-3.5 text-primary opacity-0 transition-opacity group-has-data-[state=checked]:opacity-100"
                aria-hidden="true"
              />
              {item.label}
            </span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
