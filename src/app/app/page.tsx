"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import s from "./app.module.css";
import Recorder from "@/components/Recorder";
import NoteModal from "@/components/NoteModal";
import UpgradeModal from "@/components/UpgradeModal";
import AuthModal from "@/components/AuthModal";
import {
  CloudIcon,
  LogOutIcon,
  MicFilled,
  SearchIcon,
  TrashIcon,
} from "@/components/Icons";
import { DAILY_FREE_LIMIT, formatDuration, formatRelative, type Note } from "@/lib/notes";
import { useNotesStore } from "@/lib/useNotesStore";
import { signOut, useSession } from "@/lib/auth-client";

export default function AppPage() {
  const store = useNotesStore();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Note | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isPro = store.plan === "pro";
  const canRecord = isPro || store.remaining > 0;

  // Close account dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSave(text: string, durationMs: number, lang: string) {
    const res = await store.create(text, durationMs, lang);
    if (res === "quota") setShowUpgrade(true);
    if (res === "auth") setShowAuth(true);
  }

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    window.location.reload();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return store.notes;
    return store.notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [store.notes, query]);

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Account";
  const initials = (session?.user?.name || session?.user?.email || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <div className={s.topbarRow}>
          <Link href="/" className={s.brand}>
            <span className={s.brandMic}><MicFilled size={11} /></span>
            notably
          </Link>

          <div className={s.topRight}>
            {!isPro && (
              <div
                className={`${s.quotaPill} ${store.ready && store.remaining <= 1 ? s.low : ""}`}
                title="Free notes reset at midnight"
              >
                <span className={s.quotaDots}>
                  {Array.from({ length: DAILY_FREE_LIMIT }).map((_, i) => (
                    <span
                      key={i}
                      className={`${s.quotaDot} ${store.ready && i < store.used ? s.used : ""}`}
                    />
                  ))}
                </span>
                {store.ready ? (
                  <span><b>{store.remaining}</b> of {DAILY_FREE_LIMIT} free left</span>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            )}

            {store.ready && !store.signedIn && (
              <button className="btn primary" onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            )}

            {store.ready && store.signedIn && (
              <div className={s.acctMenu} ref={menuRef}>
                <button className={s.acctBtn} onClick={() => setMenuOpen((o) => !o)}>
                  <span className={s.avatar}>{initials}</span>
                  <span className={s.acctName}>{userName}</span>
                </button>
                {menuOpen && (
                  <div className={s.dropdown}>
                    <div className={s.dropEmail}>{session?.user?.email}</div>
                    <button className={s.dropItem} onClick={handleSignOut}>
                      <LogOutIcon size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={s.main}>
        {store.ready && store.signedIn && store.pendingImport > 0 && (
          <div className={s.importBanner}>
            <CloudIcon size={18} />
            <span className={s.txt}>
              You have <b>{store.pendingImport}</b> note{store.pendingImport > 1 ? "s" : ""} saved on
              this device. Move them into your account?
            </span>
            <div className={s.importActions}>
              <button className={`btn ghost ${s.btnSm}`} onClick={store.dismissImport}>
                Not now
              </button>
              <button className={`btn primary ${s.btnSm}`} onClick={store.importLocal}>
                Import
              </button>
            </div>
          </div>
        )}

        {store.ready && !store.signedIn && (
          <div className={s.syncHint}>
            <CloudIcon size={18} />
            <span className={s.txt}>
              Notes are saved on this device only. Sign in to sync them across your phone and
              computer.
            </span>
            <button className={`btn outline ${s.btnSm}`} onClick={() => setShowAuth(true)}>
              Sign in to sync
            </button>
          </div>
        )}

        <Recorder
          canRecord={canRecord}
          onSave={handleSave}
          onQuotaHit={() => setShowUpgrade(true)}
        />

        <div className={s.libHead}>
          <div className={s.libTitle}>
            Your library
            {store.ready && store.notes.length > 0 && (
              <span className={s.libCount}>{store.notes.length}</span>
            )}
          </div>
          {store.ready && store.notes.length > 0 && (
            <div className={s.searchBox}>
              <SearchIcon size={18} />
              <input
                className={s.searchInput}
                placeholder="Search your notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {!store.ready ? null : filtered.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emoji}>🎙️</div>
            {store.notes.length === 0 ? (
              <>
                <h3>No notes yet</h3>
                <p>Press the mic above and say something. It&apos;ll show up here.</p>
              </>
            ) : (
              <>
                <h3>Nothing matches &ldquo;{query}&rdquo;</h3>
                <p>Try a different word.</p>
              </>
            )}
          </div>
        ) : (
          <div className={s.noteGrid}>
            {filtered.map((n) => (
              <div key={n.id} className={`${s.noteCard} fade-up`} onClick={() => setActive(n)}>
                <div className={s.noteCardTop}>
                  <div className={s.noteCardTitle}>{n.title}</div>
                  <button
                    className={s.delBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      void store.remove(n.id);
                    }}
                    aria-label="Delete note"
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
                <div className={s.noteCardBody}>{n.body}</div>
                <div className={s.noteCardMeta}>
                  <span>{formatRelative(n.createdAt)}</span>
                  <span className={s.dot} />
                  <span>{formatDuration(n.durationMs)}</span>
                  <span className={s.dot} />
                  <span>{n.lang}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {active && (
        <NoteModal
          note={active}
          onClose={() => setActive(null)}
          onSave={(id, title, body) => void store.update(id, title, body)}
        />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
