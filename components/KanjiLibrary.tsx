import React, { useState, useRef, useMemo } from 'react';
import type { Kanji } from '../types';
import { AddIcon, ImageIcon, TrashIcon, SpinnerIcon } from './icons';
import KanjiDetailModal from './KanjiDetailModal';

interface KanjiLibraryProps {
  kanjiList: Kanji[];
  onAddKanji: (text: string) => Promise<number>;
  onDeleteKanji: (character: string) => void;
  onAddKanjiFromImage: (base64Image: string) => Promise<number>;
  isLoading: boolean;
}

const KanjiStatusIndicator: React.FC<{ kanji: Kanji }> = ({ kanji }) => {
    const now = Date.now();
    let status: 'learned' | 'due' | 'new' | 'struggling' = 'learned';
    let tooltip = '';

    if (kanji.srsLevel === 0) {
        status = 'new';
        tooltip = 'New Kanji';
    } else if (now >= kanji.nextReviewAt) {
        status = 'due';
        tooltip = `Due for review! Next review: ${new Date(kanji.nextReviewAt).toLocaleDateString()}`;
    } else if (kanji.correctStreak === 0 && kanji.srsLevel > 0) {
        status = 'struggling';
        tooltip = `Needs practice. Next review: ${new Date(kanji.nextReviewAt).toLocaleDateString()}`;
    } else {
        tooltip = `Learned. Next review: ${new Date(kanji.nextReviewAt).toLocaleDateString()}`;
    }

    const colorClasses = {
        learned: 'bg-green-500',
        due: 'bg-yellow-400',
        new: 'bg-cyan-400',
        struggling: 'bg-red-500'
    };

    return <div className={`absolute top-1 left-1 h-2.5 w-2.5 rounded-full ${colorClasses[status]}`} title={tooltip}></div>;
};


const KanjiLibrary: React.FC<KanjiLibraryProps> = ({ kanjiList, onAddKanji, onDeleteKanji, onAddKanjiFromImage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [jlptFilter, setJlptFilter] = useState<number>(0); // 0 for all
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.debug("KanjiLibrary: handleSubmit called.");
    if (inputValue.trim()) {
      setFeedback('Processing Kanji...');
      try {
        const addedCount = await onAddKanji(inputValue);
        console.debug(`KanjiLibrary: onAddKanji returned: ${addedCount}`);
        setFeedback(`${addedCount} new Kanji added to your library.`);
        setInputValue('');
      } catch (error) {
        console.error("KanjiLibrary: Error in handleSubmit:", error);
        setFeedback('Error adding Kanji. Please try again.');
      }
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.debug("KanjiLibrary: handleImageUpload called with file:", file.name);
    setFeedback('Analyzing image...');
    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const base64String = (event.target?.result as string).split(',')[1];
                console.debug("KanjiLibrary: Image converted to base64, calling onAddKanjiFromImage.");
                const addedCount = await onAddKanjiFromImage(base64String);
                console.debug(`KanjiLibrary: onAddKanjiFromImage returned: ${addedCount}`);
                setFeedback(`Added ${addedCount} new Kanji from the image.`);
            } catch (error) {
                console.error("KanjiLibrary: Error processing image in reader.onload:", error);
                setFeedback('Error analyzing image. Please try again.');
            } finally {
               if (fileInputRef.current) fileInputRef.current.value = '';
               setTimeout(() => setFeedback(''), 4000);
            }
        };
        reader.onerror = () => {
            console.error("KanjiLibrary: FileReader error.");
            setFeedback('Error reading file.');
            setTimeout(() => setFeedback(''), 3000);
        };
        reader.readAsDataURL(file);
    } catch(err) {
        console.error("KanjiLibrary: Error in handleImageUpload:", err);
        setFeedback('An error occurred during image upload.');
    }
  };

  const filteredKanjiList = useMemo(() => {
    if (jlptFilter === 0) return kanjiList;
    return kanjiList.filter(k => k.jlptLevel === jlptFilter);
  }, [kanjiList, jlptFilter]);

  return (
    <>
      <div className="bg-theme-surface p-6 rounded-lg shadow-lg h-full flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-semibold mb-4 text-theme-accent">My Kanji Library ({filteredKanjiList.length})</h2>
        
        <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add Kanji, e.g., 猫, 新しい"
            className="flex-grow bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text"
            disabled={isLoading}
          />
          <button type="submit" className="bg-theme-primary hover:brightness-110 text-theme-primary-text font-bold p-2 rounded-md transition-all flex items-center justify-center aspect-square disabled:bg-theme-border" disabled={isLoading}>
            {isLoading ? <SpinnerIcon /> : <AddIcon />}
          </button>
        </form>

        <div className="mb-2">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" id="image-upload" disabled={isLoading}/>
          <label htmlFor="image-upload" className={`w-full cursor-pointer bg-theme-surface-2 border border-theme-border text-theme-text-muted font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-theme-border'}`}>
              <ImageIcon /> Add Kanji from Image
          </label>
        </div>
        
        {feedback && <p className="text-sm text-theme-accent mb-2 h-5">{feedback}</p>}

        <div className="mb-4">
          <select value={jlptFilter} onChange={e => setJlptFilter(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text">
              <option value={0}>Filter by JLPT Level (All)</option>
              <option value={5}>N5</option>
              <option value={4}>N4</option>
              <option value={3}>N3</option>
              <option value={2}>N2</option>
              <option value={1}>N1</option>
          </select>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          {filteredKanjiList.length === 0 ? (
            <div className="text-center text-theme-text-muted mt-8">{kanjiList.length > 0 ? 'No Kanji match the current filter.' : 'Your library is empty. Add some Kanji!'}</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2">
              {filteredKanjiList.map((kanji) => (
                <button 
                  key={kanji.character} 
                  className="group relative bg-theme-bg rounded-md p-2 flex flex-col items-center justify-center aspect-square shadow-md hover:bg-theme-surface focus:outline-none focus:ring-2 focus:ring-theme-primary transition-colors"
                  onClick={() => setSelectedKanji(kanji)}
                  aria-label={`View details for ${kanji.character}`}
                >
                  <KanjiStatusIndicator kanji={kanji} />
                  <span className="text-3xl text-theme-text">{kanji.character}</span>
                  <div className="text-xs text-theme-text-muted">{kanji.jlptLevel ? `N${kanji.jlptLevel}` : 'N/A'}</div>
                  <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent modal from opening when deleting
                        onDeleteKanji(kanji.character);
                    }}
                    className="absolute top-0 right-0 m-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete kanji ${kanji.character}`}
                  >
                    <TrashIcon />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <KanjiDetailModal kanji={selectedKanji} onClose={() => setSelectedKanji(null)} />
    </>
  );
};

export default KanjiLibrary;
