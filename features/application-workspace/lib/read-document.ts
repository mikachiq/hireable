import { pdfPreviewText } from "./pdf-preview-text";

type ResumeDocument = { text: string; previewText?: string };

export async function readDocument(file: File): Promise<ResumeDocument> {
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose a file smaller than 15 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "txt") return { text: await file.text() };
  if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    return { text: (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value };
  }
  if (extension === "pdf") {
    const pdf = await import("pdfjs-dist");
    pdf.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const task = pdf.getDocument({ data: await file.arrayBuffer() });
    const document = await task.promise;
    try {
      const pages: string[] = [];
      const previewPages: string[] = [];
      for (let index = 1; index <= document.numPages; index++) {
        const page = await document.getPage(index);
        const content = await page.getTextContent();
        const items = content.items.filter((item) => "str" in item);
        pages.push(items.map((item) => item.str).join(" "));
        previewPages.push(pdfPreviewText(items));
      }
      return { text: pages.join("\n\n"), previewText: previewPages.join("\n\n") };
    } finally { await task.destroy(); }
  }
  throw new Error("Upload a PDF, DOCX, or TXT file.");
}

export async function readScreenshot(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try { return (await worker.recognize(file)).data.text; }
  finally { await worker.terminate(); }
}
