import { IWidgetUiOptions } from '../app/messenger/types/connection';

interface OKLCHColor {
  lightness: number;
  chroma: number;
  hue: number;
}

const LIGHT_FOREGROUND = 'oklch(0.99 0 0)';
const DARK_FOREGROUND = 'oklch(0.2 0.008 286)';

const HEX_PATTERN = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const isHexColor = (value: string): boolean => HEX_PATTERN.test(value.trim());

const expandHex = (hex: string): string => {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return clean;
};

const toLinear = (channel: number): number =>
  channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);

const hexToLinearRgb = (hex: string): [number, number, number] => {
  const clean = expandHex(hex);
  return [
    toLinear(Number.parseInt(clean.slice(0, 2), 16) / 255),
    toLinear(Number.parseInt(clean.slice(2, 4), 16) / 255),
    toLinear(Number.parseInt(clean.slice(4, 6), 16) / 255),
  ];
};

const hexToOklch = (hex: string): OKLCHColor => {
  const [r, g, b] = hexToLinearRgb(hex);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;

  return {
    lightness,
    chroma: Math.sqrt(a * a + bAxis * bAxis),
    hue: hue < 0 ? hue + 360 : hue,
  };
};

const oklchToString = ({ lightness, chroma, hue }: OKLCHColor): string =>
  `oklch(${lightness.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(2)})`;

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToLinearRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const toCssColor = (value: string): string =>
  isHexColor(value) ? oklchToString(hexToOklch(value)) : value.trim();

const readableForeground = (background: string): string => {
  if (!isHexColor(background)) {
    return LIGHT_FOREGROUND;
  }
  return relativeLuminance(background) > 0.5
    ? DARK_FOREGROUND
    : LIGHT_FOREGROUND;
};

const root = (): HTMLElement => document.documentElement;

const setProperty = (property: string, value: string): void => {
  root().style.setProperty(property, value);
};

const removeProperty = (property: string): void => {
  root().style.removeProperty(property);
};

export const applyPrimaryColor = (
  primary?: string,
  foreground?: string,
): void => {
  if (!primary?.trim()) {
    removeProperty('--primary');
    removeProperty('--primary-foreground');
    removeProperty('--ring');
    return;
  }

  const primaryColor = toCssColor(primary);

  setProperty('--primary', primaryColor);
  setProperty('--ring', primaryColor);
  setProperty(
    '--primary-foreground',
    foreground?.trim() ? toCssColor(foreground) : readableForeground(primary),
  );
};

const applyUrlProperty = (property: string, url?: string): void => {
  if (url) {
    setProperty(property, `url(${url})`);
  } else {
    removeProperty(property);
  }
};

export const applyUiOptionsToTailwind = (uiOptions: IWidgetUiOptions): void => {
  if (!uiOptions) return;

  applyPrimaryColor(uiOptions.primary?.DEFAULT, uiOptions.primary?.foreground);
  applyUrlProperty('--widget-logo', uiOptions.logo);
  applyUrlProperty('--widget-launcher-logo', uiOptions.launcherLogo);

  if (uiOptions.backgroundColor?.trim()) {
    setProperty('--color-hero', toCssColor(uiOptions.backgroundColor));
  } else {
    removeProperty('--color-hero');
  }
};

export const resetTailwindToDefaults = (): void => {
  [
    '--primary',
    '--primary-foreground',
    '--ring',
    '--widget-logo',
    '--widget-launcher-logo',
    '--color-hero',
  ].forEach(removeProperty);
};
