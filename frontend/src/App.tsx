import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Send, 
  Download, 
  RefreshCcw, 
  ChevronLeft, 
  Eye, 
  CircleCheck, 
  LoaderCircle,
  Layout,
  Zap,
  ArrowLeft,
  Globe,
  X 
} from 'lucide-react';

// Custom Brand Icons (Removed from Lucide 1.0+)
const Github = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

interface Template {
  id: string;
  name: string;
  desc: string;
  color: string;
  accent: string;
}

const TEMPLATES: Template[] = [
  { 
    id: '1', 
    name: 'Dark Executive', 
    desc: 'Navy + Teal / Purple', 
    color: 'bg-slate-900', 
    accent: 'from-teal-400 to-indigo-500' 
  },
  { 
    id: '2', 
    name: 'Corporate Pro', 
    desc: 'White + Ocean Blue', 
    color: 'bg-white', 
    accent: 'from-sky-600 to-blue-700' 
  },
  { 
    id: '3', 
    name: 'Bold Slate', 
    desc: 'Dark Slate + Amber', 
    color: 'bg-slate-800', 
    accent: 'from-amber-500 to-orange-600' 
  },
];

export default function App() {
  const [requirements, setRequirements] = useState('');
  const [githubUrl, setGithubUrl] = useState('https://github.com/alihassanml/');
  const [selectedTemplate, setSelectedTemplate] = useState('1');
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState('1');
  const [timelineValue, setTimelineValue] = useState('4');
  const [timelineUnit, setTimelineUnit] = useState('weeks');

  // Editor State
  const [editorMode, setEditorMode] = useState(false);
  const [proposalContent, setProposalContent] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('requirements', requirements);
      formData.append('github_url', githubUrl);
      formData.append('template', selectedTemplate);
      formData.append('timeline', `${timelineValue} ${timelineUnit}`);

      const response = await axios.post(`${API_BASE_URL}/generate`, formData);
      setProposalContent(response.data.content);
      setBranding(response.data.branding);
      setEditorMode(true);
      
      // Initial render scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate proposal. Please check your API connection.');
    } finally {
      setLoading(false);
    }
  };

  // Live Preview Update
  useEffect(() => {
    if (!editorMode || !proposalContent) return;

    const timer = setTimeout(async () => {
      setIsRendering(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/render-preview`, {
          content: proposalContent,
          branding: branding,
          template: selectedTemplate
        });
        setPreviewHtml(response.data);
      } catch (error) {
        console.error('Preview render failed:', error);
      } finally {
        setIsRendering(false);
      }
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [proposalContent, branding, selectedTemplate, editorMode]);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/download-pdf`, {
        content: proposalContent,
        branding: branding,
        template: selectedTemplate
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'proposal.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (editorMode) {
    return (
      <div className="min-h-screen bg-[#050a15] text-slate-200 flex flex-col">
        {/* Editor Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setEditorMode(false)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <FileText size={18} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-white">Proposal Editor</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/50 border border-slate-800 rounded-full text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              <div className={`w-1.5 h-1.5 rounded-full ${isRendering ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isRendering ? 'Rendering Preview...' : 'Changes Saved'}
            </div>
            <button 
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Download size={18} />}
              Export PDF
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Left Side: Editor GUI */}
          <div className="w-[450px] border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-8 custom-scrollbar">
            <div className="space-y-10">
              {/* Template Quick Switch */}
              <section>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">Select Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-2 rounded-xl border transition-all text-center ${selectedTemplate === t.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${t.accent} mb-1`} />
                      <div className="text-[10px] font-bold text-white truncate">{t.name}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Title & Opening */}
              <section className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block">General Info</label>
                <div className="space-y-3">
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Proposal Title"
                    value={proposalContent.title}
                    onChange={e => setProposalContent({...proposalContent, title: e.target.value})}
                  />
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white min-h-[120px] focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Opening Statement"
                    value={proposalContent.opening}
                    onChange={e => setProposalContent({...proposalContent, opening: e.target.value})}
                  />
                </div>
              </section>

              {/* Problem Analysis */}
              <section className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block">The Challenge</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white min-h-[150px] focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Analyze the problem..."
                  value={proposalContent.problem_analysis}
                  onChange={e => setProposalContent({...proposalContent, problem_analysis: e.target.value})}
                />
              </section>

              {/* Implementation Steps */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block">Implementation Plan</label>
                  <button 
                    onClick={() => {
                      const newSteps = [...proposalContent.implementation_plan, { step: "New Step", detail: "Description here..." }];
                      setProposalContent({...proposalContent, implementation_plan: newSteps});
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                  >
                    <div className="w-4 h-4 rounded-full border border-teal-500/50 flex items-center justify-center">+</div>
                    Add Step
                  </button>
                </div>
                
                <div className="space-y-3">
                  {proposalContent.implementation_plan.map((step: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative group">
                      <button 
                        onClick={() => {
                          const newSteps = proposalContent.implementation_plan.filter((_: any, i: number) => i !== idx);
                          setProposalContent({...proposalContent, implementation_plan: newSteps});
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 text-red-500 rounded-full border border-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <input 
                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-teal-400 mb-2 focus:ring-0"
                        value={step.step}
                        onChange={e => {
                          const newSteps = [...proposalContent.implementation_plan];
                          newSteps[idx].step = e.target.value;
                          setProposalContent({...proposalContent, implementation_plan: newSteps});
                        }}
                      />
                      <textarea 
                        className="w-full bg-transparent border-none p-0 text-xs text-slate-400 min-h-[60px] focus:ring-0 leading-relaxed"
                        value={step.detail}
                        onChange={e => {
                          const newSteps = [...proposalContent.implementation_plan];
                          newSteps[idx].detail = e.target.value;
                          setProposalContent({...proposalContent, implementation_plan: newSteps});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Challenges */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block">Real Challenges Solved</label>
                  <button
                    onClick={() => {
                      const newC = [...(proposalContent.challenges || []), { problem: "Problem Name", solution: "Specific mechanism..." }];
                      setProposalContent({...proposalContent, challenges: newC});
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                  >
                    <div className="w-4 h-4 rounded-full border border-teal-500/50 flex items-center justify-center">+</div>
                    Add Challenge
                  </button>
                </div>
                <div className="space-y-3">
                  {(proposalContent.challenges || []).map((c: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative group">
                      <button
                        onClick={() => {
                          const newC = (proposalContent.challenges || []).filter((_: any, i: number) => i !== idx);
                          setProposalContent({...proposalContent, challenges: newC});
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 text-red-500 rounded-full border border-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <input
                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-amber-400 mb-2 focus:ring-0"
                        placeholder="Problem name"
                        value={c.problem}
                        onChange={e => {
                          const newC = [...(proposalContent.challenges || [])];
                          newC[idx].problem = e.target.value;
                          setProposalContent({...proposalContent, challenges: newC});
                        }}
                      />
                      <textarea
                        className="w-full bg-transparent border-none p-0 text-xs text-slate-400 min-h-[60px] focus:ring-0 leading-relaxed"
                        placeholder="Specific mechanism used..."
                        value={c.solution}
                        onChange={e => {
                          const newC = [...(proposalContent.challenges || [])];
                          newC[idx].solution = e.target.value;
                          setProposalContent({...proposalContent, challenges: newC});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Portfolio */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block">Relevant Portfolio</label>
                  <button
                    onClick={() => {
                      const newPort = [...(proposalContent.portfolio || []), { name: "Project Name", summary: "Summary...", url: "" }];
                      setProposalContent({...proposalContent, portfolio: newPort});
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                  >
                    <div className="w-4 h-4 rounded-full border border-teal-500/50 flex items-center justify-center">+</div>
                    Add Project
                  </button>
                </div>

                <div className="space-y-3">
                  {(proposalContent.portfolio || []).map((p: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative group">
                      <button
                        onClick={() => {
                          const newPort = proposalContent.portfolio.filter((_: any, i: number) => i !== idx);
                          setProposalContent({...proposalContent, portfolio: newPort});
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 text-red-500 rounded-full border border-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <input
                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-blue-400 mb-1 focus:ring-0"
                        placeholder="Project / Repo Name"
                        value={p.name}
                        onChange={e => {
                          const newPort = [...proposalContent.portfolio];
                          newPort[idx].name = e.target.value;
                          setProposalContent({...proposalContent, portfolio: newPort});
                        }}
                      />
                      <input
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-teal-400 mb-2 focus:ring-0 focus:outline-none placeholder:text-slate-700"
                        placeholder="GitHub repo URL (optional — makes title clickable)"
                        value={p.url || ''}
                        onChange={e => {
                          const newPort = [...proposalContent.portfolio];
                          newPort[idx].url = e.target.value;
                          setProposalContent({...proposalContent, portfolio: newPort});
                        }}
                      />
                      <textarea
                        className="w-full bg-transparent border-none p-0 text-[11px] text-slate-400 focus:ring-0 resize-none"
                        rows={2}
                        placeholder="One sentence on how this proves your expertise for this job..."
                        value={p.summary}
                        onChange={e => {
                          const newPort = [...proposalContent.portfolio];
                          newPort[idx].summary = e.target.value;
                          setProposalContent({...proposalContent, portfolio: newPort});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Why Fit & Closing */}
              <section className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">Why You?</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white min-h-[100px] focus:ring-2 focus:ring-teal-500/20"
                    value={proposalContent.why_fit}
                    onChange={e => setProposalContent({...proposalContent, why_fit: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">Closing Statement</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white min-h-[80px] focus:ring-2 focus:ring-teal-500/20"
                    value={proposalContent.closing}
                    onChange={e => setProposalContent({...proposalContent, closing: e.target.value})}
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Right Side: Live Preview */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-5xl shadow-2xl relative">
                {isRendering && (
                  <div className="absolute inset-0 bg-[#050a15]/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <LoaderCircle className="text-teal-400 animate-spin" size={32} />
                      <span className="text-xs font-bold tracking-widest text-teal-400/80">UPDATING PREVIEW</span>
                    </div>
                  </div>
                )}
                <iframe 
                  srcDoc={previewHtml}
                  className="w-full h-full border-none"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a15] text-slate-200 font-['Plus_Jakarta_Sans'] selection:bg-teal-500/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <FileText size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase">Proposal<span className="text-teal-400">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
          AI Engine Online
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.0] text-white">
            WIN THE<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">PROJECT</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto font-medium">
            Generate high-conversion, AI-personalized proposals in seconds. Built for high-stakes freelancing.
          </p>
        </motion.div>

        <form onSubmit={handleGenerate} className="space-y-12">
          {/* Top: Template Cards */}
          <div className="space-y-6">
            <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-slate-800" />
              <Layout size={14} className="text-teal-500" /> Choose Style
              <div className="h-px w-8 bg-slate-800" />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TEMPLATES.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`group cursor-pointer relative p-6 rounded-[2rem] border-2 transition-all duration-500 ${
                    selectedTemplate === t.id 
                    ? 'bg-slate-900 border-teal-500/50 shadow-2xl shadow-teal-500/10' 
                    : 'bg-slate-950/50 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedTemplate === t.id ? 'bg-teal-500 border-teal-500' : 'border-slate-800'
                  }`}>
                    {selectedTemplate === t.id && <CircleCheck size={14} className="text-white" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-black uppercase tracking-wider text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.desc}</div>
                  </div>
                  
                  <div className="mt-6 aspect-[4/3] rounded-2xl bg-slate-900/50 border border-slate-800/50 p-4 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${t.accent}`} />
                    <div className="space-y-2 pt-2">
                      <div className="w-12 h-1 bg-slate-800 rounded" />
                      <div className="w-full h-0.5 bg-slate-800/50 rounded" />
                      <div className="w-3/4 h-0.5 bg-slate-800/50 rounded" />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(t.id);
                        setShowPreview(true);
                      }}
                      className="absolute inset-0 bg-slate-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                      <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-[10px] font-black text-white hover:bg-slate-800 transition-all">
                        <Eye size={12} className="text-teal-400" /> VIEW PREVIEW
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Input */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-teal-500/10 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3 mb-5">
                <Zap size={14} className="text-teal-500" /> Project Timeline
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={timelineValue}
                  onChange={(e) => setTimelineValue(e.target.value)}
                  className="w-28 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all text-center"
                />
                <select
                  value={timelineUnit}
                  onChange={(e) => setTimelineUnit(e.target.value)}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all cursor-pointer"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
              <p className="mt-3 text-xs text-slate-600 font-medium">The delivery milestones in your proposal will be structured around this timeline.</p>
            </div>
          </div>

          {/* Middle: Job Requirements */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3 mb-6">
                <FileText size={16} className="text-teal-500" /> Job Context
              </label>
              <textarea 
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                required
                placeholder="Paste the Upwork job description or specific client requirements here..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-slate-200 h-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all resize-none placeholder:text-slate-700 font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Bottom: Action Button */}
          <div className="flex justify-center">
            <button 
              type="submit"
              disabled={loading}
              className="group relative px-12 py-6 bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl tracking-widest hover:brightness-110 transition-all flex items-center gap-4 shadow-[0_0_50px_rgba(20,184,166,0.2)] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={24} />
              ) : (
                <>
                  <Zap size={24} className="fill-white group-hover:scale-110 transition-transform" />
                  GENERATE PROPOSAL
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#050a15]/90 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="text-teal-400" size={18} />
                  <span className="font-bold text-white">
                    {TEMPLATES.find(t => t.id === previewTemplate)?.name} Preview
                  </span>
                  <span className="text-[10px] uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded text-slate-400">Sample Data</span>
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 bg-slate-950 overflow-hidden relative">
                <iframe 
                  src={`${API_BASE_URL}/preview/${previewTemplate}`}
                  className="w-full h-full border-none"
                  title="Template Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}