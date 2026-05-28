"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import s from "../../app/admin/dashboard.module.css";
import { StatCard, Card, BarChart, Donut, Pill } from "./Primitives";
import {
  BackIconD,
  ClockIcon,
  DollarIcon,
  HomeIcon,
  MicFillD,
  NotesIcon,
  PlugIconD,
  SearchIconD,
  ShieldIcon,
  SignalIcon,
  TrashIconD,
  UsersIcon,
} from "./DashIcons";
import {
  deleteUserAction,
  getDashboardDataAction,
  setUserPlanAction,
  setUserRoleAction,
  type DashboardData,
  type Role,
} from "@/lib/actions/admin";
import { formatRelative } from "@/lib/notes";

type Tab = "overview" | "users";

export default function DashboardConsole() {
  const [state, setState] = useState<"loading" | "ok" | "auth" | "forbidden">("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");

  async function load() {
    const res = await getDashboardDataAction();
    if (res.ok) {
      setData(res.data);
      setRole(res.role);
      setState("ok");
    } else {
      setState(res.error === "auth" ? "auth" : "forbidden");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const isAdmin = role === "admin";

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [data, query]);

  // ── Gates ──
  if (state === "loading") {
    return (
      <div className={s.gate}>
        <div className={s.gateInner}>
          <p>Loading console…</p>
        </div>
      </div>
    );
  }
  if (state === "auth") {
    return (
      <div className={s.gate}>
        <div className={s.gateInner}>
          <h1>Sign in <span className="serif">required</span></h1>
          <p>You need to be signed in to view the console.</p>
          <Link className="btn primary lg" href="/app">Go to Notably</Link>
        </div>
      </div>
    );
  }
  if (state === "forbidden" || !data) {
    return (
      <div className={s.gate}>
        <div className={s.gateInner}>
          <h1>No <span className="serif">access</span></h1>
          <p>This area is for staff and admins only. If you think this is a mistake, contact an administrator.</p>
          <Link className="btn outline lg" href="/app">Back to your notes</Link>
        </div>
      </div>
    );
  }

  const m = data.metrics;

  async function handlePlan(userId: string, plan: "free" | "pro") {
    await setUserPlanAction(userId, plan);
    await load();
  }
  async function handleRole(userId: string, r: Role) {
    await setUserRoleAction(userId, r);
    await load();
  }
  async function handleDelete(userId: string) {
    if (!confirm("Delete this user and all their notes? This can't be undone.")) return;
    await deleteUserAction(userId);
    await load();
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href="/" className={s.brand}>
          <span className={s.brandMic}><MicFillD size={11} /></span>
          <span className={s.brandName}>notably</span>
        </Link>

        <div className={s.workspace}>
          <span className={s.wsDot} style={{ background: isAdmin ? "var(--ink)" : "var(--blue)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={s.wsLabel}>Workspace</div>
            <div className={s.wsName}>{role} console</div>
          </div>
        </div>

        <nav className={s.nav}>
          <button className={`${s.navItem} ${tab === "overview" ? s.active : ""}`} onClick={() => setTab("overview")}>
            <HomeIcon size={17} /> Overview
          </button>
          <button className={`${s.navItem} ${tab === "users" ? s.active : ""}`} onClick={() => setTab("users")}>
            <UsersIcon size={17} /> Users
          </button>
        </nav>

        <div className={s.sideFoot}>
          <Link href="/app" className={s.backLink}>
            <BackIconD size={15} /> Back to app
          </Link>
        </div>
      </aside>

      <div className={s.main}>
        <div className={s.topbar}>
          <div>
            <div className={s.pageTitle}>{tab === "overview" ? "Overview" : "Users"}</div>
            <div className={s.pageSub}>
              {tab === "overview" ? "Platform health at a glance" : `${data.users.length} accounts`}
            </div>
          </div>
          <span className={`${s.roleBadge} ${isAdmin ? s.admin : s.staff}`}>
            <ShieldIcon size={13} /> {isAdmin ? "Administrator" : "Staff"}
          </span>
        </div>

        <div className={s.content}>
          {tab === "overview" ? (
            <>
              <div className={s.statGrid}>
                <StatCard
                  icon={<UsersIcon size={18} />}
                  value={m.totalUsers.toLocaleString()}
                  label="Total users"
                  delta={m.newUsers7d > 0 ? `+${m.newUsers7d} this week` : undefined}
                />
                <StatCard
                  icon={<DollarIcon size={18} />}
                  value={`$${m.mrr.toLocaleString()}`}
                  label="Monthly recurring revenue"
                  tone="ink"
                />
                <StatCard
                  icon={<NotesIcon size={18} />}
                  value={m.totalNotes.toLocaleString()}
                  label="Notes captured"
                  delta={m.notesToday > 0 ? `+${m.notesToday} today` : undefined}
                />
                <StatCard
                  icon={<ClockIcon size={18} />}
                  value={`${m.hoursTranscribed.toLocaleString()}h`}
                  label="Hours transcribed"
                  tone="blue"
                />
              </div>

              <div className={s.row2}>
                <Card title="Notes per day" subtitle="Last 7 days">
                  <BarChart data={data.notesPerDay} />
                </Card>
                <Card title="Plan mix" subtitle="Free vs Pro">
                  <Donut
                    centerMain={`${m.totalUsers > 0 ? Math.round((m.proUsers / m.totalUsers) * 100) : 0}%`}
                    centerSub="Pro"
                    segments={[
                      { label: "Pro", value: m.proUsers, color: "var(--sage)" },
                      { label: "Free", value: m.freeUsers, color: "var(--sage-soft)" },
                    ]}
                  />
                </Card>
              </div>

              <div className={s.statGrid}>
                <StatCard icon={<SignalIcon size={18} />} value={m.notes7d.toLocaleString()} label="Notes this week" />
                <StatCard icon={<DollarIcon size={18} />} value={m.proUsers.toLocaleString()} label="Pro subscribers" tone="ink" />
                <StatCard icon={<UsersIcon size={18} />} value={m.freeUsers.toLocaleString()} label="Free users" />
                <StatCard icon={<PlugIconD size={18} />} value={m.connections.toLocaleString()} label="Export connections" tone="blue" />
              </div>
            </>
          ) : (
            <Card
              title="All users"
              subtitle={isAdmin ? "Manage plans and roles" : "Read-only — staff view"}
              right={
                <div className={s.tableSearch}>
                  <SearchIconD size={15} />
                  <input
                    placeholder="Search users…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              }
            >
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Role</th>
                      <th>Notes</th>
                      <th>Joined</th>
                      {isAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className={s.uName}>{u.name}</div>
                          <div className={s.uEmail}>{u.email}</div>
                        </td>
                        <td>
                          {u.plan === "pro" ? <Pill tone="sage">Pro</Pill> : <Pill tone="gray">Free</Pill>}
                        </td>
                        <td>
                          {u.role === "admin" ? (
                            <Pill tone="ink">Admin</Pill>
                          ) : u.role === "staff" ? (
                            <Pill tone="blue">Staff</Pill>
                          ) : (
                            <Pill tone="gray">User</Pill>
                          )}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{u.noteCount}</td>
                        <td style={{ color: "var(--ink-soft)" }}>{formatRelative(u.createdAt)}</td>
                        {isAdmin && (
                          <td>
                            <div className={s.rowActions}>
                              <select
                                className={s.miniSelect}
                                value={u.plan}
                                onChange={(e) => handlePlan(u.id, e.target.value as "free" | "pro")}
                                title="Change plan"
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                              </select>
                              <select
                                className={s.miniSelect}
                                value={u.role}
                                onChange={(e) => handleRole(u.id, e.target.value as Role)}
                                title="Change role"
                              >
                                <option value="user">User</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                className={`${s.iconBtn} ${s.danger}`}
                                onClick={() => handleDelete(u.id)}
                                title="Delete user"
                              >
                                <TrashIconD size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
