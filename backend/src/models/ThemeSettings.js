const mongoose = require('mongoose');

const themeSettingsSchema = new mongoose.Schema({
  primary: { type: String, default: '#150f29' },
  secondary: { type: String, default: '#7C3AED' },
  accent: { type: String, default: '#F59E0B' },
  background: { type: String, default: '#FFFFFF' },
  surface: { type: String, default: '#F8FAFC' },
  textForeground: { type: String, default: '#0F172A' },
  mutedText: { type: String, default: '#64748B' },
  border: { type: String, default: '#E2E8F0' },
  input: { type: String, default: '#FFFFFF' },
  primaryText: { type: String, default: '#FFFFFF' },
  secondaryText: { type: String, default: '#FFFFFF' },
  shadow: { type: Number, default: 8 }, // shadow intensity percentage (e.g. 8 for 8%)
  buttonBgType: { type: String, default: 'solid' }, // 'solid' or 'gradient'
  gradientColor1: { type: String, default: '#7C3AED' },
  gradientColor2: { type: String, default: '#F59E0B' },
  gradientColor1Transparent: { type: Boolean, default: false },
  gradientColor2Transparent: { type: Boolean, default: false },
  gradientAngle: { type: Number, default: 45 }, // degrees
  // Scrollbar customization
  scrollbarWidth: { type: Number, default: 6 }, // px
  scrollbarType: { type: String, default: 'solid' }, // 'solid' or 'gradient'
  scrollbarColor1: { type: String, default: '#7C3AED' },
  scrollbarColor2: { type: String, default: '#F59E0B' },
  scrollbarColor1Transparent: { type: Boolean, default: false },
  scrollbarColor2Transparent: { type: Boolean, default: false },
  scrollbarGradientAngle: { type: Number, default: 90 },
  // Extended borders
  borderColor: { type: String, default: '#E2E8F0' },
  borderThickness: { type: Number, default: 1 },
  borderStyle: { type: String, default: 'solid' },
  borderRadius: { type: Number, default: 8 },
  borderOpacity: { type: Number, default: 100 },
  // Extended shadows
  shadowColor: { type: String, default: '#000000' },
  shadowOpacity: { type: Number, default: 8 },
  shadowBlur: { type: Number, default: 12 },
  shadowSpread: { type: Number, default: 0 },
  shadowOffsetX: { type: Number, default: 0 },
  shadowOffsetY: { type: Number, default: 4 },
  // Extended primary text
  primaryTextFont: { type: String, default: 'Inter' },
  primaryTextWeight: { type: String, default: 'Normal' },
  primaryTextStyle: { type: String, default: 'Normal' },
  primaryTextSize: { type: Number, default: 16 },
  primaryTextLineHeight: { type: Number, default: 1.5 },
  // Extended secondary text
  secondaryTextFont: { type: String, default: 'Inter' },
  secondaryTextWeight: { type: String, default: 'Normal' },
  secondaryTextStyle: { type: String, default: 'Normal' },
  secondaryTextSize: { type: Number, default: 14 },
  secondaryTextLineHeight: { type: Number, default: 1.5 },
  // Extended buttons
  buttonTextColor: { type: String, default: '#FFFFFF' },
  buttonBorderColor: { type: String, default: '#4271FF' },
  buttonBorderThickness: { type: Number, default: 1 },
  buttonBorderRadius: { type: Number, default: 8 },
  buttonHoverBrightness: { type: Number, default: 95 },
  // Extended scrollbar
  scrollbarRadius: { type: Number, default: 10 },
  scrollbarColor1Opacity: { type: Number, default: 100 },
  scrollbarColor2Opacity: { type: Number, default: 100 },
}, { timestamps: true });

module.exports = mongoose.model('ThemeSettings', themeSettingsSchema);
