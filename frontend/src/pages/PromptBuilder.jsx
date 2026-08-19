import React, { useState } from 'react';
import { analyzePrompt, generateFinalPrompt } from '../services/api';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Copy, Sparkles } from 'lucide-react';

export default function PromptBuilder() {
  // Wizard State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [roughPrompt, setRoughPrompt] = useState('');
  const [technique, setTechnique] = useState('RTF');
  
  // LLM #1 State
  const [components, setComponents] = useState({});
  const [missingInfo, setMissingInfo] = useState([]);

  // LLM #2 State
  const [finalResult, setFinalResult] = useState(null);

  // --- Handlers ---
  
  const handleAnalyze = async () => {
    if (!roughPrompt.trim()) return setError("Please enter a rough prompt.");
    
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePrompt(roughPrompt, technique);
      
      // Separate the missing_information from the editable components
      const { missing_information, ...editableComponents } = data.components;
      setComponents(editableComponents);
      setMissingInfo(missing_information || []);
      
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to analyze prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateFinalPrompt(technique, components);
      setFinalResult(data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate final prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleComponentChange = (key, value) => {
    setComponents(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalResult.final_prompt);
    alert("Copied to clipboard!");
  };

  // --- Render Steps ---

  return (
    <div className="space-y-6">
      
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded"></div>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded transition-all duration-300`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {['Describe', 'Refine', 'Generate'].map((label, index) => (
          <div key={label} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step > index ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {index + 1}
            </div>
            <span className={`text-xs font-semibold ${step > index ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: DESCRIBE */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">What do you want the AI to do?</label>
            <textarea
              className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="E.g., Create a marketing plan for my college tech event..."
              value={roughPrompt}
              onChange={(e) => setRoughPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Prompting Framework</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'RTF', label: 'Role, Task, Format' },
                { id: 'RTC', label: 'Role, Task, Context' },
                { id: 'GCO', label: 'Goal, Constraint, Output' },
                { id: 'FEW_SHOT', label: 'Few-Shot Examples' }
              ].map(tech => (
                <button
                  key={tech.id}
                  onClick={() => setTechnique(tech.id)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${technique === tech.id ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {tech.id}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? "Analyzing..." : "Analyze & Structure"}
          </button>
        </div>
      )}

      {/* STEP 2: REFINE (The Human-in-the-Loop part) */}
      {step === 2 && (
        <div className="space-y-6">
          {missingInfo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <h4 className="text-amber-800 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> 
                AI Note: Missing Information
              </h4>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                {missingInfo.map((info, idx) => <li key={idx}>{info}</li>)}
              </ul>
              <p className="text-xs text-amber-600 mt-2 italic">Add these details into the fields below for a better final prompt.</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">Review & Edit Structured Components</h3>
            
            {Object.keys(components).map((key) => {
              if (key === 'examples' || key === 'constraints') return null; // Handle arrays separately if needed, simplified for sprint
              
              return (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 capitalize">{key.replace('_', ' ')}</label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    value={components[key] || ''}
                    onChange={(e) => handleComponentChange(key, e.target.value)}
                    placeholder={`Enter ${key}...`}
                  />
                </div>
              )
            })}

            {/* Quick array handler for constraints */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Constraints (comma separated)</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                value={Array.isArray(components.constraints) ? components.constraints.join(', ') : (components.constraints || '')}
                onChange={(e) => handleComponentChange('constraints', e.target.value.split(',').map(s => s.trim()))}
                placeholder="E.g., No jargon, Max 500 words"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {loading ? "Generating..." : "Build Final Prompt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: GENERATE */}
      {step === 3 && finalResult && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <h3 className="font-bold text-xl text-slate-800">Final Prompt Ready</h3>
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Score: {finalResult.score} / 100
              </div>
            </div>

            <div className="relative">
              <pre className="w-full bg-slate-900 text-slate-50 p-5 rounded-lg whitespace-pre-wrap font-mono text-sm leading-relaxed overflow-x-auto">
                {finalResult.final_prompt}
              </pre>
              <button 
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors flex items-center gap-2 text-xs font-semibold backdrop-blur-sm"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quality Checks</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(finalResult.checks).map(([key, passed]) => (
                  <span key={key} className={`px-3 py-1 text-xs font-bold rounded-full border ${passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {passed ? '✓' : '○'} {key.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button onClick={() => { setStep(1); setRoughPrompt(''); }} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                Start a New Prompt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}