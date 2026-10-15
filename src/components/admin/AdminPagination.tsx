'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Calculates page number window and ellipses:
 * For example, if currentPage is 3 out of 309:
 * [1, 2, 3, 4, 5, 'ellipsis-end', 309]
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (totalPages <= 7) {
    return Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1);
  }

  const delta = 2; // Show 2 pages on either side of active page
  let left = Math.max(1, currentPage - delta);
  let right = Math.min(totalPages, currentPage + delta);

  // When near start (e.g. page <= 3), show 1, 2, 3, 4, 5 ... totalPages
  if (currentPage <= 3) {
    left = 1;
    right = Math.min(totalPages, 5);
  }
  // When near end (e.g. page >= totalPages - 2), show 1 ... totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
  if (currentPage >= totalPages - 2) {
    left = Math.max(1, totalPages - 4);
    right = totalPages;
  }

  const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

  // First page & start ellipsis
  if (left > 1) {
    items.push(1);
    if (left > 2) {
      items.push('ellipsis-start');
    }
  }

  // Active page range
  for (let i = left; i <= right; i++) {
    items.push(i);
  }

  // End ellipsis & last page
  if (right < totalPages) {
    if (right < totalPages - 1) {
      items.push('ellipsis-end');
    }
    items.push(totalPages);
  }

  return items;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const pages = getPaginationRange(currentPage, safeTotalPages);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="px-2.5 py-1 border border-border rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium flex items-center gap-1 text-xs select-none"
        aria-label="Previous Page"
      >
        <ChevronLeft size={13} />
        <span>Previous</span>
      </button>

      {pages.map((item, idx) => {
        if (typeof item === 'string') {
          return (
            <span
              key={`ellipsis-${item}-${idx}`}
              className="px-1.5 py-1 text-muted-foreground select-none text-xs font-mono"
            >
              …
            </span>
          );
        }

        const isActive = item === currentPage;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`min-w-[30px] h-7 px-2 flex items-center justify-center rounded text-xs font-medium transition cursor-pointer border select-none ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                : 'border-border text-foreground hover:bg-accent font-medium'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
        disabled={currentPage >= safeTotalPages}
        className="px-2.5 py-1 border border-border rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium flex items-center gap-1 text-xs select-none"
        aria-label="Next Page"
      >
        <span>Next</span>
        <ChevronRight size={13} />
      </button>
    </div>
  );
}
