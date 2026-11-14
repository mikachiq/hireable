"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApplications, type StoredApplication } from "@/features/anonymous-workspace/lib/workspace-storage";

const stages: StoredApplication["status"][] = ["Saved", "Preparing", "Applied", "Interview"];

export function ApplicationTracker() {
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  useEffect(() => setApplications(getApplications()), []);
  return <div className="shell"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">✦</span>hireable</Link><Link className="button button-primary" href="/application/new">New application <span>→</span></Link></header><main className="panel"><span className="eyebrow">Local workspace</span><h1>Application tracker</h1><p>Keep your job search moving. This browser stores your application entries locally.</p><section className="tracker-grid">{stages.map((stage) => <div className="column" key={stage}><h2>{stage}<span>{applications.filter((item) => item.status === stage).length}</span></h2>{applications.filter((item) => item.status === stage).map((item) => <button className="app-card" key={item.id}><b>{item.role}</b><small>{item.company}</small><small>Updated {new Date(item.updatedAt).toLocaleDateString()}</small></button>)}</div>)}</section>{applications.length === 0 && <div style={{marginTop: 24}}><Link className="button button-secondary" href="/application/new">Start your first application</Link></div>}</main></div>;
}
