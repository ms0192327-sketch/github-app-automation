# GitHub App Automation with PR Review

An AI-powered GitHub App that automates:
- Issue summarization and commenting
- PR review automation
- Code quality analysis
- Security issue detection
- Best practice suggestions

## Features

- **Issue Automation**
  - Summarize issues automatically
  - Generate helpful maintainer comments
  - Classify issue urgency and type

- **PR Review Automation**
  - Review code changes
  - Identify bugs and security issues
  - Suggest improvements
  - Re-review on new commits

- **Webhook Listener**
  - Secure signature validation
  - Real-time event processing
  - GitHub App installation token auth

- **Logging & Stats**
  - SQLite database
  - PR review tracking
  - Success rate monitoring

## Prerequisites

- Node.js 18+
- GitHub App created in GitHub settings
- Private key downloaded from GitHub
- OpenAI API key
- Public domain with HTTPS (for webhooks)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create keys directory

```bash
mkdir -p keys
```

### 3. Place private key

Put your GitHub App private key at:
```bash
keys/github-private-key.pem
```

### 4. Create env file

```bash
cp .env.example .env
```

### 5. Fill in values

```env
APP_ID=123456
WEBHOOK_SECRET=your_webhook_secret_here
PRIVATE_KEY_PATH=./keys/github-private-key.pem
OPENAI_API_KEY=your_openai_api_key_here
MODEL_NAME=gpt-4o-mini
PORT=3000
```

### 6. Run the app

```bash
npm start
```

Or in dev mode:
```bash
npm run dev
```

## GitHub App Configuration

### In GitHub Settings:

1. Go to Settings → Developer settings → GitHub Apps
2. Create a new GitHub App
3. Set **Webhook URL** to:
   ```
   https://your-domain.com/webhook
   ```
4. Set **Webhook secret** to the same value as `WEBHOOK_SECRET` in `.env`

### Permissions Needed:

- **Issues**: Read & Write
- **Pull Requests**: Read & Write
- **Pull Request Reviews**: Read & Write
- **Contents**: Read-only
- **Metadata**: Read-only

### Subscribe to Events:

- Issues
- Pull Requests

5. Generate a private key and download it
6. Copy your App ID
7. Install the app on target repository

## Endpoints

### GET `/`
Health check and available routes

### POST `/webhook`
GitHub webhook listener (signature validated)

### GET `/logs?limit=10`
Recent automation logs

### GET `/pr-reviews?limit=10`
Recent PR reviews

### GET `/stats`
Performance statistics

## Example Usage

Check stats:
```bash
curl http://localhost:3000/stats
```

Get recent logs:
```bash
curl http://localhost:3000/logs?limit=5
```

Get recent PR reviews:
```bash
curl http://localhost:3000/pr-reviews?limit=5
```

## How It Works

### Issue Flow
1. User opens a GitHub issue
2. GitHub sends `issues.opened` webhook
3. Server validates webhook signature
4. AI summarizes issue
5. AI generates helpful comment
6. App posts comment using installation token
7. Action is logged to SQLite

### PR Review Flow
1. User opens a PR
2. GitHub sends `pull_request.opened` webhook
3. App fetches PR files and metadata
4. AI reviews code changes
5. App posts review comment
6. On new commits: `pull_request.synchronize` triggers new review
7. All reviews are logged

## Next Enhancements

- [ ] Auto-label issues based on classification
- [ ] Request changes on critical issues
- [ ] Approve PRs based on review quality
- [ ] Schedule periodic repo scans
- [ ] Multi-repo support with dashboard
- [ ] Slack/Discord notifications
- [ ] Custom review prompts per repo
- [ ] Performance metrics tracking
- [ ] Batch PR review for multiple changes
- [ ] Dismissible/customizable reviews

## Troubleshooting

**"Invalid signature" error**
- Verify `WEBHOOK_SECRET` matches GitHub settings
- Check webhook payload is not modified

**"No installation found" error**
- Verify GitHub App is installed on the repo
- Check App ID is correct in `.env`

**"Unauthorized" error**
- Verify private key path is correct
- Check private key permissions (should be readable)

## Notes

- All reviews are non-blocking (COMMENT event)
- For production, consider adding:
  - Queue system for high-volume repos
  - Per-repo configuration
  - Dashboard UI
  - Advanced filtering
  - Custom prompts per organization

## License

MIT
