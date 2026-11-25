const skills = "Skills";
export const toolsSectionTitle = "Tools & software";
const certification = String.raw`(?:certifications?|certificates?|licen[cs]es?|training|seminars?|workshops?|professional development)`;

const headings: [RegExp, string][] = [
  [/^(?:(?:relevant|professional|work|career|employment|volunteer|internship) )*experience$|^(?:work|employment|career) history$/i, "Experience"],
  [/^(?:education|academic background|academic qualifications)(?: (?:and|&) (?:training|qualifications))?$/i, "Education"],
  [/^education (?:and|&) (?:certifications|certificates|licenses)$/i, "Education & certifications"],
  [/^(?:(?:technical|core|key|professional|relevant) )?skills(?: (?:and|&) (?:capabilities|tools|competencies|expertise|technologies))?$|^(?:core competencies|technical proficiencies|technologies|tech stack)$/i, skills],
  [/^(?:(?:technical |digital |ai )?tools(?:\s*\/\s*tech(?:nologies)?| (?:and|&) (?:technologies|software|platforms))?|(?:accounting )?software(?:,? (?:tools )?(?:and|&) (?:tools|platforms))?(?: ai tools)?|platforms)$/i, toolsSectionTitle],
  [/^contact(?: (?:details|information|info))?$/i, "Contact details"],
  [/^personal (?:details|information|info|profile)$|^(?:about me|about)$/i, "Personal information"],
  [/^(?:(?:career|professional|executive) )?(?:summary|profile|objective)$/i, "Summary"],
  [/^(?:(?:academic|key|personal|professional|relevant|selected|side) )?projects(?: (?:and|&) portfolio)?$|^(?:portfolio|project highlights)$/i, "Projects"],
  [new RegExp(`^${certification}(?:(?:,\\s*(?:(?:and|&)\\s+)?| (?:and|&) )${certification})*$`, "i"), "Certifications & training"],
  [/^languages(?: spoken)?$/i, "Languages"],
  [/^(?:awards|honors|honours|achievements)(?: (?:and|&) (?:awards|honors|honours|achievements))?$/i, "Awards & achievements"],
  [/^(?:volunteering|volunteer work|community involvement)$/i, "Volunteering"],
  [/^(?:references|publications|interests|additional information)$/i, ""],
];

const personal = "Personal information";
const contact = "Contact details";
const fallback = "Resume details";

const skillCategory = String.raw`(?:programming\s+languages|frameworks\s+(?:&|and)\s+technologies|development\s*,\s*testing\s*(?:,\s*)?(?:&|and)\s+deployment|ai\s+(?:&|and)\s+automation\s+tools)`;
const skillCategoryLine = new RegExp(`^(?:[•▪●-]\\s*)?${skillCategory}(?:\\s*:.*)?$`, "i");
const skillCategoryLabel = new RegExp(`\\b(${skillCategory})[ \\t]*:`, "gi");

function recoverSkillCategoryLines(text: string) {
  return text.replace(skillCategoryLabel, (match: string, label: string, offset: number) => {
    const prefix = text.slice(text.lastIndexOf("\n", offset - 1) + 1, offset);
    const startsLine = /^\s*(?:[•▪●-]\s*)?$/.test(prefix);
    if (!startsLine && label !== label.toUpperCase()) return match;
    return `${startsLine ? "" : "\n"}${label.replace(/\s+/g, " ")}:`;
  });
}

export function readResumeHeading(line: string) {
  const [, label, inline = ""] = /^([^:]+?)(?:\s*:\s*(.*))?$/.exec(line) ?? [];
  if (!label) return;
  const normalized = label.trim().replace(/\s+/g, " ");
  const match = headings.find(([pattern]) => pattern.test(normalized));
  if (match) return { title: match[1] || normalized[0].toUpperCase() + normalized.slice(1).toLowerCase(), inline, label: normalized };
}

function isContactDetail(line: string) {
  return /^(?:(?:phone|tel(?:ephone)?|mobile|cell(?:\s+phone)?)(?:\s+(?:number|no\.?)|\s*#)?|contact\s+(?:number|no\.?))\s*:\s*\S/i.test(line)
    || /^(?:e-?mail|address|location|linkedin|github|website|portfolio)\s*:\s*\S/i.test(line)
    || /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w.-]+\.[a-z]{2,}$/i.test(line)
    || /^(?:https?:\/\/|www\.|(?:linkedin|github)\.com\/)\S+$/i.test(line)
    || /^(?=(?:\D*\d){7,15}\D*$)\+?[\d(][\d().\s-]+$/.test(line);
}

export function sectionResume(text: string) {
  const sections = new Map<string, string[]>([[personal, []], [contact, []]]);
  const lines = recoverSkillCategoryLines(text.replace(/\r\n?/g, "\n")).trim().split("\n").map((line) => line.trim());
  const firstLine = lines.find((line) => line && !isContactDetail(line)) ?? "";
  const firstLineLooksLikeName = /^\p{Lu}[\p{L}.'’-]+(?: +\p{Lu}[\p{L}.'’-]*){1,6}$/u.test(firstLine.split(/\s*[|•]\s*|\s{2,}/)[0]);
  let title = firstLineLooksLikeName ? personal : fallback;
  let inIntro = true;

  function append(section: string, line: string) {
    const content = sections.get(section) ?? [];
    content.push(line);
    sections.set(section, content);
  }

  for (const line of lines) {
    const heading = readResumeHeading(line);
    const projectTechnology = title === "Projects" && heading?.inline
      && /^(?:technologies|tech stack|tools(?:\s*\/\s*tech(?:nologies)?| (?:and|&) (?:software|technologies|platforms))?|software)$/i.test(heading.label);
    if (heading && !projectTechnology) {
      title = heading.title;
      inIntro = false;
      if (sections.get(title)?.length) append(title, "");
      if (title === toolsSectionTitle && !/^tools(?: (?:and|&) software)?$/i.test(heading.label)) {
        append(title, heading.inline ? `${heading.label}: ${heading.inline}` : heading.label);
      } else if (heading.inline) {
        append(title, heading.inline);
      }
      continue;
    }

    if (skillCategoryLine.test(line)) {
      title = skills;
      inIntro = false;
      if (sections.get(title)?.length) append(title, "");
      append(title, line.replace(/^[•▪●-]\s*/, ""));
      continue;
    }

    if (inIntro || title === personal) {
      const parts = line.split(/\s*[|•]\s*|\s{2,}/);
      if (parts.some(isContactDetail)) {
        for (const part of parts.filter(Boolean)) append(isContactDetail(part) ? contact : title, part);
        continue;
      }
    }

    append(title, line);
    if (inIntro && !line && sections.get(personal)?.some(Boolean)) title = fallback;
  }

  return Array.from(sections, ([title, lines]) => ({ title, text: lines.join("\n").trim() }))
    .filter((section) => section.text);
}
