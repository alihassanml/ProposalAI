import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, FileText, Trash2, Clock, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000';

interface HistoryEntry {
  id: number;
  type: 'maps' | 'proposal';
  title: string;
  summary: string;
  data: string;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function MapsCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const data = JSON.parse(entry.data || '{}');
  const results: any[] = data.results || [];

  const exportCSV = () => {
    const headers = ['#', 'Name', 'Rating', 'Reviews', 'Category', 'Address', 'Phone', 'Email', 'Website', 'Facebook', 'Instagram', 'TikTok', 'Twitter/X', 'YouTube', 'Maps URL'];
    const rows = results.map((r: any, i: number) => [
      i + 1, r.name, r.rating, r.reviews, r.category,
      r.address, r.phone, r.email, r.website,
      r.facebook, r.instagram, r.tiktok, r.twitter, r.youtube, r.maps_url,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${entry.title.replace(/\s+/g, '_')}_${entry.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="border border-outline-variant rounded-2xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={15} className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">"{entry.title}"</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{entry.summary}</p>
          <p className="text-[10px] text-outline mt-1 flex items-center gap-1">
            <Clock size={9} /> {formatDate(entry.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={exportCSV} title="Download CSV"
            className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-secondary transition-colors">
            <Download size={14} />
          </button>
          <button onClick={() => setExpanded(v => !v)} title="View results"
            className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onDelete} title="Delete"
            className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && results.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-outline-variant"
          >
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-container-low">
                  <tr>
                    {['#', 'Name', 'Rating', 'Category', 'Phone', 'Email', 'Website'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap border-b border-outline-variant">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-outline-variant/40 hover:bg-surface-container-low">
                      <td className="px-3 py-2 text-outline">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-on-surface max-w-[150px] truncate">{r.name || '—'}</td>
                      <td className="px-3 py-2 text-amber-600 font-semibold">{r.rating || '—'}</td>
                      <td className="px-3 py-2 text-on-surface-variant max-w-[120px] truncate">{r.category || '—'}</td>
                      <td className="px-3 py-2 text-secondary">{r.phone || '—'}</td>
                      <td className="px-3 py-2 text-primary max-w-[140px] truncate">{r.email || '—'}</td>
                      <td className="px-3 py-2 max-w-[120px] truncate">
                        {r.website
                          ? <a href={r.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.website.replace(/^https?:\/\//, '')}</a>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProposalCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const data = JSON.parse(entry.data || '{}');
  const templateNames: Record<string, string> = { '1': 'Dark Executive', '2': 'Corporate Pro', '3': 'Bold Slate' };

  return (
    <div className="border border-outline-variant rounded-2xl p-4 bg-white flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <FileText size={15} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface truncate">{entry.title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{entry.summary}</p>
        {data.requirements && (
          <p className="text-[11px] text-outline mt-1.5 line-clamp-2 leading-relaxed">{data.requirements}</p>
        )}
        <p className="text-[10px] text-outline mt-1.5 flex items-center gap-1">
          <Clock size={9} /> {formatDate(entry.created_at)}
          {data.template && <span className="ml-2 bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">{templateNames[data.template] || 'Template ' + data.template}</span>}
        </p>
      </div>
      <button onClick={onDelete} title="Delete"
        className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [entries, setEntries]   = useState<HistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'maps' | 'proposal'>('maps');

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_BASE_URL}/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const maps     = entries.filter(e => e.type === 'maps');
  const proposals = entries.filter(e => e.type === 'proposal');
  const shown    = activeTab === 'maps' ? maps : proposals;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 pt-8 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Clock size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface">
              Activity <span className="text-secondary">History</span>
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant ml-[52px]">
            Your last scraper runs and generated proposals, saved automatically.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['maps', 'proposal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-secondary text-white shadow-sm'
                  : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'
              }`}
            >
              {tab === 'maps' ? <MapPin size={14} /> : <FileText size={14} />}
              {tab === 'maps' ? 'Map Scraper' : 'Proposals'}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {tab === 'maps' ? maps.length : proposals.length}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center mb-4">
              {activeTab === 'maps' ? <MapPin size={22} className="text-outline" /> : <FileText size={22} className="text-outline" />}
            </div>
            <p className="text-sm font-semibold text-on-surface mb-1">No history yet</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              {activeTab === 'maps'
                ? 'Run the Google Maps scraper and your results will appear here.'
                : 'Generate a proposal and it will be saved here automatically.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            <AnimatePresence>
              {shown.map(entry => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {entry.type === 'maps'
                    ? <MapsCard entry={entry} onDelete={() => handleDelete(entry.id)} />
                    : <ProposalCard entry={entry} onDelete={() => handleDelete(entry.id)} />
                  }
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
