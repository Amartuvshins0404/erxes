import { IconDeviceLaptop, IconMoon, IconSun } from '@tabler/icons-react';
import { ThemeOption, themeState, ToggleGroup, Tooltip } from 'erxes-ui';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

const isThemeOption = (value: string): value is ThemeOption =>
  value === 'light' || value === 'dark' || value === 'system';

export const ThemeSelector = () => {
  const [theme, setTheme] = useAtom(themeState);
  const { t } = useTranslation('organization');

  return (
    <div className="flex h-8 items-center gap-2 px-2 text-sm font-medium">
      {t('theme')}
      <Tooltip.Provider delayDuration={100}>
        <ToggleGroup
          className="ml-auto h-7 gap-0.5 rounded-full bg-muted p-0.5 text-muted-foreground"
          onValueChange={(value) => {
            if (value && isThemeOption(value)) {
              setTheme(value);
            }
          }}
          size="sm"
          type="single"
          value={theme}
        >
          <Tooltip>
            <ToggleGroup.Item
              asChild
              className="h-full min-w-7 rounded-full px-1.5 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
              value="light"
            >
              <Tooltip.Trigger>
                <IconSun />
              </Tooltip.Trigger>
            </ToggleGroup.Item>
            <Tooltip.Content alignOffset={4}>{t('light')}</Tooltip.Content>
          </Tooltip>
          <Tooltip>
            <ToggleGroup.Item
              asChild
              className="h-full min-w-7 rounded-full px-1.5 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
              value="dark"
            >
              <Tooltip.Trigger>
                <IconMoon />
              </Tooltip.Trigger>
            </ToggleGroup.Item>
            <Tooltip.Content alignOffset={4}>{t('dark')}</Tooltip.Content>
          </Tooltip>
          <Tooltip>
            <ToggleGroup.Item
              asChild
              className="h-full min-w-7 rounded-full px-1.5 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
              value="system"
            >
              <Tooltip.Trigger>
                <IconDeviceLaptop />
              </Tooltip.Trigger>
            </ToggleGroup.Item>
            <Tooltip.Content alignOffset={4}>{t('system')}</Tooltip.Content>
          </Tooltip>
        </ToggleGroup>
      </Tooltip.Provider>
    </div>
  );
};
