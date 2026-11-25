import { useId, useMemo } from "react";
import { formatResumeEntries } from "../lib/format-resume-entries";
import { sectionResume } from "../lib/section-resume";

export function ResumePreview({ text }: { text: string }) {
  const summaryId = useId();
  const sections = useMemo(() => sectionResume(text), [text]);

  return (
    <details className="resume-preview">
      <summary id={summaryId}>View extracted resume</summary>
      <div className="resume-preview-content" role="region" aria-labelledby={summaryId} tabIndex={0}>
        {sections.map((section) => (
          <section key={section.title} className="resume-preview-section">
            <h3>{section.title}</h3>
            {section.title === "Experience" || section.title === "Projects" ? formatResumeEntries(section.text, section.title).map(({ heading, bullets }, index) => (
              <div key={index} className="resume-preview-entry">
                {heading && <h4>{heading}</h4>}
                {bullets.length > 0 && <ul>{bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
              </div>
            )) : section.text.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
        ))}
      </div>
    </details>
  );
}
