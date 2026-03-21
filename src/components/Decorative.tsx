import React from 'react';

/** Decorative barcode element */
export function Barcode({ className = '' }: { className?: string }) {
  const bars = [12, 8, 14, 6, 10, 4, 12, 8, 14, 6, 10, 16, 8, 4, 12, 10, 6, 14, 8, 12];
  return (
    <div className={`barcode ${className}`}>
      {bars.map((h, i) => (
        <span key={i} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}

/** Decorative serial number */
export function SerialTag({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`serial-tag ${className}`}>{text}</span>;
}

/** Section header with line + serial */
export function SectionHeader({ title, serial, className = '' }: { title: string; serial?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-xs font-semibold tracking-wide text-foreground">{title}</span>
      <div className="flex-1 h-px bg-border" />
      {serial && <SerialTag text={serial} />}
      <Barcode />
    </div>
  );
}
