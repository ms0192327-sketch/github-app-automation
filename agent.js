const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ISSUE_SYSTEM_PROMPT = `
You are an AI assistant for a GitHub App automation bot.

Your job:
- summarize GitHub issue texts
- create helpful issue comments
- classify issue urgency
- recommend likely fix direction
- help maintainers triage issues fast

Keep responses concise, clear, and actionable.
`;

const PR_REVIEW_SYSTEM_PROMPT = `
You are an expert code reviewer and AI assistant for a GitHub App automation bot.

Your job:
- review code changes in pull requests
- identify potential bugs, security issues, and performance problems
- suggest improvements to code quality, readability, and style
- provide constructive, helpful feedback
- classify issues by severity: critical, warning, info, suggestion

When reviewing:
1. Look for logic errors and potential bugs
2. Check for security vulnerabilities
3. Verify performance implications
4. Check code style consistency
5. Suggest best practices

Format your response as JSON with an array of findings:
{
  "findings": [
    {
      "severity": "critical|warning|info|suggestion",
      "file": "file.js",
      "line": 42,
      "comment": "Your comment here"
    }
  ],
  "summary": "Overall code quality assessment"
}
`;

async function summarizeIssue(title, body) {
  const response = await openai.chat.completions.create({
    model: process.env.MODEL_NAME || "gpt-4o-mini",
    messages: [
      { role: "system", content: ISSUE_SYSTEM_PROMPT },
      { role: "user", content: `Summarize this GitHub issue.\nTitle: ${title}\nBody: ${body || "No body provided"}` }
    ],
    temperature: 0.3
  });

  return response.choices[0].message.content;
}

async function generateComment(title, body) {
  const response = await openai.chat.completions.create({
    model: process.env.MODEL_NAME || "gpt-4o-mini",
    messages: [
      { role: "system", content: ISSUE_SYSTEM_PROMPT },
      { role: "user", content: `Draft a helpful maintainer comment for this issue.\nTitle: ${title}\nBody: ${body || "No body provided"}` }
    ],
    temperature: 0.5
  });

  return response.choices[0].message.content;
}

async function reviewCode(filePath, diff) {
  const response = await openai.chat.completions.create({
    model: process.env.MODEL_NAME || "gpt-4o-mini",
    messages: [
      { role: "system", content: PR_REVIEW_SYSTEM_PROMPT },
      { role: "user", content: `Review this code change.\nFile: ${filePath}\n\nDiff:\n${diff}` }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content;
}

async function classifyIssue(title, body) {
  const response = await openai.chat.completions.create({
    model: process.env.MODEL_NAME || "gpt-4o-mini",
    messages: [
      { role: "system", content: ISSUE_SYSTEM_PROMPT },
      { role: "user", content: `Classify this issue as JSON with fields: type, priority, suggested_label.\nTitle: ${title}\nBody: ${body || "No body provided"}` }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content;
}

async function generatePrReview(title, description, files) {
  const filesContext = files.map(f => `- ${f.filename}: ${f.additions} additions, ${f.deletions} deletions`).join('\n');

  const response = await openai.chat.completions.create({
    model: process.env.MODEL_NAME || "gpt-4o-mini",
    messages: [
      { role: "system", content: PR_REVIEW_SYSTEM_PROMPT },
      { role: "user", content: `Review this PR.\nTitle: ${title}\nDescription: ${description || "No description"}\n\nFiles changed:\n${filesContext}` }
    ],
    temperature: 0.3
  });

  return response.choices[0].message.content;
}

module.exports = {
  summarizeIssue,
  generateComment,
  reviewCode,
  classifyIssue,
  generatePrReview
};