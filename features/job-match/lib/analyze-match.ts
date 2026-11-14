export type MatchResult = { score: number; evidence: { requirement: string; note: string; matched: boolean }[]; summary: string };

const terms = ["lead", "manage", "analytics", "strategy", "stakeholder", "customer", "growth", "product", "sales", "marketing", "technical"];

export function analyzeMatch(resume: string, job: string): MatchResult {
  const combinedResume = resume.toLowerCase();
  const jobText = job.toLowerCase();
  const present = terms.filter((term) => jobText.includes(term));
  const evidence = (present.length ? present : ["relevant experience", "collaboration", "communication"]).slice(0, 5).map((term) => ({
    requirement: term[0].toUpperCase() + term.slice(1),
    note: combinedResume.includes(term) ? `Evidence found in your resume for ${term}.` : `Add a specific example that demonstrates ${term}.`,
    matched: combinedResume.includes(term)
  }));
  const score = evidence.length ? Math.max(42, Math.round((evidence.filter((item) => item.matched).length / evidence.length) * 58 + 36)) : 58;
  return { score, evidence, summary: "This is an evidence-based starting point. Review every suggested claim before using it in an application." };
}
