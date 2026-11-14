export function generateEmail(company: string, role: string, resume: string) {
  const firstLine = resume.split("\n").find((line) => line.trim().length > 20)?.trim() ?? "my relevant experience";
  return {
    subject: `Application — ${role || "Open role"}`,
    body: `Hello Hiring Team,\n\nI’m writing to apply for the ${role || "open"} role at ${company || "your company"}. My background includes ${firstLine.toLowerCase()}, and I’m excited by the opportunity to contribute to your team.\n\nI’ve attached my tailored resume for your review. I would welcome the chance to discuss how my experience could support the role.\n\nThank you for your time and consideration,\n[Your name]`
  };
}
