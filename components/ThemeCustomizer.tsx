import React, { useState, useEffect } from 'react';
import { useTheme, defaultTheme, ThemeColors } from '../contexts/ThemeContext';
import { CloseIcon, KeyIcon, SpinnerIcon } from './icons';
import { getWaniKaniApiKey, setWaniKaniApiKey, validateApiKey } from '../services/wanikaniService';

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
    const textOnPrimary = getBrightness(hexToRgb(mid.hex)!) > 128 ? '#000000' : '#FFFFFF';
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
            <input type="color" id={name} name={name} value={value} onChange={onChange} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
    </div>
);

const ThemeSettings: React.FC = () => {
    const { theme, setTheme, resetTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState<ThemeColors>(theme);
    const [coolorsUrl, setCoolorsUrl] = useState('');

    useEffect(() => { setLocalTheme(theme) }, [theme]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalTheme(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyUrl = () => {
        const palette = parseCoolorsUrl(coolorsUrl);
        if (palette.length > 0) {
            setLocalTheme(mapPaletteToTheme(palette));
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="coolors-url" className="block text-sm font-medium text-theme-text-muted mb-1">Coolors.co URL</label>
                <div className="flex gap-2">
                    <input type="text" id="coolors-url" placeholder="https://coolors.co/..." value={coolorsUrl} onChange={(e) => setCoolorsUrl(e.target.value)} className="flex-grow bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text" />
                    <button onClick={handleApplyUrl} className="bg-theme-secondary hover:brightness-110 text-theme-primary-text font-bold px-4 rounded-md transition-all">Apply</button>
                </div>
            </div>
            <div className="space-y-3">
                <h3 className="text-lg font-medium text-theme-text">Manual Colors</h3>
                {Object.entries(localTheme).map(([key, value]) => ( <ColorInput key={key} label={key} name={key as keyof ThemeColors} value={value} onChange={handleColorChange} /> ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button onClick={() => setLocalTheme(defaultTheme)} className="bg-theme-bg border border-theme-border hover:bg-theme-border text-theme-text-muted font-bold py-2 px-4 rounded-md transition-all">Reset</button>
                <button onClick={() => setTheme(localTheme)} className="bg-theme-primary hover:brightness-110 text-theme-primary-text font-bold py-2 px-4 rounded-md transition-all">Save Theme</button>
            </div>
        </div>
    );
};

const IntegrationsSettings: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        setApiKey(getWaniKaniApiKey() || '');
    }, []);

    const handleSave = async () => {
        setIsValidating(true);
        setFeedback('Validating key...');
        const isValid = await validateApiKey(apiKey);
        setIsValidating(false);
        if (isValid) {
            setWaniKaniApiKey(apiKey);
            setFeedback('API Key is valid and saved!');
        } else {
            setFeedback('Invalid API Key. Please check and try again.');
        }
        setTimeout(() => setFeedback(''), 4000);
    };

    return (
        <div className="space-y-4">
             <div>
                <label htmlFor="wk-key" className="flex items-center gap-2 text-sm font-medium text-theme-text-muted mb-1">
                    <KeyIcon/> WaniKani API v2 Key
                </label>
                <p className="text-xs text-theme-text-muted mb-2">Your key is stored only in your browser. Find it on your <a href="https://www.wanikani.com/settings/personal_access_tokens" target="_blank" rel="noopener noreferrer" className="text-theme-accent hover:underline">WaniKani settings page</a>.</p>
                <div className="flex gap-2">
                    <input type="password" id="wk-key" placeholder="Enter your API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-grow bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text" />
                    <button onClick={handleSave} disabled={isValidating} className="bg-theme-secondary hover:brightness-110 text-theme-primary-text font-bold px-4 rounded-md transition-all flex items-center justify-center w-24">
                        {isValidating ? <SpinnerIcon/> : 'Save'}
                    </button>
                </div>
                {feedback && <p className="text-sm text-theme-accent mt-2 h-5">{feedback}</p>}
            </div>
        </div>
    );
};


const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'integrations'>('theme');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors focus:outline-none ${isActive ? 'bg-theme-surface border-theme-border border-b-0 text-theme-accent' : 'bg-theme-bg/50 text-theme-text-muted hover:bg-theme-surface/50'}`}>
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-theme-surface rounded-lg shadow-2xl w-full max-w-lg relative border border-theme-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-theme-border">
            <h2 className="text-xl font-semibold text-theme-accent">Settings</h2>
            <button onClick={onClose} className="text-theme-text-muted hover:text-theme-text transition-colors" aria-label="Close settings"><CloseIcon /></button>
        </div>
        <div className="flex border-b border-theme-border px-4">
            <TabButton label="Theme" isActive={activeTab === 'theme'} onClick={() => setActiveTab('theme')} />
            <TabButton label="Integrations" isActive={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
        </div>
        <div className="p-6">
            {activeTab === 'theme' ? <ThemeSettings /> : <IntegrationsSettings />}
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
