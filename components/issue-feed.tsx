import { WatchlistEntry } from '@/components/watchlist-manager';
import {
  AlertCircle,
  Clock,
  ExternalLink,
  GitPullRequest,
  RefreshCw,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface GitHubLabel {
  name: string;
  color: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: GitHubLabel[];
  repository_url: string;
  _repo: string;
}

interface FetchState {
  issues: GitHubIssue[];
  status: 'initial' | 'loading' | 'processed';
  errors: { repo: string; message: string }[];
  lastSynced: Date | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface IssueFeedProps {
  entries: WatchlistEntry[];
}

export function IssueFeed({ entries }: IssueFeedProps) {
  const [state, setState] = useState<FetchState>({
    issues: [],
    status: 'initial',
    errors: [],
    lastSynced: null,
  });

  const fetchIssues = useCallback(async () => {
    if (entries.length === 0) return;
    setState((s) => ({ ...s, status: 'loading', errors: [] }));

    const results = await Promise.allSettled(
      entries.map(async (entry) => {
        const q = encodeURIComponent(`repo:${entry.repo} ${entry.query}`);
        const url = `https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=20`;
        const res = await fetch(url, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        return (data.items as GitHubIssue[]).map((issue) => ({
          ...issue,
          _repo: entry.repo,
        }));
      }),
    );

    const allIssues: GitHubIssue[] = [];
    const errors: { repo: string; message: string }[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        allIssues.push(...result.value);
      } else {
        errors.push({ repo: entries[i].repo, message: result.reason?.message ?? 'Unknown error' });
      }
    });

    allIssues.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setState({ issues: allIssues, status: 'processed', errors, lastSynced: new Date() });
  }, [entries]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssues();
  }, [fetchIssues]);

  console.log('State', state);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <HugeiconsIcon icon={GitPullRequest} className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground text-sm">
          Add a repository to your watchlist to see issues here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {state.status === 'loading'
              ? 'Syncing...'
              : state.issues.length > 0
                ? `${state.issues.length} issue${state.issues.length > 1 ? 's' : ''}`
                : 'No issues found'}
          </span>
          {state.lastSynced && state.status !== 'loading' && (
            <span className="text-muted-foreground text-xs">
              · synced {timeAgo(state.lastSynced.toISOString())}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={fetchIssues}
          disabled={state.status === 'loading'}
          aria-label="Refresh feed"
        >
          <HugeiconsIcon
            icon={RefreshCw}
            className={cn('h-3 w-3', state.status === 'loading' && 'animate-spin')}
          />{' '}
          Refresh
        </Button>
      </div>

      {/* Errors */}
      {state.errors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {state.errors.map((error) => (
            <div
              key={error.repo}
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded border px-3 py-2 text-xs"
            >
              <HugeiconsIcon icon={AlertCircle} className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>{error.repo}</strong>: {error.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Skeleton Loading Widget */}
      {state.status === 'loading' && state.issues.length === 0 && (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="border-border bg-card flex animate-pulse flex-col gap-2 rounded border p-3"
            >
              <div className="bg-secondary h-3.5 w-3/4 rounded" />
              <div className="flex gap-2">
                <div className="bg-secondary h-2.5 w-20 rounded" />
                <div className="bg-secondary h-2.5 w-16 rounded" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Issue list */}
      {state.status !== 'loading' && state.issues.length === 0 && state.errors.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No matching issues found for your current watchlist queries.
          </p>
          <p className="text-muted-foreground text-xs">Try broadening your query strings.</p>
        </div>
      )}

      {state.issues.length > 0 && (
        <ul className="divide-border border-border flex flex-col divide-y overflow-hidden rounded border">
          {state.issues.map((issue) => (
            <li
              key={issue.id}
              className="group bg-card hover:bg-secondary/30 flex flex-col gap-2 px-4 py-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* Repo */}
                  <span className="text-muted-foreground text-[11px]">
                    {issue._repo} <span className="text-border">·</span> # {issue.number}
                  </span>
                  <Link
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary line-clamp-2 text-sm leading-snug transition-colors"
                  >
                    {issue.title}
                  </Link>
                </div>
                <Link
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open issue in GitHub"
                  className="hover:bg-primary/10 text-muted-foreground hover:text-primary shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <HugeiconsIcon icon={ExternalLink} className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Footer - Labels and Timestmp */}
              <div className="flex flex-wrap items-center gap-2">
                {issue.labels.map((label) => (
                  <span
                    key={label.name}
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] leading-none font-medium"
                    style={{
                      backgroundColor: `#${label.color}22`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}44`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
                <span className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-[11px]">
                  <HugeiconsIcon icon={Clock} className="h-3 w-3" />
                  {timeAgo(issue.updated_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
