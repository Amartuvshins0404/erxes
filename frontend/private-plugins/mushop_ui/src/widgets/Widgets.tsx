import { useTranslation } from 'react-i18next';

export const Widgets = () => {
  const { t } = useTranslation('mushop');
  return <div>{t('Mushop Widget')}</div>;
};

export default Widgets;
