# frc-mcp-server

A customizable [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **FIRST Robotics Competition (FRC)** teams. It indexes your team's robot code, WPILib documentation, and vendor library references, then exposes them as MCP tools so AI assistants can search, navigate, and reason about your FRC codebase.

## Features

- **`list_frc_sources`**: Browse all indexed files grouped by directory
  - **`search_frc_context`**: Search across robot code and docs for classes, methods, constants, and concepts
  - **`get_frc_file`**: Read specific files (full or partial by line range)
- Deploy to **Vercel** in one click or run locally
- Customizable: add your own robot code, WPILib snippets, and vendor docs

## Prerequisites

- [Node.js](https://nodejs.org/) **≥ 20**
- npm (comes with Node.js)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Project516/frc-mcp-server.git
cd frc-mcp-server
npm install
```

### 2. Add your FRC context

Place your robot code and documentation under `src/data/`. A typical layout:

```text
src/data/
  robot/           # your team's robot code
    src/main/java/frc/robot/...
    build.gradle
  wpilib/           # WPILib docs and API notes
    docs/
    api-notes/
  vendors/          # vendor library references (REV, CTRE, PathPlanner, etc.)
    rev/
    ctre/
```

> **Tip:** Exclude heavy folders like `.gradle`, `build`, `bin`, and `out`. See [docs/FRC_CONTEXT.md](docs/FRC_CONTEXT.md) for detailed guidance on organizing context data.

### 3. Build and run

```bash
npm run build
npm start
```

The server listens for MCP requests via the Streamable HTTP transport at `/mcp`.

### 4. Connect from an MCP client

Configure your AI client (e.g., Claude Desktop, Cursor, VS Code extension) to connect to the running server. For example, a local setup might point to:

```
http://localhost:3000/mcp
```

Refer to your client's documentation for MCP server configuration details.

## MCP Tools Reference

### `list_frc_sources`

List all indexed files grouped by directory. Use this to discover available FRC documentation and team robot code context.

**Parameters:** none

**Example output:**

```text
# Available FRC Context Sources
## frc-docs/ (12 files) - Official FRC/WPILib Documentation
  frc-docs/commands.md
  frc-docs/swerve.md
  ...
## robot/ (8 files) - Team Robot Code
  robot/src/main/java/frc/robot/Constants.java
  robot/src/main/java/frc/robot/RobotContainer.java
  ...
```

---

### `search_frc_context`

Search across FRC documentation and team robot code for classes, methods, constants, and concepts. Returns relevant code snippets with context.

**Parameters:**

| Parameter   | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `query`     | string | Yes      | Text to search for (e.g. `PIDController`, `swerve`, `AutoBuilder`). Case-insensitive. Minimum 2 characters. |
| `sourcePath`| string | No       | Limit search to a specific file or directory prefix (e.g. `robot/src/main/java/frc/robot/` or `frc-docs/`). |
| `limit`     | number | No       | Max snippets to return. Default: 8. Range: 1–25. |

---

### `get_frc_file`

Read complete or partial content of a specific indexed file. Use for examining exact code, documentation, or configuration details.

**Parameters:**

| Parameter    | Type   | Required | Description |
|--------------|--------|----------|-------------|
| `sourcePath` | string | Yes      | Relative path from `list_frc_sources` (e.g. `robot/src/main/java/frc/robot/Constants.java`). |
| `startLine`  | number | No       | 1-based start line. |
| `endLine`    | number | No       | 1-based end line (inclusive). |

> **Security:** Path traversal is blocked: only files under `src/data/` are accessible.

## Deploying to Vercel

This project includes a `vercel.json` configuration for easy deployment:

1. Push your fork to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Vercel will detect the Node.js build automatically
4. Your MCP endpoint will be available at `https://<your-deployment>.vercel.app/mcp`

A landing page is served at the root URL from `public/index.html`.

## Available Scripts

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `npm run build`      | Compile TypeScript to `dist/`                   |
| `npm run typecheck`  | Run type checking without emitting files        |
| `npm start`          | Start the server from compiled output           |

## Automated Robot Code Sync

An example GitHub Actions workflow is provided at `.github/workflows/sync-robot-code.yml.example` that can automatically pull your team's robot code into `src/data/robot/` on a weekly schedule. Copy it, update the robot repo URL, and enable it to keep context fresh each season.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and add tests if applicable
4. Run `npm run typecheck` and `npm run build` to verify
5. Commit and push: `git commit -m "Add my feature"`
6. Open a pull request against the `master` branch

Please keep PRs focused: one improvement per PR makes review easier.

## License

This project is licensed under the [GNU General Public License v3.0 or later](LICENSE).
