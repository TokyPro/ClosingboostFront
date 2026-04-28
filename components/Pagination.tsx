'use client';

import React from 'react';
import { cn } from '../lib/cn';

interface PaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

const DEFAULT_PAGE_SIZE = 10;

export function Pagination({ page, total, pageSize = DEFAULT_PAGE_SIZE, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pageNumbers: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pageNumbers.push(i);
    else if (pageNumbers[pageNumbers.length - 1] !== '…') pageNumbers.push('…');
  }

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
      <p className="text-[11px] text-on-surface-variant font-bold">
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all',
            page <= 1
              ? 'pointer-events-none text-on-surface-variant/30 bg-surface-container-low'
              : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high',
          )}
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          Préc.
        </button>

        {pageNumbers.map((n, i) =>
          n === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-[11px] text-on-surface-variant/40 select-none">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                'w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all',
                n === page
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {n}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all',
            page >= totalPages
              ? 'pointer-events-none text-on-surface-variant/30 bg-surface-container-low'
              : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high',
          )}
        >
          Suiv.
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
