'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

/* ------------------------------------------------------------------ */
/* toasts + confirm dialog                                             */
/* ------------------------------------------------------------------ */

type ToastKind = 'ok' | 'err' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}
interface ConfirmOpts {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

interface UiCtx {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}

const Ctx = createContext<UiCtx>({
  toast: () => {},
  confirm: async (o) => window.confirm(o.title),
});

export function useUi() {
  return useContext(Ctx);
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(0);

  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'err' ? 7000 : 3500);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ ...opts, resolve })), []);

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon name={t.kind === 'err' ? 'x' : 'check'} />
            <span>{t.text}</span>
            <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
      {dialog && (
        <Modal title={dialog.title} onClose={() => close(false)}>
          {dialog.text && <div className="modal-body">{dialog.text}</div>}
          <div className="modal-foot">
            <button className="btn" onClick={() => close(false)}>
              Cancel
            </button>
            <button className={`btn ${dialog.danger ? 'btn-danger-solid' : 'btn-primary'}`} autoFocus onClick={() => close(true)}>
              {dialog.confirmLabel || 'OK'}
            </button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({ title, onClose, children, large }: { title: ReactNode; onClose: () => void; children: ReactNode; large?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${large ? 'modal-lg' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <label className="switch" title={label}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="track" />
    </label>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

/** Warn before leaving the page with unsaved changes (tab close, reload and in-app link clicks). */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const msg = 'You have unsaved changes. Leave without saving?';
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = msg;
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (!window.confirm(msg)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Ctrl/Cmd + S calls the latest `save`. */
export function useSaveShortcut(save: () => void) {
  const ref = useRef(save);
  ref.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
