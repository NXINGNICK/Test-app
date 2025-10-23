import React from 'react';
import Header from './components/Header';
import KanjiLibrary from './components/KanjiLibrary';
import SentenceGenerator from './components/SentenceGenerator';
import { useKanjiLibrary } from './hooks/useKanjiLibrary';

const App: React.FC = () => {
  const { kanjiList, addKanji, deleteKanji, updateKanjiUsage, isLoading, addKanjiFromImage, updateKanjiReview } = useKanjiLibrary();

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header />
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
    </div>
  );
};

export default App;
