'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ITEM_TYPES, type ItemTypeDef } from '@/lib/content-types';
import { Icon } from './Icon';

const GROUPS: { key: ItemTypeDef['group']; label: string; icon: string }[] = [
  { key: 'services', label: 'Services', icon: 'services' },
  { key: 'articles', label: 'Articles', icon: 'articles' },
  { key: 'media', label: 'Media', icon: 'media' },
  { key: 'home', label: 'Home page', icon: 'homepage' },
  { key: 'about', label: 'About us', icon: 'about' },
  { key: 'other', label: 'Other', icon: 'other' },
];

export function Shell({
  email,
  role,
  unread,
  signOut,
  children,
}: {
  email: string;
  role: 'owner' | 'editor';
  unread: number;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const is = (href: string, exact = false) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + '/'));
  const link = (href: string, label: string, icon: string, opts: { exact?: boolean; badge?: number } = {}) => (
    <Link key={href} href={href} className={`nav-link ${is(href, opts.exact) ? 'active' : ''}`} prefetch>
      <Icon name={icon} />
      <span>{label}</span>
      {!!opts.badge && <span className="badge badge-red">{opts.badge}</span>}
    </Link>
  );

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link href="/admin" className="brand" style={{ textDecoration: 'none' }}>
          <span className="brand-mark">AM</span>
          <span>
            Dr. Ahmed El Masry
            <small>Website dashboard</small>
          </span>
        </Link>
        {link('/admin', 'Overview', 'dashboard', { exact: true })}
        {link('/admin/messages', 'Messages', 'mail', { badge: unread })}
        {GROUPS.map((g) => {
          const types = ITEM_TYPES.filter((t) => t.group === g.key);
          if (!types.length) return null;
          return (
            <div className="nav-group" key={g.key}>
              <div className="nav-group-title">{g.label}</div>
              {types.map((t) => link(`/admin/items/${t.type}`, t.label, g.icon))}
            </div>
          );
        })}
        <div className="nav-group">
          <div className="nav-group-title">Website</div>
          {link('/admin/pages', 'Pages', 'pages')}
          {link('/admin/settings', 'Settings', 'settings')}
          {link('/admin/media', 'Media library', 'image')}
        </div>
        <div className="nav-group">
          <div className="nav-group-title">Account</div>
          {role === 'owner' && link('/admin/users', 'Users', 'users')}
          {link('/admin/account', 'Change password', 'key')}
        </div>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <a className="btn btn-sm btn-ghost" href="/" target="_blank" rel="noreferrer">
            <Icon name="globe" /> View website
          </a>
          <div className="spacer" />
          <div className="who">
            <span className="email">{email}</span>
            <span className={`badge ${role === 'owner' ? 'badge-blue' : ''}`}>{role}</span>
          </div>
          <form action={signOut}>
            <button className="btn btn-sm" type="submit">
              <Icon name="logout" /> Sign out
            </button>
          </form>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
