import React from 'react';

export function LineSkeleton({ width = '100%' }) {
  return <div className="animate-pulse rounded bg-black/10 dark:bg-white/10 h-3" style={{ width }} />;
}

export function PanelSkeleton({ lines = 5 }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: lines }).map((_, i) => (
        <LineSkeleton  
          key={i}
          width={`${80 - (i * 5) % 40}%`}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <ul className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
         
        <li key={i} className="animate-pulse h-6 rounded bg-black/10 dark:bg-white/10" />
      ))}
    </ul>
  );
}
