import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeSettingsType } from '@/context/ThemeContext';
import { hexToHsl } from '@/utils/colorUtils';
import {
  Save,
  RefreshCcw,
  Paintbrush,
  Layers,
  Type,
  MousePointerClick,
  Sliders,
  Square,
  Sparkles,
  Info,
  SlidersHorizontal,
  BookmarkCheck,
  X,
  Copy,
  Check,
  Clipboard,
} from 'lucide-react';


const ColorPicker = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const hexToRgba = (hex: string) => {
    const cleanHex = hex.replace(/#/g, "");

    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.slice(0, 2), 16);
      const g = parseInt(cleanHex.slice(2, 4), 16);
      const b = parseInt(cleanHex.slice(4, 6), 16);

      return `rgb(${r}, ${g}, ${b})`;
    }

    if (cleanHex.length === 8) {
      const r = parseInt(cleanHex.slice(0, 2), 16);
      const g = parseInt(cleanHex.slice(2, 4), 16);
      const b = parseInt(cleanHex.slice(4, 6), 16);
      const a = parseInt(cleanHex.slice(6, 8), 16) / 255;

      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return "#000000";
  };

  const sanitizeHex = (input: string) => {
    let hex = input.replace(/#/g, "");

    hex = hex.replace(/[^0-9a-fA-F]/g, "");

    hex = hex.slice(0, 8);

    return `#${hex}`;
  };

  const handleInputChange = (input: string) => {
    onChange(sanitizeHex(input));
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText) return;

      onChange(sanitizeHex(clipboardText));
    } catch (error) {
      console.error("Failed to paste color:", error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy color:", error);
    }
  };

  const getPickerColor = (hex: string) => {
    const cleanHex = hex.replace(/#/g, "");

    if (cleanHex.length >= 6) {
      return `#${cleanHex.slice(0, 6)}`;
    }

    return "#000000";
  };

  const pickerColor = getPickerColor(value);

  const previewColor = /^#[0-9A-Fa-f]{6,8}$/.test(value)
    ? hexToRgba(value)
    : "#000000";

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="text-xs font-semibold text-slate-500">
        {label}
      </label>

      {/* Large Color Preview */}
      <div className="relative h-20 w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        {/* Transparency Checkerboard */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
            `,
            backgroundSize: "12px 12px",
            backgroundPosition:
              "0 0, 0 6px, 6px -6px, -6px 0px",
          }}
        />

        {/* Actual Color */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: previewColor,
          }}
        />

        {/* Native Color Picker */}
        <input
          type="color"
          value={pickerColor}
          onChange={(e) => {
            const newColor = e.target.value;
            const cleanValue = value.replace(/#/g, "");

            // Preserve alpha when using the native picker
            if (cleanValue.length === 8) {
              const alpha = cleanValue.slice(6, 8);
              onChange(`${newColor}${alpha}`);
            } else {
              onChange(newColor);
            }
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {/* HEX Input + Icons */}
      <div className="relative">
        <input
          type="text"
          value={value || "#"}
          onChange={(e) => handleInputChange(e.target.value)}
          maxLength={9}
          placeholder="#RRGGBB or #RRGGBBAA"
          className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-16 text-[11px] font-mono uppercase text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        {/* Paste → Copy */}
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
          {/* Paste */}
          <button
            type="button"
            onClick={handlePaste}
            title="Paste color"
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Clipboard size={14} strokeWidth={1.8} />
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy color"}
            className={`flex h-6 w-6 items-center justify-center rounded transition ${
              copied
                ? "text-emerald-500"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {copied ? (
              <Check size={14} strokeWidth={2} />
            ) : (
              <Copy size={14} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      
    </div>
  );
};
// Left sidebar menu items
const controlCategories = [
  { id: 'primary', label: 'Primary Color', icon: Paintbrush, desc: 'Brand colors & active indicators' },
  { id: 'secondary', label: 'Secondary Color', icon: Layers, desc: 'Badges & accent elements' },
  { id: 'borders', label: 'Borders', icon: Square, desc: 'Border style, radius & width' },
  { id: 'shadows', label: 'Shadows', icon: Sliders, desc: 'Global elevations & spreads' },
  { id: 'primaryText', label: 'Primary Text', icon: Type, desc: 'Headers & body typography' },
  { id: 'secondaryText', label: 'Secondary Text', icon: Type, desc: 'Subtitles & description font' },
  { id: 'buttons', label: 'Buttons', icon: MousePointerClick, desc: 'Button gradients, states & radius' },
  { id: 'scrollbar', label: 'Scrollbar', icon: SlidersHorizontal, desc: 'Custom scrollbar dimensions' },
];

export default function Customize({ onClose }: { onClose?: () => void }) {
  const { theme, saveTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<ThemeSettingsType>(theme);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('primary');
  const [inspectedElement, setInspectedElement] = useState<{
    type: string;
    token: string;
    bg?: string;
    text?: string;
    border?: string;
    radius?: string;
    font?: string;
    weight?: string;
    style?: string;
    color?: string;
    size?: string;
  } | null>(null);

  // Sync local theme when global theme loads
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Apply changes globally via DOM for live preview
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', hexToHsl(localTheme.primary));
    root.style.setProperty('--secondary', hexToHsl(localTheme.secondary));
    root.style.setProperty('--accent', hexToHsl(localTheme.accent));
    root.style.setProperty('--background', hexToHsl(localTheme.background));
    root.style.setProperty('--card', hexToHsl(localTheme.surface));
    root.style.setProperty('--foreground', hexToHsl(localTheme.textForeground));
    root.style.setProperty('--muted', hexToHsl(localTheme.mutedText));
    root.style.setProperty('--muted-foreground', hexToHsl(localTheme.mutedText));
    root.style.setProperty('--border', hexToHsl(localTheme.border));
    root.style.setProperty('--input', hexToHsl(localTheme.input));
    root.style.setProperty('--primary-foreground', hexToHsl(localTheme.primaryText));
    root.style.setProperty('--secondary-foreground', hexToHsl(localTheme.secondaryText));

    // Custom Scrollbar live variables
    root.style.setProperty('--scrollbar-width', `${localTheme.scrollbarWidth ?? 6}px`);
    if (localTheme.scrollbarType === 'gradient') {
      const c1 = localTheme.scrollbarColor1Transparent ? 'transparent' : (localTheme.scrollbarColor1 ?? '#7C3AED');
      const c2 = localTheme.scrollbarColor2Transparent ? 'transparent' : (localTheme.scrollbarColor2 ?? '#F59E0B');
      const sbGrad = `linear-gradient(${localTheme.scrollbarGradientAngle ?? 90}deg, ${c1}, ${c2})`;
      root.style.setProperty('--scrollbar-thumb-bg', sbGrad);
    } else {
      const c1 = localTheme.scrollbarColor1Transparent ? 'transparent' : (localTheme.scrollbarColor1 ?? '#7C3AED');
      root.style.setProperty('--scrollbar-thumb-bg', c1);
    }

    if (localTheme.buttonBgType === 'gradient') {
      const c1 = localTheme.gradientColor1Transparent ? 'transparent' : localTheme.gradientColor1;
      const c2 = localTheme.gradientColor2Transparent ? 'transparent' : localTheme.gradientColor2;
      const grad = `linear-gradient(${localTheme.gradientAngle ?? 45}deg, ${c1}, ${c2})`;
      root.style.setProperty('--button-bg', grad);
      root.style.setProperty('--sidebar-active-bg', grad);
    } else {
      root.style.setProperty('--button-bg', `hsl(${hexToHsl(localTheme.primary)})`);
      root.style.setProperty('--sidebar-active-bg', `hsl(${hexToHsl(localTheme.primary)})`);
    }

    // Extended variables
    root.style.setProperty('--custom-border-color', localTheme.borderColor);
    root.style.setProperty('--custom-border-thickness', `${localTheme.borderThickness}px`);
    root.style.setProperty('--custom-border-style', localTheme.borderStyle);
    root.style.setProperty('--custom-border-radius', `${localTheme.borderRadius}px`);
    root.style.setProperty('--custom-border-opacity', (localTheme.borderOpacity / 100).toString());

    // Shadows
    const hexToRgb = (hex: string) => {
      hex = hex.replace(/^#/, '');
      let r = 0, g = 0, b = 0;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      return `${r}, ${g}, ${b}`;
    };
    const shadowRgb = hexToRgb(localTheme.shadowColor);
    const shadowVal = `${localTheme.shadowOffsetX}px ${localTheme.shadowOffsetY}px ${localTheme.shadowBlur}px ${localTheme.shadowSpread}px rgba(${shadowRgb}, ${localTheme.shadowOpacity / 100})`;
    root.style.setProperty('--custom-shadow', shadowVal);

    // Primary Text
    root.style.setProperty('--primary-font-family', localTheme.primaryTextFont);
    root.style.setProperty('--primary-font-weight', localTheme.primaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.primaryTextWeight.toLowerCase() === 'medium' ? '500' : '400');
    root.style.setProperty('--primary-font-style', localTheme.primaryTextStyle.toLowerCase());
    root.style.setProperty('--primary-font-size', `${localTheme.primaryTextSize}px`);
    root.style.setProperty('--primary-line-height', localTheme.primaryTextLineHeight.toString());

    // Secondary Text
    root.style.setProperty('--secondary-font-family', localTheme.secondaryTextFont);
    root.style.setProperty('--secondary-font-weight', localTheme.secondaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.secondaryTextWeight.toLowerCase() === 'medium' ? '500' : '400');
    root.style.setProperty('--secondary-font-style', localTheme.secondaryTextStyle.toLowerCase());
    root.style.setProperty('--secondary-font-size', `${localTheme.secondaryTextSize}px`);
    root.style.setProperty('--secondary-line-height', localTheme.secondaryTextLineHeight.toString());

    // Buttons
    root.style.setProperty('--custom-button-text-color', localTheme.buttonTextColor);
    root.style.setProperty('--custom-button-border-color', localTheme.buttonBorderColor);
    root.style.setProperty('--custom-button-border-thickness', `${localTheme.buttonBorderThickness}px`);
    root.style.setProperty('--custom-button-border-radius', `${localTheme.buttonBorderRadius}px`);
    root.style.setProperty('--custom-button-hover-brightness', `${localTheme.buttonHoverBrightness}%`);

    // Scrollbar Extended
    root.style.setProperty('--custom-scrollbar-radius', `${localTheme.scrollbarRadius}px`);
  }, [localTheme]);

  // Revert changes on unmount/cleanup if unsaved
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      root.style.setProperty('--primary', hexToHsl(theme.primary));
      root.style.setProperty('--secondary', hexToHsl(theme.secondary));
      root.style.setProperty('--accent', hexToHsl(theme.accent));
      root.style.setProperty('--background', hexToHsl(theme.background));
      root.style.setProperty('--card', hexToHsl(theme.surface));
      root.style.setProperty('--foreground', hexToHsl(theme.textForeground));
      root.style.setProperty('--muted', hexToHsl(theme.mutedText));
      root.style.setProperty('--muted-foreground', hexToHsl(theme.mutedText));
      root.style.setProperty('--border', hexToHsl(theme.border));
      root.style.setProperty('--input', hexToHsl(theme.input));
      root.style.setProperty('--primary-foreground', hexToHsl(theme.primaryText));
      root.style.setProperty('--secondary-foreground', hexToHsl(theme.secondaryText));
      root.style.setProperty('--scrollbar-width', `${theme.scrollbarWidth ?? 6}px`);
    };
  }, [theme]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setLocalTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveTheme(localTheme);
    setIsSaving(false);
  };

  const resetChanges = () => {
    setLocalTheme(theme);
    setInspectedElement(null);
  };

  // Build current gradient style for buttons
  const getButtonBackground = () => {
    if (localTheme.buttonBgType === 'gradient') {
      const c1 = localTheme.gradientColor1Transparent ? 'transparent' : localTheme.gradientColor1;
      const c2 = localTheme.gradientColor2Transparent ? 'transparent' : localTheme.gradientColor2;
      return `linear-gradient(${localTheme.gradientAngle ?? 45}deg, ${c1}, ${c2})`;
    }
    return localTheme.primary;
  };

  // Build dynamic shadow style
  const getShadowStyle = () => {
    return `${localTheme.shadowOffsetX}px ${localTheme.shadowOffsetY}px ${localTheme.shadowBlur}px ${localTheme.shadowSpread}px rgba(0, 0, 0, ${localTheme.shadowOpacity / 100})`;
  };

  // Get font family fallback list
  const getFontFamily = (font: string) => {
    if (font === 'System') return 'system-ui, sans-serif';
    return `"${font}", sans-serif`;
  };

  // Interactive Inspector Element Clicks
  const handleInspectElement = (
    e: React.MouseEvent,
    category: string,
    metadata: {
      type: string;
      token: string;
      bg?: string;
      text?: string;
      border?: string;
      radius?: string;
      font?: string;
      weight?: string;
      style?: string;
      color?: string;
      size?: string;
    }
  ) => {
    e.stopPropagation();
    setSelectedCategory(category);
    setInspectedElement(metadata);
  };

  // Highlight check
  const getHighlightClass = (catId: string) => {
    if (selectedCategory === catId) {
      return 'outline-double outline-[3px] outline-blue-500/85 outline-offset-2 ring-4 ring-blue-500/25 transition-all duration-300';
    }
    return 'transition-all duration-300';
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden font-sans">

      {/* Light Theme Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Theme Customizer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Customize your application's appearance in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetChanges}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-all"
            title="Reset changes"
          >
            <RefreshCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-indigo-600/10 transition-all"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save Theme'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
              title="Close Customizer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* 3-Column Layout Workspace */}
      <div className="flex flex-1 overflow-hidden">

        {/* COLUMN 1: THEME CONTROLS (LIGHT THEME) */}
        <aside className="w-64 border-r border-slate-150 bg-slate-50 overflow-y-auto flex flex-col scrollbar-thin">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Theme Layers</h2>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {controlCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setInspectedElement(null);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${isActive
                    ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-l-4 border-transparent'
                    }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-semibold">{cat.label}</div>
                    {/* <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</div> */}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 bg-slate-100/50 text-[11px] text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Click any preview component to automatically inspect & edit.</span>
          </div>
        </aside>

        {/* COLUMN 2: LIVE PREVIEW CONTAINER (LIGHT CONTRAST BG) */}
        <main className="flex-1 bg-slate-100/80 overflow-y-auto p-8 flex flex-col items-center justify-start scrollbar-thin">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col h-[520px] transition-all">

            {/* Mock Navigation Header */}
            <div
              onClick={(e) => handleInspectElement(e, 'primary', {
                type: 'Navigation',
                token: 'Primary Color / Active Navigation',
                bg: localTheme.primary,
                text: '#FFFFFF'
              })}
              className={`flex items-center justify-between px-5 py-3.5 border-b cursor-pointer select-none ${getHighlightClass('primary')}`}
              style={{
                background: localTheme.primary,
                color: localTheme.primaryText,
                borderColor: localTheme.border
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-300">
                  HR
                </div>
                <span className="font-semibold text-sm tracking-wide">Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs opacity-80 cursor-pointer hover:opacity-100 transition-opacity">🔔 Notifications</span>
                <div className="w-7 h-7 rounded-full bg-slate-300 border border-white/20 flex items-center justify-center font-semibold text-xs text-slate-700">
                  JS
                </div>
              </div>
            </div>

            {/* Dashboard Mock Body */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6 flex flex-col">

              {/* Cards Grid */}
              <div className="grid grid-cols-3 gap-4">

                {/* CARD 1: REVENUE */}
                <div
                  onClick={(e) => handleInspectElement(e, 'borders', {
                    type: 'Metrics Card',
                    token: 'Borders & Shadows System',
                    bg: localTheme.surface,
                    border: `${localTheme.borderThickness}px ${localTheme.borderStyle} ${localTheme.borderColor}`,
                    radius: `${localTheme.borderRadius}px`
                  })}
                  className={`bg-white p-4 cursor-pointer select-none transition-all ${getHighlightClass('borders')} ${getHighlightClass('shadows')}`}
                  style={{
                    borderColor: localTheme.borderColor,
                    borderWidth: `${localTheme.borderThickness}px`,
                    borderStyle: localTheme.borderStyle,
                    borderRadius: `${localTheme.borderRadius}px`,
                    boxShadow: getShadowStyle()
                  }}
                >
                  <span
                    onClick={(e) => handleInspectElement(e, 'secondaryText', {
                      type: 'Card Subtext',
                      token: 'Secondary Text token',
                      color: localTheme.mutedText,
                      font: localTheme.secondaryTextFont,
                      size: `${localTheme.secondaryTextSize}px`,
                      weight: localTheme.secondaryTextWeight
                    })}
                    className="text-[11px] font-medium block uppercase tracking-wider"
                    style={{
                      color: localTheme.mutedText,
                      fontFamily: getFontFamily(localTheme.secondaryTextFont),
                      fontSize: `${localTheme.secondaryTextSize - 2}px`,
                      fontWeight: localTheme.secondaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.secondaryTextWeight.toLowerCase() === 'medium' ? '500' : '400',
                      fontStyle: localTheme.secondaryTextStyle.toLowerCase()
                    }}
                  >
                    Revenue
                  </span>
                  <span
                    onClick={(e) => handleInspectElement(e, 'primaryText', {
                      type: 'Card Heading',
                      token: 'Primary Text token',
                      color: localTheme.textForeground,
                      font: localTheme.primaryTextFont,
                      size: `${localTheme.primaryTextSize}px`,
                      weight: localTheme.primaryTextWeight
                    })}
                    className="text-lg font-bold block mt-1"
                    style={{
                      color: localTheme.textForeground,
                      fontFamily: getFontFamily(localTheme.primaryTextFont),
                      fontSize: `${localTheme.primaryTextSize + 4}px`,
                      fontWeight: localTheme.primaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.primaryTextWeight.toLowerCase() === 'medium' ? '500' : '400',
                      fontStyle: localTheme.primaryTextStyle.toLowerCase()
                    }}
                  >
                    $12,450
                  </span>
                </div>

                {/* CARD 2: USERS */}
                <div
                  onClick={(e) => handleInspectElement(e, 'borders', {
                    type: 'Metrics Card',
                    token: 'Borders & Shadows System',
                    bg: localTheme.surface,
                    border: `${localTheme.borderThickness}px ${localTheme.borderStyle} ${localTheme.borderColor}`,
                    radius: `${localTheme.borderRadius}px`
                  })}
                  className={`bg-white p-4 cursor-pointer select-none transition-all ${getHighlightClass('borders')} ${getHighlightClass('shadows')}`}
                  style={{
                    borderColor: localTheme.borderColor,
                    borderWidth: `${localTheme.borderThickness}px`,
                    borderStyle: localTheme.borderStyle,
                    borderRadius: `${localTheme.borderRadius}px`,
                    boxShadow: getShadowStyle()
                  }}
                >
                  <span
                    onClick={(e) => handleInspectElement(e, 'secondaryText', {
                      type: 'Card Subtext',
                      token: 'Secondary Text token',
                      color: localTheme.mutedText,
                      font: localTheme.secondaryTextFont,
                      size: `${localTheme.secondaryTextSize}px`,
                      weight: localTheme.secondaryTextWeight
                    })}
                    className="text-[11px] font-medium block uppercase tracking-wider"
                    style={{
                      color: localTheme.mutedText,
                      fontFamily: getFontFamily(localTheme.secondaryTextFont),
                      fontSize: `${localTheme.secondaryTextSize - 2}px`,
                      fontWeight: localTheme.secondaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.secondaryTextWeight.toLowerCase() === 'medium' ? '500' : '400',
                      fontStyle: localTheme.secondaryTextStyle.toLowerCase()
                    }}
                  >
                    Users
                  </span>
                  <span
                    onClick={(e) => handleInspectElement(e, 'primaryText', {
                      type: 'Card Heading',
                      token: 'Primary Text token',
                      color: localTheme.textForeground,
                      font: localTheme.primaryTextFont,
                      size: `${localTheme.primaryTextSize}px`,
                      weight: localTheme.primaryTextWeight
                    })}
                    className="text-lg font-bold block mt-1"
                    style={{
                      color: localTheme.textForeground,
                      fontFamily: getFontFamily(localTheme.primaryTextFont),
                      fontSize: `${localTheme.primaryTextSize + 4}px`,
                      fontWeight: localTheme.primaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.primaryTextWeight.toLowerCase() === 'medium' ? '500' : '400',
                      fontStyle: localTheme.primaryTextStyle.toLowerCase()
                    }}
                  >
                    1,245
                  </span>
                </div>

                {/* CARD 3: GROWTH */}
                <div
                  onClick={(e) => handleInspectElement(e, 'secondary', {
                    type: 'Badge accent',
                    token: 'Secondary Color Theme Token',
                    bg: localTheme.secondary,
                    text: '#FFFFFF'
                  })}
                  className={`p-4 cursor-pointer select-none transition-all ${getHighlightClass('secondary')} ${getHighlightClass('borders')} ${getHighlightClass('shadows')}`}
                  style={{
                    background: 'white',
                    borderColor: localTheme.borderColor,
                    borderWidth: `${localTheme.borderThickness}px`,
                    borderStyle: localTheme.borderStyle,
                    borderRadius: `${localTheme.borderRadius}px`,
                    boxShadow: getShadowStyle()
                  }}
                >
                  <span
                    onClick={(e) => handleInspectElement(e, 'secondaryText', {
                      type: 'Card Subtext',
                      token: 'Secondary Text token',
                      color: localTheme.mutedText,
                      font: localTheme.secondaryTextFont,
                      size: `${localTheme.secondaryTextSize}px`,
                      weight: localTheme.secondaryTextWeight
                    })}
                    className="text-[11px] font-medium block uppercase tracking-wider"
                    style={{
                      color: localTheme.mutedText,
                      fontFamily: getFontFamily(localTheme.secondaryTextFont),
                      fontSize: `${localTheme.secondaryTextSize - 2}px`,
                      fontWeight: localTheme.secondaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.secondaryTextWeight.toLowerCase() === 'medium' ? '500' : '400',
                      fontStyle: localTheme.secondaryTextStyle.toLowerCase()
                    }}
                  >
                    Growth
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-lg font-bold block"
                      style={{
                        color: localTheme.textForeground,
                        fontFamily: getFontFamily(localTheme.primaryTextFont),
                        fontSize: `${localTheme.primaryTextSize + 4}px`,
                        fontWeight: localTheme.primaryTextWeight.toLowerCase() === 'bold' ? '700' : localTheme.primaryTextWeight.toLowerCase() === 'medium' ? '500' : '400',
                        fontStyle: localTheme.primaryTextStyle.toLowerCase()
                      }}
                    >
                      84%
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ background: localTheme.secondary }}
                    >
                      +12%
                    </span>
                  </div>
                </div>

              </div>

              {/* Recent Activity Panel */}
              <div
                className={`bg-white rounded-lg flex-1 flex flex-col min-h-0 relative ${getHighlightClass('borders')} ${getHighlightClass('scrollbar')}`}
                style={{
                  borderColor: localTheme.borderColor,
                  borderWidth: `${localTheme.borderThickness}px`,
                  borderStyle: localTheme.borderStyle,
                  borderRadius: `${localTheme.borderRadius}px`,
                }}
              >
                <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50">
                  <h3
                    onClick={(e) => handleInspectElement(e, 'primaryText', {
                      type: 'Dashboard Heading',
                      token: 'Primary Text token',
                      color: localTheme.textForeground,
                      font: localTheme.primaryTextFont
                    })}
                    className="font-semibold text-xs tracking-wide text-slate-800"
                    style={{
                      color: localTheme.textForeground,
                      fontFamily: getFontFamily(localTheme.primaryTextFont),
                    }}
                  >
                    Recent Activities
                  </h3>
                  <span className="text-[10px] text-indigo-600 font-medium hover:underline cursor-pointer select-none">View All</span>
                </div>

                {/* Custom Scrollable container demonstrating scrollbar settings */}
                <div
                  onClick={(e) => handleInspectElement(e, 'scrollbar', {
                    type: 'Scrollbar Wrapper',
                    token: 'Scrollbar Token',
                    radius: `${localTheme.scrollbarRadius}px`,
                    border: `${localTheme.scrollbarWidth}px thickness`
                  })}
                  className={`flex-1 overflow-y-scroll p-4 space-y-3.5 pr-2`}
                  style={{
                    maxHeight: '160px',
                  }}
                >
                  {[
                    { title: 'Payment received from client', val: '₹2,500', time: '10 min ago' },
                    { title: 'Payment received from client', val: '₹1,200', time: '1 hour ago' },
                    { title: 'Server subscription renewed', val: '₹3,000', time: '5 hours ago' },
                    { title: 'Payment received from client', val: '₹800', time: '1 day ago' },
                  ].map((act, i) => (
                    <div key={i} className="flex justify-between items-center text-xs pb-2 border-b last:border-b-0 border-slate-100">
                      <div>
                        <p
                          onClick={(e) => handleInspectElement(e, 'primaryText', {
                            type: 'List Label',
                            token: 'Primary Text token',
                            color: localTheme.textForeground,
                            font: localTheme.primaryTextFont
                          })}
                          className="font-medium text-slate-800"
                          style={{
                            color: localTheme.textForeground,
                            fontFamily: getFontFamily(localTheme.primaryTextFont),
                          }}
                        >
                          {act.title}
                        </p>
                        <p
                          onClick={(e) => handleInspectElement(e, 'secondaryText', {
                            type: 'List Helper Text',
                            token: 'Secondary Text token',
                            color: localTheme.mutedText,
                            font: localTheme.secondaryTextFont
                          })}
                          className="text-[10px] mt-0.5 text-slate-500"
                          style={{
                            color: localTheme.mutedText,
                            fontFamily: getFontFamily(localTheme.secondaryTextFont),
                          }}
                        >
                          {act.time}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-700 text-[11px]">{act.val}</span>
                    </div>
                  ))}
                </div>

                {/* Add New Button Action Area */}
                <div className="p-3 bg-slate-50/50 border-t flex justify-center">
                  <button
                    onClick={(e) => handleInspectElement(e, 'buttons', {
                      type: 'Primary Button',
                      token: 'Buttons Styling Configuration',
                      bg: getButtonBackground(),
                      text: localTheme.buttonTextColor,
                      border: `${localTheme.buttonBorderThickness}px solid ${localTheme.buttonBorderColor}`,
                      radius: `${localTheme.buttonBorderRadius}px`
                    })}
                    className={`flex items-center gap-1.5 px-6 py-2 text-xs font-semibold select-none cursor-pointer transition-all ${getHighlightClass('buttons')}`}
                    style={{
                      background: getButtonBackground(),
                      color: localTheme.buttonTextColor,
                      borderColor: localTheme.buttonBorderColor,
                      borderWidth: `${localTheme.buttonBorderThickness}px`,
                      borderStyle: 'solid',
                      borderRadius: `${localTheme.buttonBorderRadius}px`,
                    }}
                  >
                    + Add New
                  </button>
                </div>

              </div>

            </div>

          </div>
        </main>

        {/* COLUMN 3: EDIT SELECTED (LIGHT THEME) */}
        <aside className="w-80 border-l border-slate-200 bg-slate-50 overflow-y-auto p-5 scrollbar-thin">

          {/* Dynamic Element Inspector Inspector Banner */}
          {inspectedElement && (
            <div className="mb-5 p-3 rounded-lg bg-indigo-50 border border-indigo-200/60 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-600 uppercase tracking-wide text-[10px]">
                <BookmarkCheck className="w-3.5 h-3.5" />
                Inspecting: {inspectedElement.type}
              </div>
              <p className="text-slate-700 font-medium">{inspectedElement.token}</p>
              <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] text-slate-500 pt-1 font-mono">
                {inspectedElement.bg && <div>bg: {inspectedElement.bg}</div>}
                {inspectedElement.text && <div>color: {inspectedElement.text}</div>}
                {inspectedElement.border && <div className="col-span-2">border: {inspectedElement.border}</div>}
                {inspectedElement.radius && <div>radius: {inspectedElement.radius}</div>}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-indigo-600" />
              Configure Selected
            </h3>
          </div>

          {/* DYNAMIC FORMS ACCORDING TO SELECTED CATEGORY */}
          <div className="space-y-6">

            {/* 1. PRIMARY COLOR */}
            {selectedCategory === 'primary' && (
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={localTheme.primary}
                  onChange={(val) => handleChange('primary', val)}
                />

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase">Usage Map</h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li className="flex items-center gap-2">✓ Primary Buttons</li>
                    <li className="flex items-center gap-2">✓ Active Navigation</li>
                    <li className="flex items-center gap-2">✓ Anchor Links</li>
                    <li className="flex items-center gap-2">✓ Selected Tab Highlights</li>
                    <li className="flex items-center gap-2">✓ Focus rings & States</li>
                    <li className="flex items-center gap-2">✓ Progress Indicators</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. SECONDARY COLOR */}
            {selectedCategory === 'secondary' && (
              <div className="space-y-4">
                <ColorPicker
                  label="Secondary Color"
                  value={localTheme.secondary}
                  onChange={(val) => handleChange('secondary', val)}
                />

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase">Usage Map</h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li className="flex items-center gap-2">✓ Secondary Buttons</li>
                    <li className="flex items-center gap-2">✓ Supporting Badges</li>
                    <li className="flex items-center gap-2">✓ Colored Accents</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3. BORDERS */}
            {selectedCategory === 'borders' && (
              <div className="space-y-4">
                <ColorPicker
                  label="Border Color"
                  value={localTheme.borderColor}
                  onChange={(val) => handleChange('borderColor', val)}
                />

                {/* Style */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Border Style</label>
                  <select
                    value={localTheme.borderStyle}
                    onChange={(e) => handleChange('borderStyle', e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                  </select>
                </div>

                {/* Thickness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Thickness</span>
                    <span className="text-slate-600 font-mono">{localTheme.borderThickness} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={localTheme.borderThickness}
                    onChange={(e) => handleChange('borderThickness', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Radius */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Radius</span>
                    <span className="text-slate-600 font-mono">{localTheme.borderRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={localTheme.borderRadius}
                    onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Opacity</span>
                    <span className="text-slate-600 font-mono">{localTheme.borderOpacity} %</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localTheme.borderOpacity}
                    onChange={(e) => handleChange('borderOpacity', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 4. SHADOWS */}
            {selectedCategory === 'shadows' && (
              <div className="space-y-4">
                <ColorPicker
                  label="Shadow Color"
                  value={localTheme.shadowColor}
                  onChange={(val) => handleChange('shadowColor', val)}
                />

                {/* Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Opacity</span>
                    <span className="text-slate-600 font-mono">{localTheme.shadowOpacity} %</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localTheme.shadowOpacity}
                    onChange={(e) => handleChange('shadowOpacity', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Blur */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Blur</span>
                    <span className="text-slate-600 font-mono">{localTheme.shadowBlur} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="64"
                    value={localTheme.shadowBlur}
                    onChange={(e) => handleChange('shadowBlur', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Spread */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Spread</span>
                    <span className="text-slate-600 font-mono">{localTheme.shadowSpread} px</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="20"
                    value={localTheme.shadowSpread}
                    onChange={(e) => handleChange('shadowSpread', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Offset X */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Offset X</span>
                    <span className="text-slate-600 font-mono">{localTheme.shadowOffsetX} px</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={localTheme.shadowOffsetX}
                    onChange={(e) => handleChange('shadowOffsetX', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Offset Y */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Offset Y</span>
                    <span className="text-slate-600 font-mono">{localTheme.shadowOffsetY} px</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={localTheme.shadowOffsetY}
                    onChange={(e) => handleChange('shadowOffsetY', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 5. PRIMARY TEXT */}
            {selectedCategory === 'primaryText' && (
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Text Color"
                  value={localTheme.textForeground}
                  onChange={(val) => handleChange('textForeground', val)}
                />

                {/* Font Family */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Font Family</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Inter', 'Roboto', 'Poppins', 'Outfit', 'Lato', 'System'].map((f) => (
                      <button
                        key={f}
                        onClick={() => handleChange('primaryTextFont', f)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${localTheme.primaryTextFont === f
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                        style={{ fontFamily: f === 'System' ? 'system-ui, sans-serif' : `"${f}", sans-serif` }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. SECONDARY TEXT */}
            {selectedCategory === 'secondaryText' && (
              <div className="space-y-4">
                <ColorPicker
                  label="Secondary Text Color"
                  value={localTheme.mutedText}
                  onChange={(val) => handleChange('mutedText', val)}
                />

                {/* Font Family */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Font Family</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Inter', 'Roboto', 'Poppins', 'Outfit', 'Lato', 'System'].map((f) => (
                      <button
                        key={f}
                        onClick={() => handleChange('secondaryTextFont', f)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${localTheme.secondaryTextFont === f
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                        style={{ fontFamily: f === 'System' ? 'system-ui, sans-serif' : `"${f}", sans-serif` }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. BUTTONS */}
            {selectedCategory === 'buttons' && (
              <div className="space-y-4">

                {/* Background Style Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Background Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['solid', 'gradient'].map((style) => (
                      <button
                        key={style}
                        onClick={() => handleChange('buttonBgType', style)}
                        className={`py-1.5 text-xs font-semibold capitalize rounded-lg border transition-all ${localTheme.buttonBgType === style
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Solid properties vs Gradient properties */}
                {localTheme.buttonBgType === 'solid' ? (
                  <div className="space-y-4 bg-slate-100/50 p-3 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-indigo-600 font-semibold">Button is linked to the core Primary Color:</p>
                    <ColorPicker
                      label="Primary Color"
                      value={localTheme.primary}
                      onChange={(val) => handleChange('primary', val)}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 bg-slate-100/50 p-3 rounded-lg border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase">Gradient Mix</h4>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-slate-500 select-none">
                          <input
                            type="checkbox"
                            checked={localTheme.gradientColor1Transparent ?? false}
                            onChange={(e) => handleChange('gradientColor1Transparent', e.target.checked)}
                            className="rounded border-slate-200 bg-white text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                          />
                          Trans 1
                        </label>
                        <input
                          type="color"
                          value={localTheme.gradientColor1Transparent ? '#ffffff' : localTheme.gradientColor1}
                          onChange={(e) => {
                            handleChange('gradientColor1', e.target.value);
                            handleChange('gradientColor1Transparent', false);
                          }}
                          disabled={localTheme.gradientColor1Transparent}
                          className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-transparent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-slate-500 select-none">
                          <input
                            type="checkbox"
                            checked={localTheme.gradientColor2Transparent ?? false}
                            onChange={(e) => handleChange('gradientColor2Transparent', e.target.checked)}
                            className="rounded border-slate-200 bg-white text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                          />
                          Trans 2
                        </label>
                        <input
                          type="color"
                          value={localTheme.gradientColor2Transparent ? '#ffffff' : localTheme.gradientColor2}
                          onChange={(e) => {
                            handleChange('gradientColor2', e.target.value);
                            handleChange('gradientColor2Transparent', false);
                          }}
                          disabled={localTheme.gradientColor2Transparent}
                          className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Gradient Angle */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Gradient Angle</span>
                        <span className="text-slate-600 font-mono">{localTheme.gradientAngle ?? 45}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={localTheme.gradientAngle ?? 45}
                        onChange={(e) => handleChange('gradientAngle', parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}


              </div>
            )}

            {/* 8. SCROLLBAR */}
            {selectedCategory === 'scrollbar' && (
              <div className="space-y-4">

                {/* Scrollbar style */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Scrollbar Color Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['solid', 'gradient'].map((style) => (
                      <button
                        key={style}
                        onClick={() => handleChange('scrollbarType', style)}
                        className={`py-1.5 text-xs font-semibold capitalize rounded-lg border transition-all ${localTheme.scrollbarType === style
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Configuration */}
                <div className="space-y-3 bg-slate-100/50 p-3 rounded-lg border border-slate-200">

                  {localTheme.scrollbarType === 'gradient' ? (
                    <>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase">Gradient Mix</h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-slate-500 select-none">
                            <input
                              type="checkbox"
                              checked={localTheme.scrollbarColor1Transparent ?? false}
                              onChange={(e) => handleChange('scrollbarColor1Transparent', e.target.checked)}
                              className="rounded border-slate-200 bg-white text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                            />
                            Trans 1
                          </label>
                          <input
                            type="color"
                            value={localTheme.scrollbarColor1Transparent ? '#ffffff' : (localTheme.scrollbarColor1 ?? '#7C3AED')}
                            onChange={(e) => {
                              handleChange('scrollbarColor1', e.target.value);
                              handleChange('scrollbarColor1Transparent', false);
                            }}
                            disabled={localTheme.scrollbarColor1Transparent}
                            className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-transparent"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-slate-500 select-none">
                            <input
                              type="checkbox"
                              checked={localTheme.scrollbarColor2Transparent ?? false}
                              onChange={(e) => handleChange('scrollbarColor2Transparent', e.target.checked)}
                              className="rounded border-slate-200 bg-white text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                            />
                            Trans 2
                          </label>
                          <input
                            type="color"
                            value={localTheme.scrollbarColor2Transparent ? '#ffffff' : (localTheme.scrollbarColor2 ?? '#F59E0B')}
                            onChange={(e) => {
                              handleChange('scrollbarColor2', e.target.value);
                              handleChange('scrollbarColor2Transparent', false);
                            }}
                            disabled={localTheme.scrollbarColor2Transparent}
                            className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Gradient Angle */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Gradient Angle</span>
                          <span className="text-slate-600 font-mono">{localTheme.scrollbarGradientAngle ?? 90}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={localTheme.scrollbarGradientAngle ?? 90}
                          onChange={(e) => handleChange('scrollbarGradientAngle', parseInt(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-slate-500 select-none">
                        <input
                          type="checkbox"
                          checked={localTheme.scrollbarColor1Transparent ?? false}
                          onChange={(e) => handleChange('scrollbarColor1Transparent', e.target.checked)}
                          className="rounded border-slate-200 bg-white text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                        />
                        Transparent
                      </label>
                      <ColorPicker
                        label="Scrollbar Color"
                        value={localTheme.scrollbarColor1 ?? '#7C3AED'}
                        onChange={(val) => handleChange('scrollbarColor1', val)}
                      />
                    </>
                  )}
                </div>

                {/* Thickness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Thickness</span>
                    <span className="text-slate-600 font-mono">{localTheme.scrollbarWidth ?? 6} px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={localTheme.scrollbarWidth ?? 6}
                    onChange={(e) => handleChange('scrollbarWidth', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Radius */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Radius</span>
                    <span className="text-slate-600 font-mono">{localTheme.scrollbarRadius ?? 10} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={localTheme.scrollbarRadius ?? 10}
                    onChange={(e) => handleChange('scrollbarRadius', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

          </div>

        </aside>

      </div>
    </div>
  );
}
