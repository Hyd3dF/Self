// Vantage Premium Theme
// A cinematic, high-contrast, deep-tech aesthetic.

export const colors = {
    // -------------------------------------------------------------
    // Core Layout
    // -------------------------------------------------------------
    // Deepest black for infinite depth
    background: '#050505',
    // Slightly lighter for cards/surfaces
    surface: '#0A0A0A',
    surfaceHighlight: '#141414',

    // -------------------------------------------------------------
    // Brand Identity
    // -------------------------------------------------------------
    // "Electric Blue" - Intelligence, Clarity, Precision
    primary: '#2D46B9',
    primaryDark: '#1E3296',
    primaryLight: '#5266D1',
    primaryGlow: 'rgba(45, 70, 185, 0.6)',

    // "Neon Violet" - Creativity, AI Magic, Spark
    accent: '#9D4EDD',
    accentGlow: 'rgba(157, 78, 221, 0.6)',

    // Secondary / Functional
    secondary: '#FFFFFF',

    // -------------------------------------------------------------
    // Typography
    // -------------------------------------------------------------
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.65)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    textInverse: '#000000',

    // -------------------------------------------------------------
    // UI Elements
    // -------------------------------------------------------------
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.15)',
    borderFocus: '#2D46B9',

    inputBackground: '#0F0F0F',
    inputPlaceholder: 'rgba(255, 255, 255, 0.3)',

    // -------------------------------------------------------------
    // Status
    // -------------------------------------------------------------
    success: '#00F5D4',  // Neon Mint
    error: '#FF0054',    // Neon Red
    warning: '#F9C74F',  // Neon Amber
    info: '#4CC9F0',     // Neon Sky

    // -------------------------------------------------------------
    // Trading Specific
    // -------------------------------------------------------------
    gold: '#FFD700',         // Gold color
    goldGlow: 'rgba(255, 215, 0, 0.4)',
    bullish: '#00F5A0',      // Bullish Green
    bearish: '#FF3B69',      // Bearish Red
    neutral: '#7B8794',      // Neutral Gray

    // -------------------------------------------------------------
    // Glassmorphism & Effects
    // -------------------------------------------------------------
    glassBg: 'rgba(10, 10, 10, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.85)',
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    section: 64, // Large section breaks
};

export const borderRadius = {
    s: 6,
    m: 12,
    l: 20,
    xl: 32,
    round: 9999,
};

export const typography = {
    // Assuming default system fonts for now, but configured for scale
    h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.3 },
    body: { fontSize: 16, lineHeight: 24 },
    caption: { fontSize: 12, lineHeight: 16 },
};
