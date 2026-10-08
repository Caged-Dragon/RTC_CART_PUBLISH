import React from 'react';

interface State { failed: boolean }

/** Last line of defence: a crash in one screen shows a friendly recovery card, not a blank page. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error('UI error:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3 rounded-2xl border border-amber-500/30 bg-stone-900 p-6">
          <h2 className="font-display text-lg font-black text-white">Something went wrong</h2>
          <p className="text-xs text-stone-400">Your cart is safe. Please reload the page, and if it keeps happening WhatsApp us your order directly.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer">Reload page</button>
        </div>
      </div>
    );
  }
}
