import React, { useState, useEffect } from 'react';
import { useTheme, defaultTheme, ThemeColors } from '../contexts/ThemeContext';
import { CloseIcon } from './icons';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Color Utility Functions ---
const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
};

const getBrightness = (rgb: [number, number, number]): number => {
  // Using perceptive luminance formula
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]);
};

const parseCoolorsUrl = (url: string): string[] => {
  try {
    const parts = url.split('/');
    const colorString = parts[parts.length - 1];
    return colorString.split('-').map(c => `#${c}`);
  } catch (e) {
    return [];
  }
};

const mapPaletteToTheme = (palette: string[]): ThemeColors => {
    if (palette.length < 5) return defaultTheme;

    const colorsWithBrightness = palette.map(hex => {
        const rgb = hexToRgb(hex);
        return { hex, brightness: rgb ? getBrightness(rgb) : -1 };
    }).filter(c => c.brightness !== -1).sort((a, b) => a.brightness - b.brightness);

    const [darkest, dark2, mid, light1, lightest] = colorsWithBrightness;
    
    const textOnPrimary = getBrightness(hexToRgb(darkest.hex)!) > 128 ? '#000000' : '#FFFFFF';

    return {
        bg: darkest.hex,
        surface: dark2.hex,
        border: mid.hex,
        text: lightest.hex,
        'text-muted': light1.hex,
        primary: mid.hex,
        secondary: light1.hex,
        accent: light1.hex,
        'primary-text': textOnPrimary,
    };
};


const ColorInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: keyof ThemeColors }> = ({ label, name, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-theme-text-muted capitalize">{label.replace('-', ' ')}</label>
        <div className="flex items-center gap-2 border border-theme-border rounded-md px-2">
            <span className="text-theme-text-muted text-sm">{value}</span>
            <input 
                type="color" 
                id={name} 
                name={name}
                value={value}
                onChange={onChange}
                className="w-8 h-8 bg-transparent border-none cursor-pointer"
            />
        </div>
    </div>
);

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, resetTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<ThemeColors>(theme);
  const [coolorsUrl, setCoolorsUrl] = useState('');

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalTheme(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyUrl = () => {
    const palette = parseCoolorsUrl(coolorsUrl);
    if (palette.length > 0) {
        const newTheme = mapPaletteToTheme(palette);
        setLocalTheme(newTheme);
    }
  };

  const handleSave = () => {
    setTheme(localTheme);
    onClose();
  };
  
  const handleReset = () => {
    resetTheme();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-theme-surface rounded-lg shadow-2xl p-6 w-full max-w-md relative border border-theme-border flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-theme-accent">Customize Theme</h2>
            <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text transition-colors"
            aria-label="Close theme customizer"
            >
                <CloseIcon />
            </button>
        </div>

        <div>
            <label htmlFor="coolors-url" className="block text-sm font-medium text-theme-text-muted mb-1">Coolors.co URL</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    id="coolors-url"
                    placeholder="https://coolors.co/..."
                    value={coolorsUrl}
                    onChange={(e) => setCoolorsUrl(e.target.value)}
                    className="flex-grow bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text"
                />
                <button onClick={handleApplyUrl} className="bg-theme-secondary hover:brightness-110 text-theme-primary-text font-bold px-4 rounded-md transition-all">Apply</button>
            </div>
        </div>
        
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-theme-text">Manual Colors</h3>
            {Object.entries(localTheme).map(([key, value]) => (
                <ColorInput 
                    key={key}
                    label={key}
                    name={key as keyof ThemeColors}
                    value={value}
                    onChange={handleColorChange}
                />
            ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
            <button onClick={handleReset} className="bg-theme-bg border border-theme-border hover:bg-theme-border text-theme-text-muted font-bold py-2 px-4 rounded-md transition-all">Reset to Default</button>
            <button onClick={handleSave} className="bg-theme-primary hover:brightness-110 text-theme-primary-text font-bold py-2 px-4 rounded-md transition-all">Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
