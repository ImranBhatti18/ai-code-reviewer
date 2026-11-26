import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header / Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Webhook Listener Active
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Autonomous AI Code Reviewer
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-400">
              Event-driven GitHub Pull Request security auditor powered by{" "}
              <span className="text-slate-200 font-medium">Google Gemini</span>{" "}
              and{" "}
              <span className="text-slate-200 font-medium">Next.js</span>.
              Automatically detects RCE, SQL Injection, and hardcoded secrets on
              every PR.
            </p>
          </div>
          <a
            href="https://github.com/ImranBhatti18/ai-code-reviewer"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            View on GitHub →
          </a>
        </div>

        {/* Architecture Flow */}
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            How It Works
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-xs font-mono text-emerald-400">01 / TRIGGER</div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                GitHub PR Webhook
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Listens to <code className="text-slate-200">pull_request</code>{" "}
                events with HMAC-SHA256 signature verification at{" "}
                <code className="text-slate-200">/api/webhook</code>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-xs font-mono text-emerald-400">02 / ANALYZE</div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Gemini Security Audit
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Fetches the live PR diff via Octokit and runs an automated
                vulnerability scan for OWASP Top 10 flaws and logic bugs.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-xs font-mono text-emerald-400">03 / REPORT</div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Automated PR Comment
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Posts a structured review with severity ratings and copy-paste
                remediation directly onto the Pull Request thread.
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack & Endpoint Info */}
        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-base font-semibold text-white">
              Vulnerability Coverage
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Remote Code Execution (RCE) &amp; unsafe <code className="text-slate-200">eval()</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> SQL Injection &amp; unsanitized queries
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Hardcoded API keys, tokens &amp; secrets
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Auth bypasses &amp; insecure configurations
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-base font-semibold text-white">
              System Configuration
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Webhook Endpoint</span>
                <code className="font-mono text-emerald-400">/api/webhook</code>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">AI Engine</span>
                <span className="font-mono text-slate-200">Gemini 3.5 Flash Lite</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Runtime</span>
                <span className="font-mono text-slate-200">Next.js on Vercel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signature Check</span>
                <span className="font-mono text-slate-200">HMAC-SHA256</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          Built by Muhammad Imran Akram · Autonomous AI Security Engineering
        </footer>
      </div>
    </main>
  );
}