"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { generateEmail } from "@/features/application-email/lib/generate-email";
import { analyzeMatch } from "@/features/job-match/lib/analyze-match";
import { saveApplication } from "@/features/anonymous-workspace/lib/workspace-storage";

type View = "import" | "analysis" | "tailor";
const sampleResume = "Led cross-functional product launches and customer research for a growing B2B software company. Created go-to-market strategy, analyzed campaign performance, and partnered with sales and product teams.";
const sampleJob = "We are looking for a Product Marketing Manager to lead product launches, develop positioning, use customer insights, and collaborate with product, sales, and growth teams. Experience with enterprise SaaS is preferred.";

export function ApplicationWorkspace() {
  const [view, setView] = useState<View>("import");
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [editorTab, setEditorTab] = useState<"resume" | "email">("resume");
  const result = useMemo(() => analyzeMatch(resume, job), [resume, job]);
  const tailoredResume = resume || sampleResume;
  const email = useMemo(() => generateEmail(company, role, tailoredResume), [company, role, tailoredResume]);

  function beginAnalysis() {
    if (!resume.trim() || !job.trim()) return;
    setView("analysis");
  }
  function saveToTracker() {
    saveApplication({ id: crypto.randomUUID(), company: company || "Untitled company", role: role || "Untitled role", status: "Preparing", updatedAt: new Date().toISOString() });
    window.alert("Saved to your local application tracker.");
  }

  return <div className="shell">
    <header className="workspace-header"><div><Link className="brand" href="/"><span className="brand-mark">✦</span>hireable</Link></div><div className="workspace-title"><span>Application workspace</span><strong>{role || "New application"}</strong></div><div className="progress"><span className={view === "import" ? "active" : ""}/><span className={view === "analysis" ? "active" : ""}/><span className={view === "tailor" ? "active" : ""}/></div></header>
    {view === "import" && <section className="flow"><div className="panel"><span className="eyebrow">Step 1 of 3</span><h1>Bring the context.</h1><p>Start with the role and your existing resume. We’ll use only the experience you provide.</p><label className="field-label" htmlFor="company">Company <span aria-hidden="true">(optional)</span></label><input id="company" className="textarea" style={{minHeight: "auto"}} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Acme Inc."/><label className="field-label" htmlFor="role">Role <span aria-hidden="true">(optional)</span></label><input id="role" className="textarea" style={{minHeight: "auto"}} value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Product Marketing Manager"/><label className="field-label" htmlFor="resume">Your resume</label><textarea id="resume" className="textarea" value={resume} onChange={(event) => setResume(event.target.value)} placeholder="Paste resume text here. PDF, DOCX, and screenshot import will connect to this same workspace."/><label className="field-label" htmlFor="job">Job description</label><textarea id="job" className="textarea" value={job} onChange={(event) => setJob(event.target.value)} placeholder="Paste the job description here."/><div className="action-row"><button className="link-button" onClick={() => { setResume(sampleResume); setJob(sampleJob); setCompany("Northstar"); setRole("Product Marketing Manager"); }}>Use sample content</button><button className="button button-primary" disabled={!resume.trim() || !job.trim()} onClick={beginAnalysis}>Analyze fit <span>→</span></button></div></div><aside className="side-panel"><h3>Built around your evidence.</h3><p>Hireable identifies relevant experience, then lets you decide what to use.</p><ul className="side-list"><li><span>✓</span>No generic ATS score</li><li><span>✓</span>Reviewable suggestions</li><li><span>✓</span>Nothing sent automatically</li></ul></aside></section>}
    {view === "analysis" && <section className="analysis"><div className="panel"><span className="eyebrow">Step 2 of 3</span><h1>Your match, explained.</h1><p>{result.summary}</p><div className="match-score"><div className="big-score">{result.score}%</div><div><span className="pill">Starting fit</span><p>Use this as a guide—not a prediction. The strongest applications show evidence, not just keywords.</p></div></div><h2 style={{marginTop: 28}}>Requirement coverage</h2><ul className="list">{result.evidence.map((item) => <li key={item.requirement}><strong className={item.matched ? "success" : "warn"}>{item.matched ? "✓ Evidence found" : "○ Worth strengthening"} · {item.requirement}</strong><small>{item.note}</small></li>)}</ul><div className="action-row"><button className="link-button" onClick={() => setView("import")}>← Edit source material</button><button className="button button-primary" onClick={() => setView("tailor")}>Tailor application <span>→</span></button></div></div><aside className="side-panel"><h3>What this means</h3><p>Focus your application on demonstrated product-launch, customer-insight, and cross-functional work. Do not claim enterprise SaaS expertise unless it is accurate.</p></aside></section>}
    {view === "tailor" && <section className="analysis"><div className="panel"><span className="eyebrow">Step 3 of 3</span><h1>Review before you send.</h1><p>Keep language truthful, specific, and recognizably yours.</p><div className="tabs"><button className={editorTab === "resume" ? "active" : ""} onClick={() => setEditorTab("resume")}>Tailored resume</button><button className={editorTab === "email" ? "active" : ""} onClick={() => setEditorTab("email")}>Application email</button></div>{editorTab === "resume" ? <textarea className="textarea editor" defaultValue={tailoredResume} aria-label="Tailored resume"/> : <div className="email-box"><small>SUBJECT</small><p><strong>{email.subject}</strong></p><hr style={{border:0,borderTop:"1px solid #e4e8e2"}}/><small>BODY</small><p>{email.body}</p></div>}<div className="action-row"><button className="link-button" onClick={() => setView("analysis")}>← Back to analysis</button><button className="button button-primary" onClick={saveToTracker}>Save application <span>→</span></button></div></div><aside className="side-panel"><h3>Send it your way.</h3><p>Copy the email into your preferred mail client. Hireable never emails employers on your behalf.</p><ul className="side-list"><li><span>✓</span>Subject line included</li><li><span>✓</span>Editable before copy</li><li><span>✓</span>Saved locally to tracker</li></ul></aside></section>}
  </div>;
}
