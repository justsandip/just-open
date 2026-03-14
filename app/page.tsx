'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Settings01Icon, Zap } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { WatchlistEntry, WatchlistManager } from '@/components/watchlist-manager';
import { IssueFeed } from '@/components/issue-feed';

const STORAGE_KEY = '__justopen_watchlist_v1__';

const DEFAULT_ENTRIES: WatchlistEntry[] = [
  {
    id: '16da3497-2f19-441c-b899-8f38bba153ff',
    repo: 'facebook/react',
    query: 'is:open label:"good first issue" no:assignee',
  },
  {
    id: 'c53aef8d-e02f-4359-91cb-f0a284f09ef3',
    repo: 'supabase/supabase',
    query: 'is:issue state:open label:"good first issue"',
  },
];

function loadEntries(): WatchlistEntry[] {
  if (typeof window === 'undefined') return DEFAULT_ENTRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WatchlistEntry[];
  } catch {}
  return DEFAULT_ENTRIES;
}

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [entries, setEntries] = useState<WatchlistEntry[]>(DEFAULT_ENTRIES);

  useEffect(() => {
    const savedEntries = loadEntries();
    if (savedEntries && savedEntries !== DEFAULT_ENTRIES) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries(savedEntries);
    }
    setHydrated(true);
  }, []);

  function handleEntryChange(next: WatchlistEntry[]) {
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  if (!hydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-border bg-background/90 sticky top-0 z-20 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Zap} className="h-4 w-4 fill-current" />
            <span className="text-foreground text-base font-semibold tracking-tight">JustOpen</span>
            <span className="text-muted-foreground hidden text-xs sm:inline-block">v0.0.1</span>
          </div>
          <Button
            variant="outline"
            aria-expanded={watchlistOpen}
            onClick={() => setWatchlistOpen((o) => !o)}
            className={cn(
              'transition-colors',
              watchlistOpen ? 'border-primary/50 bg-primary/50' : '',
            )}
          >
            <HugeiconsIcon icon={Settings01Icon} className="h-3.5 w-3.5" />
            Watchlist
            <span className="bg-input text-foreground inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]">
              {entries.length}
            </span>
            <HugeiconsIcon icon={watchlistOpen ? ChevronUp : ChevronDown} className="h-3 w-3" />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {/* Watchlist */}
        {watchlistOpen && (
          <section
            className="border-border bg-card flex flex-col gap-3 rounded border p-4"
            aria-label="Watchlist configuration"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Watchlist
              </h2>
              <span className="text-muted-foreground text-[11px]">
                Stored in localStorage · no account needed
              </span>
            </div>
            <WatchlistManager entries={entries} onChange={handleEntryChange} />
          </section>
        )}

        {/* Issue feed */}
        <section aria-label="Issue feed">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-sm font-semibold">Issue Feed</h1>
            {entries.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {entries.map((entry) => (
                  <span
                    key={entry.id}
                    className="bg-secondary text-muted-foreground border-border rounded-full border px-2 py-0.5 text-[11px]"
                  >
                    {entry.repo}
                  </span>
                ))}
              </div>
            )}
          </div>
          <IssueFeed entries={entries} />
        </section>
      </main>
    </div>
  );
}
