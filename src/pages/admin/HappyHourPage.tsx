import React, { useEffect, useState } from 'react';
import { getAllHappyHours, upsertHappyHour } from '../../lib/database';
import { isHappyHourActive } from '../../utils/pricingUtils';
import type { HappyHour } from '../../types';
import { Plus, Clock, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOCK_HH: HappyHour[] = [
  { id: '1', name: 'Evening Special', discount_percent: 25, start_time: '18:00', end_time: '20:00', days_of_week: [1,2,3,4,5], is_active: true, created_at: '' },
  { id: '2', name: 'Weekend Flash Sale', discount_percent: 30, start_time: '14:00', end_time: '16:00', days_of_week: [0,6], is_active: true, created_at: '' },
  { id: '3', name: 'Lunch Hour Deal', discount_percent: 15, start_time: '12:00', end_time: '13:00', days_of_week: [1,2,3,4,5], is_active: false, created_at: '' },
];

export default function HappyHourPage() {
  const [hours, setHours] = useState<HappyHour[]>(MOCK_HH);
  const [editing, setEditing] = useState<Partial<HappyHour> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllHappyHours().then(data => { if (data?.length) setHours(data); }).catch(() => {});
  }, []);

  const handleToggle = async (hh: HappyHour) => {
    const updated = { ...hh, is_active: !hh.is_active };
    setHours(prev => prev.map(h => h.id === hh.id ? updated : h));
    try { await upsertHappyHour(updated); } catch {}
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertHappyHour(editing);
      if (editing.id) { setHours(prev => prev.map(h => h.id === editing.id ? { ...h, ...editing } as HappyHour : h)); }
      else { setHours(prev => [...prev, { ...editing, id: Date.now().toString(), created_at: '' } as HappyHour]); }
      setEditing(null);
    } catch {}
    setSaving(false);
  };

  const toggleDay = (day: number) => {
    if (!editing) return;
    const days = editing.days_of_week || [];
    setEditing({ ...editing, days_of_week: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-page-title">⏰ Happy Hour Settings</h1>
        <button onClick={() => setEditing({ name: '', discount_percent: 20, start_time: '18:00', end_time: '20:00', days_of_week: [1,2,3,4,5], is_active: true })} className="btn btn-primary btn-sm">
          <Plus size={16} /> Add Happy Hour
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {hours.map(hh => {
          const active = hh.is_active && isHappyHourActive(hh.start_time, hh.end_time, hh.days_of_week);
          return (
            <div key={hh.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-card)', borderLeft: `4px solid ${active ? '#22C55E' : hh.is_active ? 'var(--rose)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{hh.name}</div>
                  {active && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>⚡ LIVE NOW</span>}
                  {hh.is_active && !active && <span className="badge" style={{ background: 'rgba(232,25,75,0.1)', color: 'var(--rose)', fontSize: '0.7rem' }}>Scheduled</span>}
                  {!hh.is_active && <span className="badge" style={{ background: 'var(--cream)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Disabled</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditing(hh)} style={{ background: 'none', color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleToggle(hh)} style={{ background: 'none', color: hh.is_active ? 'var(--rose)' : '#22C55E' }}>
                    {hh.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}><Clock size={14} />{hh.start_time} – {hh.end_time}</div>
                <div className="badge badge-gold" style={{ fontSize: '0.78rem' }}>{hh.discount_percent}% OFF</div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {DAYS.map((d, i) => (
                  <span key={d} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, background: hh.days_of_week.includes(i) ? 'var(--rose)' : 'var(--cream)', color: hh.days_of_week.includes(i) ? 'white' : 'var(--text-muted)' }}>{d.charAt(0)}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="alert-overlay" onClick={() => setEditing(null)}>
          <div className="alert-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem' }}>{editing.id ? 'Edit' : 'Create'} Happy Hour</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Name</label><input type="text" className="input-field" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Start Time</label><input type="time" className="input-field" value={editing.start_time || '18:00'} onChange={e => setEditing({ ...editing, start_time: e.target.value })} /></div>
                <div><label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>End Time</label><input type="time" className="input-field" value={editing.end_time || '20:00'} onChange={e => setEditing({ ...editing, end_time: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Discount: {editing.discount_percent}%</label><input type="range" min={5} max={50} step={5} value={editing.discount_percent || 20} onChange={e => setEditing({ ...editing, discount_percent: Number(e.target.value) })} style={{ width: '100%' }} /></div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Days</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {DAYS.map((d, i) => (
                    <button key={d} onClick={() => toggleDay(i)} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid', borderColor: (editing.days_of_week || []).includes(i) ? 'var(--rose)' : 'var(--border)', background: (editing.days_of_week || []).includes(i) ? 'var(--rose)' : 'white', color: (editing.days_of_week || []).includes(i) ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>{d.charAt(0)}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
