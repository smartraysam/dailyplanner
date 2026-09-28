import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daily Planner & Autonomous AI Agent | Dev Cadence',
  description: 'Schedule engineering routines, prevent context switching fatigue with proactive timebox alerts, and delegate tasks to autonomous agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
