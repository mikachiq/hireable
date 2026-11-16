"use client";

import Link from "next/link";
import "@/app/workspace.css";
import { useEffect, useRef, useState } from "react";
import { analyzeMatch, type MatchResult } from "@/features/job-match/lib/analyze-match";
import { readDocument, readScreenshot } from "../lib/read-document";

export function ApplicationWorkspace() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [filename, setFilename] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [letter, setLetter] = useState("");
  const [notice, setNotice] = useState("");
  const below = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = below.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        section.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 380, easing: "ease-out" });
      }
    }, { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [result]);

  function invalidate() { setResult(null); setLetter(""); setNotice(""); }
  async function importFile(file: File, screenshot = false) {
    if (reading || busy) return;
    setReading(true);
    invalidate();
    setImportStatus(screenshot ? "Reading screenshot..." : "Reading resume...");
    try {
      const text = await (screenshot ? readScreenshot(file) : readDocument(file));
      if (!text.trim()) throw new Error(screenshot ? "No text found. Try a clearer screenshot." : "No text found. Upload a document with selectable text.");
      if (screenshot) setJob(text); else { setResume(text); setFilename(file.name); }
      setImportStatus(screenshot ? "Screenshot text extracted." : "Resume uploaded.");
    } catch (error) { setImportStatus(error instanceof Error ? error.message : "Could not read this file. Please try again."); }
    finally { setReading(false); }
  }
  async function compare() {
    if (busy || reading || !resume.trim() || !job.trim()) return;
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setResult(analyzeMatch(resume, job));
    setBusy(false);
  }
  function generate() {
    const sentences = resume.split(/\n|(?<=[.!?])\s+/).filter((line) => line.trim().length > 20);
    const relevant = sentences.filter((line) => result?.evidence.some((item) => item.matched && line.toLowerCase().includes(item.requirement.toLowerCase())));
    setLetter(`Dear Hiring Team,\n\nI am applying for the advertised position.\n\n${(relevant.length ? relevant : sentences).slice(0, 2).join(" ")}\n\n${result?.evidence.some((item) => item.matched) ? `My experience aligns with your requirements for ${result.evidence.filter((item) => item.matched).map((item) => item.requirement.toLowerCase()).join(", ")}.` : "I would welcome the opportunity to discuss how my background could contribute to your team."}\n\nThank you for considering my application. I look forward to discussing the role.\n\nSincerely,\n[Your name]`);
  }
  return <div className="shell single-workspace">
    <header className="workspace-header"><Link className="brand" href="/">hireable</Link><Link className="button button-secondary" href="/tracker">Application tracker</Link></header>
    <main><div className="workspace-intro"><h1>Compare your resume to the job.</h1>
      {process.env.NODE_ENV === "development" && <div className="test-data-actions"><button className="button button-secondary" disabled={busy || reading} onClick={() => {
        setResume("Alex Morgan\nProduct Marketing Manager\n\nLed cross-functional product launches for a B2B software company, increasing trial signups by 24%.\nDeveloped positioning and go-to-market strategy using customer interviews and market research.\nPartnered with sales and product teams to create sales enablement materials.\nUsed campaign analytics to improve conversion rates by 18%.");
        setJob("We are hiring a Product Marketing Manager to lead product launches and develop positioning and go-to-market strategy. You will turn customer research into messaging, partner with sales and product teams, and use analytics to measure campaign performance. Experience managing stakeholder relationships and driving growth is required.");
        setFilename("");
        invalidate();
      }}>Use test data</button></div>}</div>
      <p className="import-status" role="status">{reading && <span className="comparison-spinner" />}{importStatus}</p>
      <section className={`comparison-grid ${result ? "has-results" : ""}`} aria-label="Resume comparison" aria-busy={busy || reading}>
        <div className="source-panel"><div className="panel-heading"><h2>Your resume</h2></div><label className={`resume-upload ${reading || busy ? "is-disabled" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void importFile(file); }}><strong>{filename || (resume ? "Sample resume loaded" : "Upload your resume")}</strong><span>PDF, DOCX or TXT</span><span className="button button-secondary">{resume ? "Replace resume" : "Choose file"}</span><input className="sr-only" aria-label="Upload resume" disabled={busy || reading} type="file" accept=".pdf,.docx,.txt" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ""; }} /></label>{resume && <details className="resume-preview"><summary>View extracted resume</summary><pre>{resume}</pre></details>}</div>
        <div className="source-panel"><div className="panel-heading"><h2>Job description</h2></div><div className="job-import"><label className="import-label">Upload screenshot<input disabled={busy || reading} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file, true); event.target.value = ""; }} /></label></div><label className="sr-only" htmlFor="job">Job description text or screenshot</label><textarea id="job" disabled={busy || reading} value={job} onPaste={(event) => { const image = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"))?.getAsFile(); if (image) { event.preventDefault(); void importFile(image, true); } }} onChange={(event) => { setJob(event.target.value); invalidate(); }} placeholder="Paste job description text or a screenshot here..." /></div>
        {result && <aside className="result-panel"><span className="eyebrow">Your match</span><div className="result-percentage">{result.score}<span>%</span></div><h2>Keyword coverage</h2><p>{result.evidence.filter((item) => item.matched).length} of {result.evidence.length} checked requirements found.</p><p>An indicative keyword comparison, not a hiring prediction.</p><button className="button button-primary" onClick={() => below.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Improve my application &darr;</button></aside>}
      </section>
      <div className="comparison-actions"><div role="status">{busy ? <span className="loading-status"><span className="comparison-spinner" />Comparing your resume with the job description...</span> : result ? "Comparison complete" : ""}</div><button className="button button-primary" disabled={busy || !resume.trim() || !job.trim()} onClick={compare}>{busy ? "Comparing..." : result ? "Compare again" : "Compare resume"}</button></div>
      {result && <section className="improvement-section" ref={below}><span className="eyebrow">Next steps</span><h2>Make your experience count.</h2><div className="improvement-grid"><section><h3>Resume improvements</h3><ul className="list">{result.evidence.map((item) => <li key={item.requirement}><strong className={item.matched ? "success" : "warn"}>{item.requirement} · {item.matched ? "Found" : "Needs evidence"}</strong><small>{item.matched ? `Bring your ${item.requirement.toLowerCase()} experience forward with a specific action and measurable outcome.` : `${item.note} Include it only if accurate.`}</small></li>)}</ul><label className="field-label" htmlFor="revised">Revise your resume</label><textarea key={resume} id="revised" className="textarea editor" defaultValue={resume} /></section><section><div className="panel-heading"><h3>Cover letter</h3><button className="button button-secondary" onClick={generate}>{letter ? "Regenerate" : "Generate letter"}</button></div>{letter ? <><label className="sr-only" htmlFor="letter">Cover letter</label><textarea id="letter" className="textarea editor" value={letter} onChange={(event) => setLetter(event.target.value)} /><button className="button button-secondary" onClick={async () => { try { await navigator.clipboard.writeText(letter); setNotice("Cover letter copied."); } catch { setNotice("Could not copy. Select the letter text to copy it."); } }}>Copy letter</button></> : <div className="letter-empty">Your cover letter</div>}</section></div></section>}
      <p role="status">{notice}</p>
    </main>
  </div>;
}
