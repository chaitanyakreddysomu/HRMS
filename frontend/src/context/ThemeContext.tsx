import React, { createContext, useContext, useEffect, useState } from 'react';
import { hexToHsl, hexToRgb } from '../utils/colorUtils';

export interface ThemeSettingsType {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textForeground: string;
  mutedText: string;
  border: string;
  input: string;
  primaryText: string;
  secondaryText: string;
  shadow: number;
  buttonBgType: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientColor1Transparent: boolean;
  gradientColor2Transparent: boolean;
  gradientAngle: number;
  scrollbarWidth: number;
  scrollbarType: string;
  scrollbarColor1: string;
  scrollbarColor2: string;
  scrollbarColor1Transparent: boolean;
  scrollbarColor2Transparent: boolean;
  scrollbarGradientAngle: number;
  // Extended borders
  borderColor: string;
  borderThickness: number;
  borderStyle: string;
  borderRadius: number;
  borderOpacity: number;
  // Extended shadows
  shadowColor: string;
  shadowOpacity: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Extended primary text
  primaryTextFont: string;
  primaryTextWeight: string;
  primaryTextStyle: string;
  primaryTextSize: number;
  primaryTextLineHeight: number;
  // Extended secondary text
  secondaryTextFont: string;
  secondaryTextWeight: string;
  secondaryTextStyle: string;
  secondaryTextSize: number;
  secondaryTextLineHeight: number;
  // Extended buttons
  buttonTextColor: string;
  buttonBorderColor: string;
  buttonBorderThickness: number;
  buttonBorderRadius: number;
  buttonHoverBrightness: number;
  // Extended scrollbar
  scrollbarRadius: number;
  scrollbarColor1Opacity: number;
  scrollbarColor2Opacity: number;
}

const defaultTheme: ThemeSettingsType = {
  primary: '#150f29',
  secondary: '#7C3AED',
  accent: '#F59E0B',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  textForeground: '#0F172A',
  mutedText: '#64748B',
  border: '#E2E8F0',
  input: '#FFFFFF',
  primaryText: '#FFFFFF',
  secondaryText: '#FFFFFF',
  shadow: 8,
  buttonBgType: 'solid',
  gradientColor1: '#7C3AED',
  gradientColor2: '#F59E0B',
  gradientColor1Transparent: false,
  gradientColor2Transparent: false,
  gradientAngle: 45,
  scrollbarWidth: 6,
  scrollbarType: 'solid',
  scrollbarColor1: '#7C3AED',
  scrollbarColor2: '#F59E0B',
  scrollbarColor1Transparent: false,
  scrollbarColor2Transparent: false,
  scrollbarGradientAngle: 90,
  // Extended borders
  borderColor: '#E2E8F0',
  borderThickness: 1,
  borderStyle: 'solid',
  borderRadius: 8,
  borderOpacity: 100,
  // Extended shadows
  shadowColor: '#000000',
  shadowOpacity: 8,
  shadowBlur: 12,
  shadowSpread: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  // Extended primary text
  primaryTextFont: 'Inter',
  primaryTextWeight: 'Normal',
  primaryTextStyle: 'Normal',
  primaryTextSize: 16,
  primaryTextLineHeight: 1.5,
  // Extended secondary text
  secondaryTextFont: 'Inter',
  secondaryTextWeight: 'Normal',
  secondaryTextStyle: 'Normal',
  secondaryTextSize: 14,
  secondaryTextLineHeight: 1.5,
  // Extended buttons
  buttonTextColor: '#FFFFFF',
  buttonBorderColor: '#4271FF',
  buttonBorderThickness: 1,
  buttonBorderRadius: 8,
  buttonHoverBrightness: 95,
  // Extended scrollbar
  scrollbarRadius: 10,
  scrollbarColor1Opacity: 100,
  scrollbarColor2Opacity: 100,
};

interface ThemeContextType {
  theme: ThemeSettingsType;
  updateTheme: (newTheme: ThemeSettingsType) => void;
  saveTheme: (newTheme: ThemeSettingsType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {},
  saveTheme: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettingsType>(defaultTheme);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', hexToHsl(theme.primary));
    root.style.setProperty('--secondary', hexToHsl(theme.secondary));
    root.style.setProperty('--accent', hexToHsl(theme.accent));
    root.style.setProperty('--background', hexToHsl(theme.background));
    root.style.setProperty('--card', hexToHsl(theme.surface)); // surface -> card
    root.style.setProperty('--foreground', hexToHsl(theme.textForeground));
    root.style.setProperty('--muted', hexToHsl(theme.mutedText));
    root.style.setProperty('--muted-foreground', hexToHsl(theme.mutedText));
    root.style.setProperty('--border', hexToHsl(theme.border));
    root.style.setProperty('--input', hexToHsl(theme.input));
    root.style.setProperty('--primary-foreground', hexToHsl(theme.primaryText));
    root.style.setProperty('--secondary-foreground', hexToHsl(theme.secondaryText));
    
    // Inject shadow intensity percentage as decimal
    const intensity = typeof theme.shadow === 'number' ? theme.shadow : 8;
    root.style.setProperty('--shadow-intensity', (intensity / 100).toString());
    
    // Apply Scrollbar Settings
    root.style.setProperty('--scrollbar-width', `${theme.scrollbarWidth ?? 6}px`);
    if (theme.scrollbarType === 'gradient') {
      const c1 = theme.scrollbarColor1Transparent ? 'transparent' : (theme.scrollbarColor1 ?? '#7C3AED');
      const c2 = theme.scrollbarColor2Transparent ? 'transparent' : (theme.scrollbarColor2 ?? '#F59E0B');
      const sbGrad = `linear-gradient(${theme.scrollbarGradientAngle ?? 90}deg, ${c1}, ${c2})`;
      root.style.setProperty('--scrollbar-thumb-bg', sbGrad);
    } else {
      const c1 = theme.scrollbarColor1Transparent ? 'transparent' : (theme.scrollbarColor1 ?? '#7C3AED');
      root.style.setProperty('--scrollbar-thumb-bg', c1);
    }

    if (theme.buttonBgType === 'gradient') {
      const c1 = theme.gradientColor1Transparent ? 'transparent' : theme.gradientColor1;
      const c2 = theme.gradientColor2Transparent ? 'transparent' : theme.gradientColor2;
      const grad = `linear-gradient(${theme.gradientAngle}deg, ${c1}, ${c2})`;
      root.style.setProperty('--button-bg', grad);
      root.style.setProperty('--sidebar-active-bg', grad);
    } else {
      root.style.setProperty('--button-bg', `hsl(${hexToHsl(theme.primary)})`);
      root.style.setProperty('--sidebar-active-bg', `hsl(${hexToHsl(theme.primary)})`);
    }

    // Extended Theme Settings variables
    // Borders
    root.style.setProperty('--custom-border-color', theme.borderColor);
    root.style.setProperty('--custom-border-thickness', `${theme.borderThickness}px`);
    root.style.setProperty('--custom-border-style', theme.borderStyle);
    root.style.setProperty('--custom-border-radius', `${theme.borderRadius}px`);
    root.style.setProperty('--custom-border-opacity', (theme.borderOpacity / 100).toString());

    // Shadows
    const shadowRgb = hexToRgb(theme.shadowColor);
    const shadowVal = `${theme.shadowOffsetX}px ${theme.shadowOffsetY}px ${theme.shadowBlur}px ${theme.shadowSpread}px rgba(${shadowRgb}, ${theme.shadowOpacity / 100})`;
    root.style.setProperty('--custom-shadow', shadowVal);

    // Primary Text
    root.style.setProperty('--primary-font-family', theme.primaryTextFont);
    root.style.setProperty('--primary-font-weight', theme.primaryTextWeight.toLowerCase() === 'bold' ? '700' : theme.primaryTextWeight.toLowerCase() === 'medium' ? '500' : '400');
    root.style.setProperty('--primary-font-style', theme.primaryTextStyle.toLowerCase());
    root.style.setProperty('--primary-font-size', `${theme.primaryTextSize}px`);
    root.style.setProperty('--primary-line-height', theme.primaryTextLineHeight.toString());

    // Secondary Text
    root.style.setProperty('--secondary-font-family', theme.secondaryTextFont);
    root.style.setProperty('--secondary-font-weight', theme.secondaryTextWeight.toLowerCase() === 'bold' ? '700' : theme.secondaryTextWeight.toLowerCase() === 'medium' ? '500' : '400');
    root.style.setProperty('--secondary-font-style', theme.secondaryTextStyle.toLowerCase());
    root.style.setProperty('--secondary-font-size', `${theme.secondaryTextSize}px`);
    root.style.setProperty('--secondary-line-height', theme.secondaryTextLineHeight.toString());

    // Buttons
    root.style.setProperty('--custom-button-text-color', theme.buttonTextColor);
    root.style.setProperty('--custom-button-border-color', theme.buttonBorderColor);
    root.style.setProperty('--custom-button-border-thickness', `${theme.buttonBorderThickness}px`);
    root.style.setProperty('--custom-button-border-radius', `${theme.buttonBorderRadius}px`);
    root.style.setProperty('--custom-button-hover-brightness', `${theme.buttonHoverBrightness}%`);

    // Scrollbar Extended
    root.style.setProperty('--custom-scrollbar-radius', `${theme.scrollbarRadius}px`);
  }, [theme]);

  useEffect(() => {
    // Fetch theme from API on mount
    const fetchTheme = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/theme`);
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            setTheme({
              primary: data.primary || defaultTheme.primary,
              secondary: data.secondary || defaultTheme.secondary,
              accent: data.accent || defaultTheme.accent,
              background: data.background || defaultTheme.background,
              surface: data.surface || defaultTheme.surface,
              textForeground: data.textForeground || defaultTheme.textForeground,
              mutedText: data.mutedText || defaultTheme.mutedText,
              border: data.border || defaultTheme.border,
              input: data.input || defaultTheme.input,
              primaryText: data.primaryText || defaultTheme.primaryText,
              secondaryText: data.secondaryText || defaultTheme.secondaryText,
              shadow: typeof data.shadow === 'number' ? data.shadow : (parseInt(data.shadow) || defaultTheme.shadow),
              buttonBgType: data.buttonBgType || defaultTheme.buttonBgType,
              gradientColor1: data.gradientColor1 || defaultTheme.gradientColor1,
              gradientColor2: data.gradientColor2 || defaultTheme.gradientColor2,
              gradientColor1Transparent: data.gradientColor1Transparent ?? defaultTheme.gradientColor1Transparent,
              gradientColor2Transparent: data.gradientColor2Transparent ?? defaultTheme.gradientColor2Transparent,
              gradientAngle: data.gradientAngle ?? defaultTheme.gradientAngle,
              scrollbarWidth: typeof data.scrollbarWidth === 'number' ? data.scrollbarWidth : defaultTheme.scrollbarWidth,
              scrollbarType: data.scrollbarType || defaultTheme.scrollbarType,
              scrollbarColor1: data.scrollbarColor1 || defaultTheme.scrollbarColor1,
              scrollbarColor2: data.scrollbarColor2 || defaultTheme.scrollbarColor2,
              scrollbarColor1Transparent: data.scrollbarColor1Transparent ?? defaultTheme.scrollbarColor1Transparent,
              scrollbarColor2Transparent: data.scrollbarColor2Transparent ?? defaultTheme.scrollbarColor2Transparent,
              scrollbarGradientAngle: typeof data.scrollbarGradientAngle === 'number' ? data.scrollbarGradientAngle : defaultTheme.scrollbarGradientAngle,
              // Extended borders
              borderColor: data.borderColor || defaultTheme.borderColor,
              borderThickness: typeof data.borderThickness === 'number' ? data.borderThickness : defaultTheme.borderThickness,
              borderStyle: data.borderStyle || defaultTheme.borderStyle,
              borderRadius: typeof data.borderRadius === 'number' ? data.borderRadius : defaultTheme.borderRadius,
              borderOpacity: typeof data.borderOpacity === 'number' ? data.borderOpacity : defaultTheme.borderOpacity,
              // Extended shadows
              shadowColor: data.shadowColor || defaultTheme.shadowColor,
              shadowOpacity: typeof data.shadowOpacity === 'number' ? data.shadowOpacity : defaultTheme.shadowOpacity,
              shadowBlur: typeof data.shadowBlur === 'number' ? data.shadowBlur : defaultTheme.shadowBlur,
              shadowSpread: typeof data.shadowSpread === 'number' ? data.shadowSpread : defaultTheme.shadowSpread,
              shadowOffsetX: typeof data.shadowOffsetX === 'number' ? data.shadowOffsetX : defaultTheme.shadowOffsetX,
              shadowOffsetY: typeof data.shadowOffsetY === 'number' ? data.shadowOffsetY : defaultTheme.shadowOffsetY,
              // Extended primary text
              primaryTextFont: data.primaryTextFont || defaultTheme.primaryTextFont,
              primaryTextWeight: data.primaryTextWeight || defaultTheme.primaryTextWeight,
              primaryTextStyle: data.primaryTextStyle || defaultTheme.primaryTextStyle,
              primaryTextSize: typeof data.primaryTextSize === 'number' ? data.primaryTextSize : defaultTheme.primaryTextSize,
              primaryTextLineHeight: typeof data.primaryTextLineHeight === 'number' ? data.primaryTextLineHeight : defaultTheme.primaryTextLineHeight,
              // Extended secondary text
              secondaryTextFont: data.secondaryTextFont || defaultTheme.secondaryTextFont,
              secondaryTextWeight: data.secondaryTextWeight || defaultTheme.secondaryTextWeight,
              secondaryTextStyle: data.secondaryTextStyle || defaultTheme.secondaryTextStyle,
              secondaryTextSize: typeof data.secondaryTextSize === 'number' ? data.secondaryTextSize : defaultTheme.secondaryTextSize,
              secondaryTextLineHeight: typeof data.secondaryTextLineHeight === 'number' ? data.secondaryTextLineHeight : defaultTheme.secondaryTextLineHeight,
              // Extended buttons
              buttonTextColor: data.buttonTextColor || defaultTheme.buttonTextColor,
              buttonBorderColor: data.buttonBorderColor || defaultTheme.buttonBorderColor,
              buttonBorderThickness: typeof data.buttonBorderThickness === 'number' ? data.buttonBorderThickness : defaultTheme.buttonBorderThickness,
              buttonBorderRadius: typeof data.buttonBorderRadius === 'number' ? data.buttonBorderRadius : defaultTheme.buttonBorderRadius,
              buttonHoverBrightness: typeof data.buttonHoverBrightness === 'number' ? data.buttonHoverBrightness : defaultTheme.buttonHoverBrightness,
              // Extended scrollbar
              scrollbarRadius: typeof data.scrollbarRadius === 'number' ? data.scrollbarRadius : defaultTheme.scrollbarRadius,
              scrollbarColor1Opacity: typeof data.scrollbarColor1Opacity === 'number' ? data.scrollbarColor1Opacity : defaultTheme.scrollbarColor1Opacity,
              scrollbarColor2Opacity: typeof data.scrollbarColor2Opacity === 'number' ? data.scrollbarColor2Opacity : defaultTheme.scrollbarColor2Opacity,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch theme', error);
      }
    };
    fetchTheme();
  }, []);

  const updateTheme = (newTheme: ThemeSettingsType) => {
    setTheme(newTheme);
  };

  const saveTheme = async (newTheme: ThemeSettingsType) => {
    setTheme(newTheme);
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTheme),
      });
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
