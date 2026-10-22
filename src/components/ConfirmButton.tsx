"use client";

/** Submit-Button mit Rückfrage */
export default function ConfirmButton({ children, question, className }: { children: React.ReactNode; question: string; className?: string }) {
  return (
    <button className={className} style={{ minHeight: 40 }} onClick={(e) => { if (!window.confirm(question)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
