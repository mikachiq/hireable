const bulletMarker = /^(?:[•●▪◦‣∙·\uF0B7]\s*|[-*–—]\s+|\d+[.)]\s+)/u;
const month = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const date = `(?:${month}\\.?\\s+|\\d{1,2}[/.-])?(?:19|20)\\d{2}`;
const dateRange = new RegExp(`\\b${date}\\s*(?:[-–—]|to)\\s*(?:${date}|present|current|now|ongoing)(?:\\s*\\([^()]+\\))?$`, "i");
const action = /^(?:Achieved|Analy[sz]ed|Assigned|Automated|Built|Collaborated|Conducted|Coordinated|Created|Delivered|Deployed|Designed|Developed|Directed|Drove|Established|Generated|Implemented|Improved|Increased|Integrated|Launched|Lead|Led|Maintained|Managed|Optimized|Organized|Oversaw|Partnered|Planned|Published|Reduced|Resolved|Streamlined|Supported|Tested|Trained|Used|Worked|Wrote)\b/;
const role = /\b(?:administrator|advisor|analyst|architect|assistant|associate|consultant|coordinator|designer|developer|director|engineer|executive|founder|head|intern|lead|manager|officer|operator|owner|researcher|scientist|specialist|supervisor|teacher|technician|writer)$/i;

type ResumeEntry = { heading?: string; bullets: string[] };

function looksLikeRole(line: string) {
  const title = line.split(/\s+(?:at|@|[|–—-])\s+|,\s+/i)[0].trim();
  const words = title.split(/\s+/);
  if (words.length > 9 || (action.test(title) && !title.startsWith("Lead "))) return false;
  return role.test(title)
    || (title !== line && words.filter((word) => /^\p{Lu}/u.test(word)).length > words.length / 2);
}

const projectDescription = /^(?:an?|this|it)\s+/i;
const projectMetadata = /^(?:description|role|tech(?:nology)?(?: stack)?|technologies|tools(?:\s*(?:\/|&|and)\s*tech(?:nologies)?)?|links?|github|demo)\s*:/i;

function looksLikeProject(line: string) {
  return /^[\p{L}\d]/u.test(line) && line.split(/\s+/).length <= 10
    && !/[.!?,;:]$/.test(line) && !action.test(line) && !projectDescription.test(line)
    && !/^(?:https?:\/\/|www\.)/i.test(line) && !projectMetadata.test(line);
}

export function formatResumeEntries(text: string, section: "Experience" | "Projects"): ResumeEntry[] {
  const entries: ResumeEntry[] = [];
  const lines = text.split("\n").map((line) => line.trim());
  let entry: ResumeEntry = { bullets: [] };
  let afterBlank = true;
  let hasExplicitMarker = false;

  for (const [index, line] of lines.entries()) {
    if (!line) {
      afterBlank = true;
      continue;
    }

    const marker = bulletMarker.exec(line);
    const dates = marker ? null : dateRange.exec(line);
    const title = dates ? line.slice(0, dates.index).trim() : line;
    const isProjectMetadata = section === "Projects" && projectMetadata.test(title);
    const canBeHeading = !marker && Boolean(title) && !/[.!?]$/.test(title) && !action.test(title) && !isProjectMetadata;
    let next = index + 1;
    while (next < lines.length && !lines[next]) next++;
    const nextLine = lines[next] ?? "";
    const followedByDates = canBeHeading && dateRange.exec(nextLine)?.index === 0;
    const entryTitle = !marker && (section === "Projects"
      ? looksLikeProject(title) && (afterBlank || bulletMarker.test(nextLine) || action.test(nextLine) || projectDescription.test(nextLine) || projectMetadata.test(nextLine))
      : looksLikeRole(title));

    if (dates?.index === 0 && entry.heading && !entry.bullets.length) {
      entry.heading += `\n${line}`;
    } else if (followedByDates && !entryTitle && entry.heading && !entry.bullets.length) {
      entry.heading += `\n${line}`;
    } else if (entryTitle || (canBeHeading && dates) || followedByDates) {
      entry = { heading: line, bullets: [] };
      entries.push(entry);
    } else {
      if (!entries.length) entries.push(entry);
      const description = line.slice(marker?.[0].length ?? 0);
      const previous = entry.bullets.at(-1);
      const endsSentence = previous && /[.!?][”"')]*$/.test(previous) && !/\b(?:[a-z]|e\.g|i\.e|vs)\.$/i.test(previous);
      const startsSentence = /^\p{Lu}/u.test(description);
      const startsBullet = marker || afterBlank || isProjectMetadata || (!hasExplicitMarker && (action.test(description) || (endsSentence && startsSentence)));

      if (description && previous && !startsBullet) {
        entry.bullets[entry.bullets.length - 1] = `${previous} ${description}`;
      } else if (description) {
        entry.bullets.push(description);
        hasExplicitMarker = Boolean(marker);
      }
      if (!description && marker) {
        afterBlank = true;
        continue;
      }
    }
    afterBlank = false;
  }

  return entries;
}
