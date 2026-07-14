/**
 * Premium Dark-Mode first color palette tailored for the Fitness Trainer App.
 * Uses HSL-derived colors for optimal contrast and modern aesthetic.
 */

const tintColorDark = '#10b981'; // Emerald Green for energy/fitness

export const Colors = {
  dark: {
    text: '#f4f4f5',          // Zinc 100 - Main text color
    textMuted: '#a1a1aa',     // Zinc 400 - Muted/Secondary text
    background: '#09090b',    // Zinc 950 - Deep black background
    card: '#18181b',          // Zinc 900 - Card/Surface background
    cardBorder: '#27272a',    // Zinc 800 - Borders and dividers
    primary: '#10b981',       // Emerald 500 - Buttons, active states
    primaryLight: '#34d399',  // Emerald 400 - Hover/Active highlights
    accent: '#f43f5e',        // Rose 500 - Timers, active workouts, delete buttons
    warning: '#f59e0b',       // Amber 500 - Pause, warning states
    tint: tintColorDark,
    tabIconDefault: '#71717a',// Zinc 500 - Inactive tab icons
    tabIconSelected: tintColorDark,
  },
  light: {
    text: '#09090b',          // Zinc 950
    textMuted: '#71717a',     // Zinc 500
    background: '#fafafa',    // Zinc 50
    card: '#ffffff',          // White
    cardBorder: '#e4e4e7',    // Zinc 200
    primary: '#059669',       // Emerald 600
    primaryLight: '#10b981',  // Emerald 500
    accent: '#e11d48',        // Rose 600
    warning: '#d97706',       // Amber 600
    tint: '#059669',
    tabIconDefault: '#a1a1aa',// Zinc 400
    tabIconSelected: '#059669',
  }
};

export default Colors;
