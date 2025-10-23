import React, { useState } from 'react';
import Header from './components/Header';
import KanjiLibrary from './components/KanjiLibrary';
import SentenceGenerator from './components/SentenceGenerator';
import { useKanjiLibrary } from './hooks/useKanjiLibrary';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeCustomizer from './components/ThemeCustomizer';
import { useVocabularyLibrary } from './hooks/useVocabularyLibrary';

const App: React.FC = () => {
  const { kanjiList, addKanji, deleteKanji, updateKanjiUsage, isLoading, addKanjiFromImage, updateKanjiReview } = useKanjiLibrary();
  const { vocabList, addVocabularyItem, deleteVocabularyItem } = useVocabularyLibrary();
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-theme-bg font-sans flex">
        <KanjiLibrary 
            isOpen={isLibraryOpen}
            onClose={() => setIsLibraryOpen(false)}
            kanjiList={kanjiList}
            onAddKanji={addKanji}
            onDeleteKanji={deleteKanji}
            onAddKanjiFromImage={addKanjiFromImage}
            isLoading={isLoading}
            vocabList={vocabList}
            onDeleteVocabularyItem={deleteVocabularyItem}
        />
        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isLibraryOpen ? 'lg:ml-[384px]' : 'ml-0'}`}>
            <Header 
              onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)} 
              onToggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
              isLibraryOpen={isLibraryOpen}
            />
            <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
              <SentenceGenerator 
                kanjiList={kanjiList}
                onUpdateKanjiUsage={updateKanjiUsage}
                onUpdateKanjiReview={updateKanjiReview}
                vocabList={vocabList}
                onAddVocabularyItem={addVocabularyItem}
                onAddKanji={addKanji}
              />
            </main>
        </div>
        <ThemeCustomizer 
          isOpen={isThemeCustomizerOpen}
          onClose={() => setIsThemeCustomizerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;