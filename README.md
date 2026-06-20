# frc-mcp-server

A customizable [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for FRC (First Robotics Competition) teams. It gives AI coding assistants — like GitHub Copilot, Claude, or Cursor — direct access to your team's robot code, WPILib documentation, and vendor library context so they can answer questions and generate code that matches your project.

## How it works

The server indexes files placed in `src/data/` and exposes three MCP tools that AI agents can call:

- **`list_frc_sources`** — List all indexed files grouped by directory. Use this to discover available context.
- **`search_frc_context`** — Full-text search across all robot code and docs. Returns ranked snippets with surrounding context.
- **`get_frc_file`** — Read a complete file or a specific line range. Perfect for examining exact code or configuration details.

Any MCP-compatible client can connect to the server and use these tools to look up constants, subsystem logic, autonomous routines, WPILib APIs, and vendor library patterns.

## Connect from VS Code (GitHub Copilot)

VS Code supports MCP servers natively through Copilot's agent mode (v1.99+).

1. Create or open `.vscode/mcp.json` in your project root.
2. Add the server entry:

```json
{
  "servers": {
    "frc-mcp-server": {
      "type": "http",
      "url": "https://frc-mcp-server.vercel.app/mcp"
    }
  }
}
```

3. Open Copilot Chat (<kbd>Ctrl+Alt+I</kbd>), switch to **Agent** mode, and start asking questions. The agent will call the MCP tools automatically when relevant.

## Connect from other MCP clients

The server exposes a Streamable HTTP endpoint. Any MCP client that supports HTTP transport can connect to:

```
https://frc-mcp-server.vercel.app/mcp
```

For local development, you can also run the server on `http://localhost:3000/mcp` (see below).

## Add your team's context

Place files in `src/data/` following this recommended structure:

```text
src/data/
  robot/           # your team's robot source code
    src/main/java/frc/robot/...
    build.gradle
  frc-docs/        # WPILib / FRC documentation excerpts
  vendors/         # vendor library notes (REV, CTRE, PathPlanner, etc.)
```

Keep files in plain text, Markdown, or source code formats. Prefer smaller, high-signal documents over giant copies of entire websites. See [docs/FRC_CONTEXT.md](docs/FRC_CONTEXT.md) for detailed guidance on organizing context.

> **⚠️ Security:** Everything in `src/data/` is potentially visible to any user who can access your MCP server. Do not include secrets, tokens, private keys, or unpublished scouting data.

## Local development

Prerequisites: [Node.js](https://nodejs.org/) ≥ 20

```bash
# Install dependencies
npm ci

# Type check
npm run typecheck

# Build
npm run build

# Start the server
npm start
```

The server runs on port 3000 by default (or the `PORT` environment variable).

## Deployment

This project is designed to deploy on [Vercel](https://vercel.com/). Push to the `master` branch and Vercel will build and deploy automatically. The MCP endpoint is available at `/mcp`.

You can also use the included GitHub Actions workflow example to automatically sync your team's robot code into `src/data/robot` on a schedule — see [.github/workflows/sync-robot-code.yml.example](.github/workflows/sync-robot-code.yml.example).

## Project structure

```text
├── src/
│   ├── index.ts          # MCP server implementation (tools + HTTP handler)
│   └── data/             # FRC context files (robot code, docs, vendor notes)
│       └── README.md
├── docs/
│   └── FRC_CONTEXT.md    # Guide for organizing and maintaining context data
├── public/
│   └── index.html         # Landing page for the deployed server
├── .github/
│   ├── workflows/ci.yml  # CI: type-check + build on Node 20 & 22
│   └── dependabot.yml    # Automated dependency updates
├── package.json
├── tsconfig.json
└── vercel.json            # Vercel deployment config
```

## License

[GPL-3.0-or-later](LICENSE)
