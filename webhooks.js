const { summarizeIssue, generateComment, classifyIssue, generatePrReview, reviewCode } = require("./agent");
const { createIssueComment, createPrReview, getPrFiles, getPr } = require("./githubApp");
const { saveLog, savePrReview } = require("./db");

async function handleWebhookEvent(eventName, payload) {
  if (!payload || !payload.repository) {
    return;
  }

  const repoName = payload.repository.name;
  const owner = payload.repository.owner.login;
  const repoFullName = `${owner}/${repoName}`;

  // Handle issue opened event
  if (eventName === "issues" && payload.action === "opened" && payload.issue && !payload.issue.pull_request) {
    await handleIssueOpened(payload, repoFullName, owner, repoName);
  }

  // Handle PR opened event
  if (eventName === "pull_request" && payload.action === "opened") {
    await handlePrOpened(payload, repoFullName, owner, repoName);
  }

  // Handle PR synchronize (new commits pushed)
  if (eventName === "pull_request" && payload.action === "synchronize") {
    await handlePrSynchronized(payload, repoFullName, owner, repoName);
  }
}

async function handleIssueOpened(payload, repoFullName, owner, repoName) {
  const issue = payload.issue;

  try {
    const summary = await summarizeIssue(issue.title, issue.body || "");
    const comment = await generateComment(issue.title, issue.body || "");
    const classification = await classifyIssue(issue.title, issue.body || "");

    console.log("Issue summary:", summary);
    console.log("Issue classification:", classification);

    await createIssueComment(owner, repoName, issue.number, comment);
    console.log("AI comment posted to issue #" + issue.number);

    saveLog(
      "issues",
      repoFullName,
      issue.number,
      null,
      `Issue: ${issue.title}`,
      `Summary: ${summary}\n\nClassification: ${classification}`,
      "issue_comment",
      1
    );
  } catch (error) {
    console.error("Error handling issue:", error.message);
    saveLog(
      "issues",
      repoFullName,
      issue.number,
      null,
      `Issue: ${issue.title}`,
      `Error: ${error.message}`,
      "issue_comment",
      0
    );
  }
}

async function handlePrOpened(payload, repoFullName, owner, repoName) {
  const pr = payload.pull_request;

  try {
    console.log("New PR opened:", pr.title);

    const prDetails = await getPr(owner, repoName, pr.number);
    const files = await getPrFiles(owner, repoName, pr.number);

    const review = await generatePrReview(pr.title, pr.body || "", files);
    console.log("PR review summary:", review);

    const reviewComment = `## Automated Code Review\n\n${review}`;
    await createIssueComment(owner, repoName, pr.number, reviewComment);
    console.log("AI PR review posted to PR #" + pr.number);

    saveLog(
      "pull_request",
      repoFullName,
      null,
      pr.number,
      `PR: ${pr.title}`,
      `Review: ${review}`,
      "pr_review",
      1
    );
  } catch (error) {
    console.error("Error handling PR:", error.message);
    saveLog(
      "pull_request",
      repoFullName,
      null,
      pr.number,
      `PR: ${pr.title}`,
      `Error: ${error.message}`,
      "pr_review",
      0
    );
  }
}

async function handlePrSynchronized(payload, repoFullName, owner, repoName) {
  const pr = payload.pull_request;

  try {
    console.log("PR updated with new commits:", pr.title);

    const files = await getPrFiles(owner, repoName, pr.number);

    // Review only changed files with new commits
    const changedFiles = files.filter(f => f.patch);

    if (changedFiles.length > 0) {
      const firstFile = changedFiles[0];
      const review = await reviewCode(firstFile.filename, firstFile.patch);

      console.log("Code review for updated PR:", review);

      const reviewComment = `## Updated Code Review (New Commits)\n\n${review}`;
      await createIssueComment(owner, repoName, pr.number, reviewComment);

      saveLog(
        "pull_request",
        repoFullName,
        null,
        pr.number,
        `PR Updated: ${pr.title}`,
        `Updated Review: ${review}`,
        "pr_review_updated",
        1
      );
    }
  } catch (error) {
    console.error("Error handling PR sync:", error.message);
    saveLog(
      "pull_request",
      repoFullName,
      null,
      pr.number,
      `PR Updated: ${pr.title}`,
      `Error: ${error.message}`,
      "pr_review_updated",
      0
    );
  }
}

module.exports = {
  handleWebhookEvent
};