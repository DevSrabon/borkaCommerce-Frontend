import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 py-20">
      <div className="h-20 w-20 rounded-full border border-yellow-500/20 bg-yellow-500/10 flex items-center justify-center text-yellow-500">
        <AlertTriangle size={36} />
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-4xl font-bold text-foreground">404</h1>
        <p className="text-sm font-semibold text-foreground">Admin Page Not Found</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          This admin module doesn&apos;t exist or has been moved. Check the sidebar for available modules.
        </p>
      </div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 px-5 py-2.5 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
