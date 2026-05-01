import { useState, useMemo, useEffect, useCallback } from 'react';
import './DataDictionary.css';
import { CATEGORIES, TERMS, type Term } from '../data/dataDictionary';

// Deduplicate TERMS (DSO appeared twice in source)
const DICT: Term[] = (() => {
  const seen = new Set<string>();
  return TERMS.filter(t => {
    if (seen.has(t.term)) return false;
    seen.add(t.term);
    return true;
  });
})();

const TOTAL = DICT.length;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function highlightText(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark style="background:rgba(57,255,132,.22);color:inherit;border-radius:2px;">$1</mark>',
  );
}

export default function DataDictionary() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [modalTerm, setModalTerm] = useState<Term | null>(null);

  // Derive visible terms
  const visibleTerms = useMemo(() => {
    const q = search.toLowerCase().trim();
    return DICT.filter(t => {
      if (activeFilter !== 'all' && t.cat !== activeFilter) return false;
      if (activeLetter && t.term[0].toUpperCase() !== activeLetter) return false;
      if (q) {
        return (
          t.term.toLowerCase().includes(q) ||
          (t.full ?? '').toLowerCase().includes(q) ||
          t.def.toLowerCase().includes(q) ||
          (t.biz ?? '').toLowerCase().includes(q) ||
          (t.analogy ?? '').toLowerCase().includes(q) ||
          (t.relevance ?? '').toLowerCase().includes(q) ||
          (t.context ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeFilter, activeLetter]);

  // Group by category, sorted alphabetically within each group
  const grouped = useMemo(() => {
    const map: Record<string, Term[]> = {};
    CATEGORIES.forEach(c => { map[c.id] = []; });
    visibleTerms.forEach(t => { if (map[t.cat]) map[t.cat].push(t); });
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.term.localeCompare(b.term)));
    return map;
  }, [visibleTerms]);

  // Letters that have at least one visible entry
  const lettersWithEntries = useMemo(
    () => new Set(DICT.map(t => t.term[0].toUpperCase())),
    [],
  );

  // Close modal on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalTerm) setModalTerm(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalTerm]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (modalTerm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalTerm]);

  const handleFilterClick = useCallback((cat: string) => {
    setActiveFilter(cat);
    setActiveLetter(null);
  }, []);

  const handleLetterClick = useCallback((letter: string) => {
    setActiveLetter(prev => (prev === letter ? null : letter));
  }, []);

  const handleSeeAlsoClick = useCallback((termName: string) => {
    const found = DICT.find(t => t.term === termName);
    if (found) {
      setModalTerm(found);
    } else {
      setSearch(termName);
      setActiveFilter('all');
      setActiveLetter(null);
      setModalTerm(null);
    }
  }, []);

  const getCategoryForTerm = useCallback((t: Term) => {
    return CATEGORIES.find(c => c.id === t.cat) ?? null;
  }, []);

  const q = search.toLowerCase().trim();
  const noResults = visibleTerms.length === 0;

  return (
    <div className="dd-page">
      {/* HEADER */}
      <header className="header">
        <div className="eyebrow">Federated Analytics Mesh (FAM) · Knowledge Base</div>
        <h1 className="title">Data <span className="accent">Dictionary</span></h1>
        <p className="lede">
          Definitions for every acronym, term, protocol, standard, and concept used across the
          three architectural documents. Organised by domain; fully searchable and filterable.
        </p>
      </header>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-num">{TOTAL}</div>
          <div className="stat-label">total terms</div>
        </div>
        <div className="stat">
          <div className="stat-num">8</div>
          <div className="stat-label">categories</div>
        </div>
        <div className="stat">
          <div className="stat-num">{visibleTerms.length}</div>
          <div className="stat-label">shown</div>
        </div>
        <div className="stat">
          <div className="stat-num">Apr 2026</div>
          <div className="stat-label">last updated</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-wrap">
          <svg
            className="search-icon"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="4" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search terms, definitions…"
            autoComplete="off"
            spellCheck={false}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setActiveLetter(null);
            }}
          />
        </div>

        <div className="filter-btns">
          <button
            className={`filter-btn${activeFilter === 'all' ? ' active' : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn${activeFilter === cat.id ? ' active' : ''}`}
              onClick={() => handleFilterClick(cat.id)}
            >
              {cat.title.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="count-tag">
          <strong>{visibleTerms.length}</strong> terms
        </div>
      </div>

      {/* ALPHA BAR */}
      <div className="alpha-bar" role="toolbar" aria-label="Filter by first letter">
        {ALPHABET.map(letter => (
          <button
            key={letter}
            className={[
              'alpha-btn',
              lettersWithEntries.has(letter) ? 'has-entries' : '',
              activeLetter === letter ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => lettersWithEntries.has(letter) && handleLetterClick(letter)}
            aria-pressed={activeLetter === letter}
            aria-disabled={!lettersWithEntries.has(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* NO RESULTS */}
      <div className={`no-results${noResults ? ' show' : ''}`} aria-live="polite">
        <div className="no-results-icon">⌕</div>
        <div className="no-results-title">No matching terms</div>
        <div className="no-results-sub">Try a different search or clear the filter</div>
      </div>

      {/* DICTIONARY CONTENT */}
      <div>
        {CATEGORIES.map(cat => {
          const entries = grouped[cat.id] ?? [];
          if (entries.length === 0) return null;
          return (
            <section key={cat.id} className={`category cat-${cat.id}`} data-cat-id={cat.id}>
              <div className="cat-header">
                <div className="cat-icon" aria-hidden="true">{cat.icon}</div>
                <div className="cat-title">{cat.title}</div>
                <div className="cat-count">
                  {entries.length} term{entries.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="entries">
                {entries.map(t => (
                  <EntryCard
                    key={t.term}
                    term={t}
                    cat={cat}
                    query={q}
                    onOpen={setModalTerm}
                    onSeeAlso={handleSeeAlsoClick}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span>Federated Analytics Mesh (FAM) Data Dictionary · April 2026</span>
        <span>{TOTAL} terms · 8 categories · UK English</span>
      </footer>

      {/* MODAL */}
      {modalTerm && (
        <TermModal
          term={modalTerm}
          cat={getCategoryForTerm(modalTerm)}
          onClose={() => setModalTerm(null)}
          onSeeAlso={handleSeeAlsoClick}
        />
      )}
    </div>
  );
}

/* ============================================================
   Entry Card
   ============================================================ */
interface EntryCardProps {
  term: Term;
  cat: (typeof CATEGORIES)[0];
  query: string;
  onOpen: (t: Term) => void;
  onSeeAlso: (name: string) => void;
}

function EntryCard({ term: t, cat, query, onOpen, onSeeAlso }: EntryCardProps) {
  const hl = (text: string) => highlightText(text, query);

  return (
    <div
      className="entry"
      tabIndex={0}
      role="button"
      aria-label={`Open details for ${t.term}`}
      onClick={() => onOpen(t)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(t);
        }
      }}
    >
      <div className="entry-head">
        <span
          className="entry-term"
          dangerouslySetInnerHTML={{ __html: hl(t.term) }}
        />
        {t.full && (
          <span
            className="entry-full"
            dangerouslySetInnerHTML={{ __html: hl(t.full) }}
          />
        )}
        <div className="entry-tags">
          <span className={`entry-tag ${cat.tagClass}`}>
            {cat.title.split(' ')[0].toUpperCase()}
          </span>
        </div>
      </div>

      <div
        className="entry-def"
        dangerouslySetInnerHTML={{ __html: hl(t.def) }}
      />

      {t.biz && (
        <div
          className="entry-context"
          style={{ borderLeftColor: 'var(--accent-2)' }}
        >
          <strong>Business perspective → </strong>
          <span dangerouslySetInnerHTML={{ __html: hl(t.biz) }} />
        </div>
      )}

      {t.analogy && (
        <div
          className="entry-context"
          style={{ borderLeftColor: 'var(--accent-3)' }}
        >
          <strong>Analogy → </strong>
          <span dangerouslySetInnerHTML={{ __html: hl(t.analogy) }} />
        </div>
      )}

      {t.relevance && (
        <div
          className="entry-context"
          style={{ borderLeftColor: 'var(--accent-4)' }}
        >
          <strong>Why it matters → </strong>
          <span dangerouslySetInnerHTML={{ __html: hl(t.relevance) }} />
        </div>
      )}

      {t.context && (
        <div className="entry-context">
          <strong>In this blueprint → </strong>
          <span dangerouslySetInnerHTML={{ __html: hl(t.context) }} />
        </div>
      )}

      {t.seeAlso && t.seeAlso.length > 0 && (
        <div
          style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}
          onClick={e => e.stopPropagation()}
        >
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
            See also:
          </span>
          {t.seeAlso.map(s => (
            <button
              key={s}
              className="see-also"
              onClick={e => {
                e.stopPropagation();
                onSeeAlso(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Term Modal
   ============================================================ */
interface TermModalProps {
  term: Term;
  cat: (typeof CATEGORIES)[0] | null;
  onClose: () => void;
  onSeeAlso: (name: string) => void;
}

function TermModal({ term: t, cat, onClose, onSeeAlso }: TermModalProps) {
  const sections: { cls: string; label: string; text: string }[] = [];
  sections.push({ cls: 'def', label: 'Definition', text: t.def });
  if (t.biz)       sections.push({ cls: 'biz',       label: 'Business perspective', text: t.biz });
  if (t.analogy)   sections.push({ cls: 'analogy',   label: 'Analogy',              text: t.analogy });
  if (t.relevance) sections.push({ cls: 'relevance', label: 'Why it matters',       text: t.relevance });
  if (t.context)   sections.push({ cls: 'context',   label: 'In this blueprint',    text: t.context });

  return (
    <div
      className="term-modal-overlay open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-term-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="term-modal" role="document">
        <button
          className="term-modal-close"
          aria-label="Close"
          onClick={onClose}
          autoFocus
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>

        <div className="term-modal-head">
          <div className={`term-modal-tag${cat ? ' ' + cat.tagClass : ''}`}>
            {cat ? cat.title : t.cat}
          </div>
          <h2 className="term-modal-term" id="modal-term-title">{t.term}</h2>
          {t.full && (
            <div className="term-modal-full">{t.full}</div>
          )}
        </div>

        <div className="term-modal-body">
          {sections.map(s => (
            <div key={s.cls} className={`modal-section ${s.cls}`}>
              <span className="modal-section-label">{s.label}</span>
              <div className="modal-section-text">{s.text}</div>
            </div>
          ))}

          {t.seeAlso && t.seeAlso.length > 0 && (
            <div className="modal-seealso">
              <span className="modal-seealso-label">See also</span>
              {t.seeAlso.map(s => (
                <button
                  key={s}
                  className="modal-seealso-link"
                  onClick={() => onSeeAlso(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
