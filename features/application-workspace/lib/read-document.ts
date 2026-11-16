export async function readDocument(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose a file smaller than 15 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "txt") return file.text();
  if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  }
  if (extension === "pdf") {
    const pdf = await import("pdfjs-dist");
    pdf.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const task = pdf.getDocument({ data: await file.arrayBuffer() });
    const document = await task.promise;
    try {
      const pages: string[] = [];
      for (let index = 1; index <= document.numPages; index++) {
        const page = await document.getPage(index);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
      }
      return pages.join("\n\n");
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
