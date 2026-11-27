import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Octokit } from "@octokit/rest";
import { GoogleGenAI } from "@google/genai";

// Initialize GitHub aur Gemini clients
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Browser par test karne ke liye simple GET route
export async function GET() {
  return NextResponse.json({
    status: "Active",
    message: "Autonomous AI Code Reviewer Webhook is running!",
  });
}

// 2. GitHub Webhook signature verify karne ka function (Security)
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

async function scanDependencies(
  octokit: Octokit,
  owner: string,
  repo: string,
  commitSha: string
): Promise<{ report: string; hasVulnerabilities: boolean }> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
      ref: commitSha,
    });

    if (Array.isArray(data) || !("content" in data)) {
      return { report: "", hasVulnerabilities: false };
    }

    const pkgJson = JSON.parse(
      Buffer.from(data.content, "base64").toString("utf-8")
    );

    const allDeps: Record<string, string> = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    };

    const depEntries = Object.entries(allDeps);
    if (depEntries.length === 0) {
      return { report: "", hasVulnerabilities: false };
    }

    const queries = depEntries.map(([name, rawVersion]) => ({
      package: { name, ecosystem: "npm" },
      version: rawVersion.replace(/^[\^~>=<]+/, ""),
    }));

    const osvRes = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });

    if (!osvRes.ok) {
      return { report: "", hasVulnerabilities: false };
    }

    const osvData = (await osvRes.json()) as {
      results?: Array<{ vulns?: Array<{ id: string }> }>;
    };

    const findings: string[] = [];
    osvData.results?.forEach((res, idx) => {
      if (res.vulns && res.vulns.length > 0) {
        const [pkgName, pkgVer] = depEntries[idx];
        const ids = res.vulns.slice(0, 3).map((v) => `\`${v.id}\``).join(", ");
        findings.push(`- **${pkgName}@${pkgVer}** — Known CVEs: ${ids}`);
      }
    });

    if (findings.length === 0) {
      return {
        report:
          "\n\n---\n### 📦 Dependency Vulnerability Scan (OSV.dev)\n✅ No known CVEs found in `package.json` dependencies.",
        hasVulnerabilities: false,
      };
    }

    return {
      report: `\n\n---\n### 📦 Dependency Vulnerability Scan (OSV.dev)\n🚨 **${findings.length} vulnerable package(s) detected:**\n${findings.join("\n")}`,
      hasVulnerabilities: true,
    };
  } catch {
    return { report: "", hasVulnerabilities: false };
  }
}

// 3. Main Webhook Handler (Jab GitHub par PR open ya update ho)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");

    // Security check
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Sirf Pull Request events par kaam karein
    if (event !== "pull_request") {
      return NextResponse.json({ message: "Ignored non-PR event" }, { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    const action = payload.action;

    // Jab naya PR khule ya naya commit push ho
    if (action !== "opened" && action !== "synchronize") {
      return NextResponse.json({ message: `Ignored action: ${action}` }, { status: 200 });
    }

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const pull_number = payload.pull_request.number;

    // GitHub se PR ki changed files aur code diff fetch karein
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    const codeDiff = files
      .filter((file) => file.patch)
      .map((file) => `### File: ${file.filename}\n\`\`\`diff\n${file.patch}\n\`\`\``)
      .join("\n\n");

    if (!codeDiff) {
      return NextResponse.json({ message: "No code changes to review" }, { status: 200 });
    }

    // Gemini AI ko review ke liye bhejein
    const prompt = `
You are a Senior Software Engineer and Application Security Expert.
Review the following GitHub Pull Request code diff.

Focus strictly on:
1. **Security Vulnerabilities** (e.g., SQL Injection, XSS, hardcoded secrets/API keys, insecure auth).
2. **Critical Bugs & Edge Cases** (logic errors, null/undefined crashes, memory leaks).
3. **Performance & Clean Code** (inefficient loops, bad practices).

Format your response in clean Markdown with emojis:
- Start with a brief **Summary & Risk Level** (Low / Medium / High).
- List specific issues with the filename and exact **Suggested Fix** in code blocks.
- If the code looks solid, praise the clean implementation briefly.

Here is the PR Diff:
${codeDiff}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const reviewComment =
      response.text || "AI review could not be generated at this time.";

  // 1. PR ke latest commit ka SHA nikalna
    const commitSha = payload.pull_request.head.sha;

    // 2. Dependency CVE Scan chalana (OSV.dev)
    const depScan = await scanDependencies(octokit, owner, repo, commitSha);

    // 3. GitHub PR par AI Review + Dependency Scan comment post karna
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: `## 🤖 Autonomous AI Code & Security Review\n\n${reviewComment}${depScan.report}`,
    });

    // 4. Check karna ke AI review ya Dependencies mein koi critical/high issue hai ya nahi
    const isHighRisk =
      depScan.hasVulnerabilities ||
      /\b(CRITICAL|DO NOT MERGE)\b/i.test(reviewComment) ||
      /risk level.*high/i.test(reviewComment);

// 3. GitHub par Pass (green tick) ya Fail (red cross) Status Check bhejna
await octokit.repos.createCommitStatus({
  owner,
  repo,
  sha: commitSha,
  state: isHighRisk ? "failure" : "success",
  context: "AI Security Audit",
  description: isHighRisk
    ? "CRITICAL/HIGH vulnerability detected. Fix before merging."
    : "No critical security vulnerabilities found.",
});

    return NextResponse.json({ message: "Review posted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}