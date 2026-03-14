'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, Trash2 } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface WatchlistEntry {
  id: string;
  repo: string;
  query: string;
}

interface WatchlistManagerProps {
  entries: WatchlistEntry[];
  onChange: (entries: WatchlistEntry[]) => void;
}

const PRESETS: { label: string; repo: string; query: string }[] = [
  { label: 'Good first issues', repo: '', query: 'is:open label:"good first issue" no:assignee' },
  { label: 'Unassigned bugs', repo: '', query: 'is:open label:bug no:assignee' },
  { label: 'Docs help wanted', repo: '', query: 'is:open label:documentation label:"help wanted"' },
];

export function WatchlistManager({ entries, onChange }: WatchlistManagerProps) {
  const [repo, setRepo] = useState('');
  const [query, setQuery] = useState('is:issue state:open label:"good first issue"');
  const [error, setError] = useState('');

  function addEntry() {
    const trimmedRepo = repo.trim();
    const trimmedQuery = query.trim();

    if (!trimmedRepo) {
      setError('Repository is required (e.g. vercel/next.js)');
      return;
    }

    if (!/^[\w.-]+\/[\w.-]+$/.test(trimmedRepo)) {
      setError('Use owner/repo format, e.g. "facebook/react"');
      return;
    }

    if (!trimmedQuery) {
      setError('Query string is required');
      return;
    }

    if (entries.some((e) => e.repo === trimmedRepo && e.query === trimmedQuery)) {
      setError('This repo + query pair already exists');
      return;
    }

    setError('');
    onChange([...entries, { id: uuidv4(), repo: trimmedRepo, query: trimmedQuery }]);
    setRepo('');
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }

  function applyPreset(q: string) {
    setQuery(q);
    setError('');
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Preset Chips for Filters */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            onClick={() => applyPreset(p.query)}
            variant="secondary"
            size="xs"
            className="text-muted-foreground hover:border-primary rounded-sm"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Add Entry Form */}
      <div className="flex flex-col gap-2.5">
        <Input
          placeholder="owner/repo (e.g. facebook/react)"
          value={repo}
          onChange={(e) => {
            setRepo(e.target.value);
            setError('');
          }}
        ></Input>
        <Input
          placeholder='Query (e.g. is:open label:"good first issue"'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError('');
          }}
        ></Input>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <Button onClick={addEntry}>
          <HugeiconsIcon icon={Plus} /> Add to Watchlist
        </Button>
      </div>

      {entries.length > 0 ? (
        <ul className="divide-border border-border flex flex-col divide-y overflow-hidden rounded border">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="bg-card hover:bg-secondary/40 flex items-center gap-3 px-3 py-2.5 transition-colors"
            >
              <HugeiconsIcon
                icon={BookOpen}
                className="text-muted-foreground h-3.5 w-3.5 shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm">{entry.repo}</span>
                <span className="text-muted-foreground truncate text-xs">{entry.query}</span>
              </div>
              <Button variant="destructive" size="icon-sm" onClick={() => removeEntry(entry.id)}>
                <HugeiconsIcon icon={Trash2} className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-2 text-xs">
          No repos in watchlist yet. Add one above to start monitoring.
        </p>
      )}
    </div>
  );
}
