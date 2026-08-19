import React from 'react';
import PromptBuilder from './pages/PromptBuilder';
import { Hammer } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">PromptForge</h1>
          <span className="ml-auto text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
            AI-Native Build Sprint
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <PromptBuilder />
      </main>
    </div>
  );
}

export default App;