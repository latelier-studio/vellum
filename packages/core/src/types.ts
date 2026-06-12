/**
 * OKLCH color tuple. L: 0..1, C: 0..0.4, H: 0..360.
 * alpha optional, 0..1.
 */
export type OKLCH = {
  l: number;
  c: number;
  h: number;
  alpha?: number;
};

export type ChromeId = 'minimal' | 'brutalist' | 'editorial' | 'dense';
export type ColorScheme = 'light' | 'dark' | 'auto';
export type Density = 'compact' | 'comfortable' | 'airy';
export type ShadowStyle = 'flat' | 'soft' | 'hard';
export type TypeScale =
  | 'minor-second'
  | 'major-second'
  | 'minor-third'
  | 'major-third'
  | 'perfect-fourth'
  | 'augmented-fourth'
  | 'perfect-fifth'
  | number;

export type NormalizedTokens = {
  color: {
    bg: OKLCH;
    fg: OKLCH;
    border: OKLCH;
    muted: OKLCH;
    'muted-fg': OKLCH;
    accent: OKLCH;
    'accent-fg': OKLCH;
    'accent-hover'?: OKLCH;
    'accent-active'?: OKLCH;
    'accent-disabled'?: OKLCH;
    'focus-ring'?: OKLCH;
    danger?: OKLCH;
    success?: OKLCH;
    warning?: OKLCH;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  type: {
    display: { family: string; weight: number };
    body: { family: string; weight: number };
    mono: { family: string };
    scale: TypeScale;
  };
  space: {
    base: 4 | 8;
    density: Density;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    style: ShadowStyle;
  };
  motion: {
    duration: { fast: string; base: string; slow: string };
    easing: string;
  };
  meta: {
    name?: string;
    chrome: ChromeId;
    colorScheme: ColorScheme;
  };
};

/**
 * Partial input that any adapter may produce. Derivation engine fills the rest.
 */
export type PartialTokens = {
  color?: Partial<NormalizedTokens['color']>;
  radius?: Partial<NormalizedTokens['radius']> & { base?: string };
  type?: Partial<{
    display: { family: string; weight?: number };
    body: { family: string; weight?: number };
    mono: { family: string };
    scale: TypeScale;
  }>;
  space?: Partial<NormalizedTokens['space']>;
  shadow?: Partial<NormalizedTokens['shadow']>;
  motion?: Partial<{
    duration: Partial<NormalizedTokens['motion']['duration']> & { base?: string };
    easing: string;
  }>;
  meta?: Partial<NormalizedTokens['meta']>;
};
