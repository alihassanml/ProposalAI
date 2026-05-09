import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Search, Download, LoaderCircle, Globe,
  Phone, Star, Copy, CheckCheck, ExternalLink, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

interface Business {
  name:     string;
  rating:   string;
  reviews:  string;
  category: string;
  address:  string;
  phone:    string;
  website:  string;
  email:    string;
  maps_url: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 p-0.5 rounded text-outline hover:text-secondary transition-colors"
      title="Copy"
    >
      {copied ? <CheckCheck size={11} className="text-secondary" /> : <Copy size={11} />}
    </button>
  );
}

export default function MapScraperPage() {
  const [query, setQuery]           = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState<Business[]>([]);
  const [error, setError]           = useState('');
  const [searched, setSearched]     = useState('');
  const [progress, setProgress]     = useState<string[]>([]);
  const logEndRef                   = useRef<HTMLDivElement>(null);
  const esRef                       = useRef<EventSource | null>(null);

  // auto-scroll the progress log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress]);

  // cleanup EventSource on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

  const handleScrape = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // close any previous stream
    esRef.current?.close();

    setLoading(true);
    setError('');
    setResults([]);
    setProgress([]);
    setSearched(query.trim());

    const url = `${API_BASE_URL}/scrape-maps/stream?query=${encodeURIComponent(query.trim())}&max_results=${maxResults}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setProgress(prev => [...prev, data.message]);
      } else if (data.type === 'done') {
        setResults(data.results || []);
        if (!(data.results || []).length) setError('No results found. Try a different search query.');
        setLoading(false);
        es.close();
      } else if (data.type === 'error' || data.type === 'timeout') {
        setError(data.message || 'Scraping timed out. Please try again.');
        setLoading(false);
        es.close();
      }
    };

    es.onerror = () => {
      setError('Connection error — is the backend running?');
      setLoading(false);
      es.close();
    };
  };

  const exportCSV = () => {
    const headers = ['#', 'Name', 'Rating', 'Reviews', 'Category', 'Address', 'Phone', 'Email', 'Website', 'Google Maps URL'];
    const rows = results.map((r, i) => [
      i + 1, r.name, r.rating, r.reviews, r.category,
      r.address, r.phone, r.email, r.website, r.maps_url
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `google_maps_${searched.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 pt-8 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">
                Google Maps <span className="text-secondary">Scraper</span>
              </h1>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant ml-[52px]">
            Extract business name, phone, website, address, and ratings. Export to CSV instantly.
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card border border-outline-variant rounded-2xl p-5 mb-6"
        >
          <form onSubmit={handleScrape} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='e.g. "plumbers in Chicago" or "restaurants near Times Square"'
                required
                className="w-full border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface bg-white placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-outline-variant rounded-xl px-3 py-3 bg-white focus-within:border-secondary transition-colors">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider whitespace-nowrap">Max</span>
                <input
                  type="number"
                  value={maxResults}
                  onChange={e => setMaxResults(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  min={1}
                  max={100}
                  className="w-14 bg-transparent text-on-surface font-semibold text-sm focus:outline-none text-center"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-opacity shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? <LoaderCircle className="animate-spin" size={16} /> : <MapPin size={16} />}
                {loading ? 'Scraping…' : 'Scrape'}
              </button>
            </div>
          </form>

          {/* Live progress log */}
          <AnimatePresence>
            {loading && progress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Live Progress</p>
                  {progress.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 py-0.5"
                    >
                      {i === progress.length - 1 ? (
                        <LoaderCircle size={11} className="text-secondary animate-spin shrink-0 mt-0.5" />
                      ) : (
                        <span className="text-secondary shrink-0 mt-0.5 text-[10px]">✓</span>
                      )}
                      <span className="text-xs text-on-surface-variant font-mono">{msg}</span>
                    </motion.div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 px-4 py-3 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Stats bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-on-surface">{results.length} businesses found</span>
                  <span className="text-xs text-on-surface-variant">for "{searched}"</span>
                  <span className="text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full">
                    {results.filter(r => r.phone).length} with phone · {results.filter(r => r.email).length} with email · {results.filter(r => r.website).length} with website
                  </span>
                </div>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-3 py-2 border border-outline-variant bg-white hover:bg-surface-container-low text-on-surface rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>

              {/* Table */}
              <div className="card border border-outline-variant rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low">
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-8">#</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant min-w-[180px]">Business Name</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rating</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant min-w-[180px]">Address</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Phone</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Website</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
                        >
                          <td className="px-4 py-3 text-on-surface-variant text-xs font-bold">{i + 1}</td>
                          <td className="px-4 py-3">
                            <a href={r.maps_url} target="_blank" rel="noreferrer"
                              className="font-semibold text-on-surface hover:text-secondary transition-colors flex items-center gap-1 group">
                              {r.name}
                              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary shrink-0" />
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            {r.rating ? (
                              <div className="flex items-center gap-1">
                                <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                                <span className="font-bold text-amber-600 text-xs">{r.rating}</span>
                                {r.reviews && <span className="text-on-surface-variant text-[11px]">({r.reviews})</span>}
                              </div>
                            ) : <span className="text-outline text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-on-surface-variant bg-surface-container border border-outline-variant/60 px-2 py-0.5 rounded font-medium">
                              {r.category || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[200px]">
                            <div className="flex items-start gap-1">
                              <span className="line-clamp-2">{r.address || '—'}</span>
                              <CopyBtn text={r.address} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {r.phone ? (
                              <div className="flex items-center gap-1">
                                <a href={`tel:${r.phone}`} className="text-xs text-secondary font-medium hover:underline flex items-center gap-1 transition-colors">
                                  <Phone size={10} className="shrink-0" />{r.phone}
                                </a>
                                <CopyBtn text={r.phone} />
                              </div>
                            ) : <span className="text-outline text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r.email ? (
                              <div className="flex items-center gap-1">
                                <a href={`mailto:${r.email}`} className="text-xs text-primary font-medium hover:text-secondary flex items-center gap-1 transition-colors max-w-[160px] truncate">
                                  <Mail size={10} className="shrink-0" />
                                  <span className="truncate">{r.email}</span>
                                </a>
                                <CopyBtn text={r.email} />
                              </div>
                            ) : <span className="text-outline text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r.website ? (
                              <div className="flex items-center gap-1">
                                <a href={r.website} target="_blank" rel="noreferrer"
                                  className="text-xs text-primary font-medium hover:text-secondary flex items-center gap-1 transition-colors max-w-[140px] truncate">
                                  <Globe size={10} className="shrink-0" />
                                  <span className="truncate">{r.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                </a>
                                <CopyBtn text={r.website} />
                              </div>
                            ) : <span className="text-outline text-xs">—</span>}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center mb-4">
              <MapPin size={22} className="text-outline" />
            </div>
            <p className="text-sm font-semibold text-on-surface mb-1">Ready to scrape</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Enter a business type and location — e.g. "dentists in London" or "coffee shops in Manhattan"
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
