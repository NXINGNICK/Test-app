import React, { useState } from 'react';
import Header from './components/Header';
import KanjiLibrary from './components/KanjiLibrary';
import SentenceGenerator from './components/SentenceGenerator';
import { useKanjiLibrary } from './hooks/useKanjiLibrary';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeCustomizer from './components/ThemeCustomizer';

const App: React.FC = () => {
  const { kanjiList, addKanji, deleteKanji, updateKanjiUsage, isLoading, addKanjiFromImage, updateKanjiReview } = useKanjiLibrary();
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-theme-bg font-sans">
        <Header onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)} />
        <main className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <KanjiLibrary 
              kanjiList={kanjiList}
              onAddKanji={addKanji}
              onDeleteKanji={deleteKanji}
              onAddKanjiFromImage={addKanjiFromImage}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <SentenceGenerator 
              kanjiList={kanjiList}
              onUpdateKanjiUsage={updateKanjiUsage}
              onUpdateKanjiReview={updateKanjiReview}
            />
          </div>
        </main>
        <ThemeCustomizer 
          isOpen={isThemeCustomizerOpen}
          onClose={() => setIsThemeCustomizerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;
