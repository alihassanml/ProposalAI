import React, { useState, useEffect, useRef } from 'react';
import { FileText, MapPin, LayoutDashboard, ChevronUp, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabId = 'dashboard' | 'proposal' | 'maps';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'proposal',  label: 'Upwork Proposal',    icon: FileText },
  { id: 'maps',      label: 'Google Map Scraper', icon: MapPin },
];

interface SidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function Sidebar({ active, onChange }: SidebarProps) {
  const { user, logout, updateApiKey } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [apiKey, setApiKey]           = useState(user?.openai_api_key || '');
  const [showKey, setShowKey]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(user?.openai_api_key || '');
  }, [user?.openai_api_key]);

  useEffect(() => {
    if (!showProfile) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfile]);

  const handleSaveKey = async () => {
    setSaving(true);
    await updateApiKey(apiKey);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside className="w-64 min-h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0 relative">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-outline-variant">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <FileText size={16} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-primary leading-tight block">halify.ai</span>
          <span className="text-[10px] text-on-surface-variant">Automation Suite</span>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-5 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Tools</span>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-0.5 flex-1">
        {NAV.map(({ id, label, icon: Icon, badge }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low font-medium'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-secondary' : ''} />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className="text-[9px] font-bold bg-secondary/15 text-secondary px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile panel (popover) */}
      {showProfile && (
        <div
          ref={panelRef}
          className="absolute bottom-[72px] left-3 right-3 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 z-50"
        >
          {/* User info */}
          <div className="mb-4 pb-3 border-b border-outline-variant">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">Profile</p>
            <p className="text-sm font-semibold text-on-surface">{user?.name}</p>
            <p className="text-xs text-on-surface-variant">{user?.email}</p>
          </div>

          {/* API key */}
          <div className="mb-4">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide block mb-1.5">
              OpenAI API Key
            </label>
            <div className="flex gap-1.5 items-center border border-outline-variant rounded-lg bg-surface-container-low overflow-hidden">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 text-xs px-3 py-2 bg-transparent text-on-surface focus:outline-none placeholder:text-outline"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              disabled={saving}
              className="w-full mt-2 bg-primary text-white text-xs font-semibold rounded-lg py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Key'}
            </button>
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-error border border-error/20 rounded-lg py-2 hover:bg-error/5 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}

      {/* Profile trigger */}
      <div className="border-t border-outline-variant p-3">
        <button
          onClick={() => setShowProfile(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-on-surface truncate">{user?.name}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
          </div>
          <ChevronUp
            size={14}
            className={`text-on-surface-variant transition-transform shrink-0 ${showProfile ? '' : 'rotate-180'}`}
          />
        </button>
      </div>
    </aside>
  );
}
