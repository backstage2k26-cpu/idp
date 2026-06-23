# [Backstage](https://backstage.io)

This is your newly scaffolded Backstage App, Good Luck!

To start the app, run:

```sh
yarn install
yarn start
```₹₹₹₹
@@@@.

export GITHUB_TOKEN=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

export NODE_OPTIONS=--no-node-snapshot

export SONAR_TOKEN=e0052ac925921d8055e8436bfb55085033e5a22a

export JENKINS_TOKEN=bce7185880087a9f58e8a73faf4ac16f0fab0db9

# Jenkins Credentials Requirements

To enable Jenkins CI/CD pipelines for GitHub, Docker Hub, and SonarCloud integrations, please create the following credentials in Jenkins.

## Jenkins Location

Navigate to:

```text
Manage Jenkins
→ Credentials
→ System
→ Global Credentials (unrestricted)
```

---

## 1. Docker Hub Credentials

**Credential Type:** Username with password

| Field | Value |
|---------|---------|
| ID | dockerhub-creds |
| Username | backstage2026 |
| Password | dckr_pat_valItxANbLSJ33bGZFMhH9tkrQY |
| Description | Docker Hub Credentials |

### Information Required

Please provide:

```text
Docker Hub Username:
Docker Hub Access Token:
```

Generate Access Token:

```text
Docker Hub
→ Account Settings
→ Personal Access Tokens
→ Generate New Token
```

---

## 2. GitHub Credentials

**Credential Type:** Username with password

| Field | Value |
|---------|---------|
| ID | github-creds |
| Username | your GitHub username |
| Password | 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 |
| Description | GitHub Credentials |

### Information Required

Please provide:

```text
GitHub Username:
GitHub Personal Access Token:
```

Generate Token:

```text
GitHub
→ Settings
→ Developer Settings
→ Personal Access Tokens
→ Fine-grained Token
```

### Required Permissions

```text
Repository Access
Webhook Management
Workflow Access
Read Organization Information
```

---

## 3. SonarCloud Token

**Credential Type:** Secret Text

| Field | Value |
|---------|---------|
| ID | SONAR_TOKEN |
| Secret | e0052ac925921d8055e8436bfb55085033e5a22a |
| Description | SonarCloud Token |

### Information Required

Please provide:

```text
SonarCloud Token:
```

Generate Token:

```text
SonarCloud
→ My Account
→ Security
→ Generate Token
```

---

## Purpose of These Credentials

These credentials are required for:

- Cloning GitHub repositories
- Creating and managing GitHub webhooks
- Building Docker images
- Pushing Docker images to Docker Hub
- Running SonarCloud code analysis
- Executing Jenkins CI/CD pipelines

---

## Required Credential IDs

The following IDs must match exactly:

```text
dockerhub-creds
github-creds
SONAR_TOKEN
```

Any change to these IDs will require updates in Jenkinsfiles and pipeline configurations.
