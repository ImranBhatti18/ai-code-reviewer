# Autonomous AI Code & Security Reviewer

An event-driven GitHub Pull Request security auditor built with **Next.js**, **GitHub Webhooks**, and **Google Gemini**. Every time a Pull Request is opened, the agent automatically inspects the code diff for security vulnerabilities (RCE, SQL Injection, hardcoded secrets) and posts a structured review with exact remediation directly on the PR.

**Live Deployment:** [ai-code-reviewer-inky-chi.vercel.app](https://ai-code-reviewer-inky-chi.vercel.app)

---

## Architecture & Workflow

```text
GitHub PR Opened
      │
      ▼ (POST /api/webhook + HMAC-SHA256 Signature)
Next.js API Route (Vercel)
      │
      ├──► Verifies webhook signature
      ├──► Fetches live PR diff via Octokit
      ├──► Sends diff to Google Gemini (gemini-3.5-flash-lite)
      │
      ▼
Posts Structured Security Review Comment on GitHub PR