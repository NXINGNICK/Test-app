import React, { useState, useRef, useMemo } from 'react';
import type { Kanji, VocabularyItem } from '../types';
import { AddIcon, ImageIcon, TrashIcon, SpinnerIcon, CloseIcon, SearchIcon } from './icons';
import KanjiDetailModal from './KanjiDetailModal';

interface KanjiLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  kanjiList: Kanji[];
  vocabList: VocabularyItem[];
  onAddKanji: (text: string) => Promise<number>;
  onDeleteKanji: (character: string) => void;
  onDeleteVocabularyItem: (word: string) => void;
  onAddKanjiFromImage: (base64Image: string) => Promise<number>;
  isLoading: boolean;
}

const MASTERED_SRS_LEVEL = 7;

const KATAKANA_LIST = [
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', 'ユ', 'ヨ',
  'ラ', 'リ', 'ル', 'レ', 'ロ',
  'ワ', 'ヲ', 'ン',
  'ガ', 'ギ', 'グ', 'ゲ', 'ゴ',
  'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ',
  'ダ', 'ヂ', 'ヅ', 'デ', 'ド',
  'バ', 'ビ', 'ブ', 'ベ', 'ボ',
  'パ', 'ピ', 'プ', 'ペ', 'ポ'
];


const KanjiStatusIndicator: React.FC<{ kanji: Kanji }> = ({ kanji }) => {
    const now = Date.now();
    let status: 'mastered' | 'learning' | 'due' | 'new' | 'leech' = 'mastered';
    let tooltip = '';
    let colorClasses = '';

    if (kanji.srsLevel === 0) {
        status = 'new';
        tooltip = 'New Kanji';
        colorClasses = 'bg-cyan-400 border-cyan-300';
    } else if (now >= kanji.nextReviewAt) {
        status = 'due';
        tooltip = `Due for review! SRS Level: ${kanji.srsLevel}`;
        colorClasses = 'bg-yellow-400 border-yellow-300';
    } else if (kanji.srsLevel > 0 && kanji.srsLevel <= 3 && kanji.correctStreak <= 1) {
        status = 'leech';
        tooltip = `Leech! Needs extra practice. SRS Level: ${kanji.srsLevel}`;
        colorClasses = 'bg-red-500 border-red-400';
    } else if (kanji.srsLevel < MASTERED_SRS_LEVEL) {
        status = 'learning';
        tooltip = `Learning. Next review: ${new Date(kanji.nextReviewAt).toLocaleDateString()}. SRS Level: ${kanji.srsLevel}`;
        colorClasses = 'bg-green-500 border-green-400';
    } else {
        tooltip = `Mastered! Next review: ${new Date(kanji.nextReviewAt).toLocaleDateString()}. SRS Level: ${kanji.srsLevel}`;
        colorClasses = 'bg-indigo-500 border-indigo-400';
    }

    return <div className={`absolute top-1 left-1 h-2.5 w-2.5 rounded-full border-2 ${colorClasses}`} title={tooltip}></div>;
};


const KanjiLibrary: React.FC<KanjiLibraryProps> = ({ isOpen, onClose, kanjiList, vocabList, onAddKanji, onDeleteKanji, onDeleteVocabularyItem, onAddKanjiFromImage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  const [activeTab, setActiveTab] = useState<'kanji' | 'vocab' | 'katakana'>('kanji');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setFeedback('Processing Kanji...');
      try {
        const addedCount = await onAddKanji(inputValue);
        setFeedback(`${addedCount} new Kanji added to your library.`);
        setInputValue('');
      } catch (error) {
        setFeedback('Error adding Kanji. Please try again.');
      }
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback('Analyzing image...');
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const base64String = (event.target?.result as string).split(',')[1];
            const addedCount = await onAddKanjiFromImage(base64String);
            setFeedback(`Added ${addedCount} new Kanji from the image.`);
        } catch (error) {
            setFeedback('Error analyzing image. Please try again.');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => setFeedback(''), 4000);
        }
    };
    reader.readAsDataURL(file);
  };

  const filteredKanjiList = useMemo(() => {
    return kanjiList.filter(k => k.character.includes(searchTerm));
  }, [kanjiList, searchTerm]);

  const filteredVocabList = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return vocabList.filter(v => 
        v.word.toLowerCase().includes(lowercasedTerm) || 
        v.reading.toLowerCase().includes(lowercasedTerm) ||
        v.definition.toLowerCase().includes(lowercasedTerm)
    );
  }, [vocabList, searchTerm]);
  
  const filteredKatakanaList = useMemo(() => {
    return KATAKANA_LIST.filter(k => k.includes(searchTerm));
  }, [searchTerm]);

  const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none w-full ${isActive ? 'bg-theme-bg text-theme-accent' : 'text-theme-text-muted hover:bg-theme-border/50'}`}
    >
        {label}
    </button>
  );

  return (
    <>
      <aside className={`fixed top-0 left-0 h-full bg-theme-surface border-r border-theme-border z-30 w-full max-w-sm md:max-w-md lg:w-96 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-theme-text">My Library</h2>
                <button onClick={onClose} className="text-theme-text-muted hover:text-theme-text lg:hidden"><CloseIcon/></button>
            </div>

            <div className="bg-theme-border rounded-lg p-1 flex mb-4">
                <TabButton label={`Kanji (${kanjiList.length})`} isActive={activeTab === 'kanji'} onClick={() => setActiveTab('kanji')} />
                <TabButton label={`Vocabulary (${vocabList.length})`} isActive={activeTab === 'vocab'} onClick={() => setActiveTab('vocab')} />
                <TabButton label="Katakana" isActive={activeTab === 'katakana'} onClick={() => setActiveTab('katakana')} />
            </div>
            
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon />
                </div>
            </div>

            {activeTab === 'kanji' ? (
                <div className="flex flex-col flex-grow min-h-0">
                    <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Add Kanji, e.g., 猫, 新しい" className="flex-grow bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text" disabled={isLoading} />
                        <button type="submit" className="bg-theme-primary hover:brightness-110 text-theme-primary-text font-bold p-2 rounded-md transition-all flex items-center justify-center aspect-square disabled:bg-theme-border" disabled={isLoading}>{isLoading ? <SpinnerIcon /> : <AddIcon />}</button>
                    </form>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" id="image-upload" disabled={isLoading}/>
                    <label htmlFor="image-upload" className={`w-full cursor-pointer bg-theme-bg border border-theme-border text-theme-text-muted font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-theme-border'}`}>
                        <ImageIcon /> Add from Image
                    </label>
                    {feedback && <p className="text-sm text-theme-accent mt-2 h-5 text-center">{feedback}</p>}

                    <div className="flex-grow overflow-y-auto pr-2 -mr-4 mt-4 custom-scrollbar">
                        {filteredKanjiList.length === 0 ? (
                            <div className="text-center text-theme-text-muted pt-8">{kanjiList.length > 0 ? 'No Kanji match your search.' : 'Your library is empty. Add some Kanji!'}</div>
                        ) : (
                            <div className="grid grid-cols-5 gap-2">
                            {filteredKanjiList.map((kanji) => (
                                <button key={kanji.character} className="group relative bg-theme-bg rounded-md p-2 flex flex-col items-center justify-center aspect-square shadow-md hover:bg-theme-border focus:outline-none focus:ring-2 focus:ring-theme-primary transition-all duration-150 ease-in-out hover:scale-105" onClick={() => setSelectedKanji(kanji)} aria-label={`View details for ${kanji.character}`}>
                                    <KanjiStatusIndicator kanji={kanji} />
                                    <span className="text-3xl text-theme-text">{kanji.character}</span>
                                    <div className="text-xs text-theme-text-muted">{kanji.jlptLevel ? `N${kanji.jlptLevel}` : ''}</div>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteKanji(kanji.character); }} className="absolute -top-1 -right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete kanji ${kanji.character}`}><TrashIcon /></button>
                                </button>
                            ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'vocab' ? (
                <div className="flex-grow overflow-y-auto pr-2 -mr-4 custom-scrollbar">
                    {filteredVocabList.length === 0 ? (
                        <div className="text-center text-theme-text-muted pt-8">{vocabList.length > 0 ? 'No vocabulary match your search.' : 'Your vocabulary is empty.'}</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredVocabList.map(item => (
                                <div key={item.word} className="bg-theme-bg p-3 rounded-md flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <p className="text-lg text-theme-text">{item.word} <span className="text-sm text-theme-accent ml-2">{item.reading}</span></p>
                                        <p className="text-sm text-theme-text-muted italic">"{item.definition}"</p>
                                    </div>
                                    <button onClick={() => onDeleteVocabularyItem(item.word)} className="text-red-400/70 hover:text-red-400 p-1" aria-label={`Delete vocabulary ${item.word}`}><TrashIcon/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                 <div className="flex-grow overflow-y-auto pr-2 -mr-4 custom-scrollbar">
                    {filteredKatakanaList.length === 0 ? (
                        <div className="text-center text-theme-text-muted pt-8">No Katakana match your search.</div>
                    ) : (
                        <div className="grid grid-cols-5 gap-2">
                        {filteredKatakanaList.map((char) => (
                            <div key={char} className="bg-theme-bg rounded-md p-2 flex items-center justify-center aspect-square shadow-md">
                                <span className="text-3xl text-theme-text">{char}</span>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </aside>
      <KanjiDetailModal kanji={selectedKanji} onClose={() => setSelectedKanji(null)} />
    </>
  );
};

export default KanjiLibrary;