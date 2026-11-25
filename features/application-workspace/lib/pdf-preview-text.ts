import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { readResumeHeading, toolsSectionTitle } from "./section-resume";

type TextRun = { text: string; left: number; right: number; y: number };
type TextRow = { y: number; height: number; runs: TextRun[] };

function findColumnSplit(rows: TextRow[]) {
  const runs = rows.flatMap((row) => row.runs);
  const starts = new Map<number, number>();
  for (const run of runs) {
    const start = Math.round(run.left / 4) * 4;
    starts.set(start, (starts.get(start) ?? 0) + 1);
  }

  // Repeated left edges and overlapping body text distinguish a column from right-aligned dates.
  let best: { x: number; score: number } | undefined;
  for (const [start, count] of starts) {
    if (count < 3) continue;
    const x = start - 8;
    const left = runs.filter((run) => run.right <= x);
    const right = runs.filter((run) => run.left >= x);
    if (left.length < 3 || right.length < 3) continue;

    const top = Math.min(left[0].y, right[0].y);
    const bottom = Math.max(left.at(-1)!.y, right.at(-1)!.y);
    const inBody = (run: TextRun) => run.y <= top && run.y >= bottom;
    const leftBody = left.filter(inBody);
    const rightBody = right.filter(inBody);
    if (leftBody.length < 3 || rightBody.length < 3) continue;
    const hasBodyText = (run: TextRun) => run.right - run.left >= 55 && !/^(?:[a-z.]{3,9}\s+)?(?:19|20)\d{2}\b/i.test(run.text);
    if (rightBody.filter(hasBodyText).length < 2) continue;

    const crossing = runs.filter((run) => inBody(run) && run.left < x && run.right > x).length;
    if (crossing > 1) continue;
    const score = Math.min(leftBody.length, rightBody.length) - crossing;
    if (!best || score > best.score) best = { x, score };
  }
  return best?.x;
}

function writeRows(rows: TextRow[]) {
  return rows.map((row, index) => {
    const previous = rows[index - 1];
    const gap = previous && previous.y - row.y > 1.65 * Math.max(previous.height, row.height);
    return (gap ? "\n" : "") + row.runs.map((run) => run.text).join("  ");
  }).join("\n");
}

function writePageRows(rows: TextRow[]): string {
  const skillsIndex = rows.findIndex((row, index) => {
    const columns = rows[index + 1]?.runs;
    const heading = row.runs.length === 1 && readResumeHeading(row.runs[0].text);
    if (!heading || heading.title !== "Skills" || heading.inline || !columns || columns.length < 2) return false;

    const titles = columns.map((column) => readResumeHeading(column.text)?.title);
    return titles.includes(toolsSectionTitle)
      && titles.every((title) => !title || title === "Skills" || title === toolsSectionTitle)
      && columns.every((column) => !column.text.includes(":") && column.text.split(/\s+/).length <= 6);
  });

  if (skillsIndex === -1) return writePageColumns(rows);

  const columns = rows[skillsIndex + 1].runs;
  const nextSection = rows.findIndex((row, index) => index > skillsIndex + 1
    && row.runs.length === 1 && readResumeHeading(row.runs[0].text));
  const end = nextSection === -1 ? rows.length : nextSection;
  const tableRows = rows.slice(skillsIndex + 2, end);
  const skills: string[] = [writeRows([rows[skillsIndex]])];
  const tools: string[] = [];

  for (const [index, column] of columns.entries()) {
    const from = index === 0 ? -Infinity : column.left - 8;
    const to = columns[index + 1] ? columns[index + 1].left - 8 : Infinity;
    const cells = tableRows.map((row) => ({ ...row, runs: row.runs.filter((run) => run.left >= from && run.left < to) }))
      .filter((row) => row.runs.length > 0);
    const section = readResumeHeading(column.text)?.title === toolsSectionTitle ? tools : skills;
    if (cells.length) section.push(`${column.text}\n${writeRows(cells)}`);
  }

  return [writePageColumns(rows.slice(0, skillsIndex)), ...skills, ...tools, writePageRows(rows.slice(end))]
    .filter(Boolean).join("\n\n");
}

export function pdfPreviewText(items: TextItem[]) {
  const rows: TextRow[] = [];
  const sorted = items.filter((item) => item.str.trim()).sort((a, b) => b.transform[5] - a.transform[5]);
  for (const item of sorted) {
    const [, , , , left, y] = item.transform;
    const run = { text: item.str, left, right: left + item.width, y };
    const row = rows.at(-1);
    if (row && row.y - y <= Math.min(3, Math.max(1, item.height / 4))) {
      row.runs.push(run);
      row.height = Math.max(row.height, item.height);
    } else {
      rows.push({ y, height: item.height, runs: [run] });
    }
  }

  for (const row of rows) {
    const merged: TextRun[] = [];
    for (const run of row.runs.sort((a, b) => a.left - b.left)) {
      const previous = merged.at(-1);
      const gap = previous ? run.left - previous.right : 0;
      if (previous && gap < Math.max(14, row.height * 1.3)) {
        previous.text += (gap > 1 && !/\s$/.test(previous.text) && !/^\s/.test(run.text) ? " " : "") + run.text;
        previous.right = Math.max(previous.right, run.right);
      } else {
        merged.push({ ...run, y: row.y });
      }
    }
    row.runs = merged.map((run) => ({ ...run, text: run.text.trim() }));
  }

  return writePageRows(rows);
}

function writePageColumns(rows: TextRow[]) {
  const split = findColumnSplit(rows);
  if (split === undefined) return writeRows(rows);

  const firstHeading = rows.findIndex((row) => row.runs.some((run) => readResumeHeading(run.text)));
  const header = Math.max(0, firstHeading);
  const bands = [writeRows(rows.slice(0, header))];
  const rightColumnEnd = rows.reduce((end, row) => row.runs.some((run) => run.left >= split) ? row.y : end, -Infinity);
  let left: TextRow[] = [];
  let right: TextRow[] = [];
  function flushColumns() {
    bands.push(writeRows(left), writeRows(right));
    left = [];
    right = [];
  }

  for (const row of rows.slice(header)) {
    // A long line can extend past the gutter once the right column has ended.
    if (row.y >= rightColumnEnd && row.runs.some((run) => run.left < split && run.right > split)) {
      flushColumns();
      bands.push(writeRows([row]));
      continue;
    }
    const leftRuns = row.runs.filter((run) => run.left < split);
    const rightRuns = row.runs.filter((run) => run.left >= split);
    if (leftRuns.length) left.push({ ...row, runs: leftRuns });
    if (rightRuns.length) right.push({ ...row, runs: rightRuns });
  }
  flushColumns();
  return bands.filter(Boolean).join("\n\n");
}
