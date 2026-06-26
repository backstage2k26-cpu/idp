# Backstage Local Setup

This is your newly scaffolded Backstage application.

For access control (RBAC) setup and day-to-day changes, see [Platform Portal Permissions](docs/platform-portal-permissions.md).

## Prerequisites

Install the following:

- Node.js 20.x
- Yarn 4.x
- Git
- Docker (optional)
- Jenkins access
- SonarCloud access
- GitHub access

Verify versions:

```bash
node -v
# Expected: v20.x.x

yarn -v
```

---

## Node.js 20 Installation

### Using nvm (Recommended)

Install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Reload terminal:

```bash
source ~/.zshrc
```

Install Node 20:

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

Verify:

```bash
node -v
```

Expected output:

```text
v20.x.x
```

---

## Environment Variables

Configure the following variables before starting Backstage:

```bash
export GITHUB_TOKEN=<YOUR_GITHUB_PAT>

export SONAR_TOKEN=<YOUR_SONARCLOUD_TOKEN>

export JENKINS_TOKEN=<YOUR_JENKINS_API_TOKEN>

export NODE_OPTIONS=--no-node-snapshot
```

---

## Installation

Install dependencies:

```bash
yarn install
```

---

## Start Backstage

```bash
yarn start
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:7007
```

---

# Jenkins Credentials Requirements

## Jenkins Location

```text
Manage Jenkins
→ Credentials
→ System
→ Global Credentials (unrestricted)
```

## Required Credentials

### Docker Hub Credentials

Type: Username with password

| Field | Value |
|---------|---------|
| ID | dockerhub-creds |
| Username | <DOCKER_HUB_USERNAME> |
| Password | <DOCKER_HUB_ACCESS_TOKEN> |

### GitHub Credentials

Type: Username with password

| Field | Value |
|---------|---------|
| ID | github-creds |
| Username | <GITHUB_USERNAME> |
| Password | <GITHUB_PAT> |

### SonarCloud Token

Type: Secret text

| Field | Value |
|---------|---------|
| ID | SONAR_TOKEN |
| Secret | <SONARCLOUD_TOKEN> |

## Required Credential IDs

```text
dockerhub-creds
github-creds
SONAR_TOKEN
```

These credentials are used for:

- GitHub repository operations
- Jenkins pipeline execution
- Docker image builds and pushes
- SonarCloud code analysis
- CI/CD automation