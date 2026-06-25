# frc-mcp-server

A customizable [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for FIRST Robotics Competition (FRC) teams. It exposes your team's robot code, WPILib documentation, and vendor library references as searchable context to AI agents, making it easy to ask questions, debug, and generate code that's grounded in your actual project.

**Live deployment:** [frc-mcp-server.vercel.app](https://frc-mcp-server.vercel.app)

## Features

- **List sources**: Discover all indexed FRC documentation and robot code files grouped by directory
- **Search context**: Full-text search across docs and code for classes, methods, constants, and concepts
- **Read files**: Retrieve complete or partial file contents with line-range support
- **Deploy anywhere**: Runs on Vercel, locally via Node, or any Node.js host
- **Customizable**: Drop your own robot code and docs into `src/data/` to tailor the context to your team

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_frc_sources` | List all indexed files grouped by directory. Use this to discover available FRC documentation and team robot code context. |
| `search_frc_context` | Search across FRC documentation and team robot code for classes, methods, constants, and concepts. Returns relevant code snippets with context. |
| `get_frc_file` | Read complete or partial content of a specific file. Use for examining exact code, documentation, or configuration details. |

### `search_frc_context` parameters

- `query` (required): Text to search for (e.g. `PIDController`, `swerve`, `vision`, `AutoBuilder`). Case-insensitive.
- `sourcePath` (optional): Limit search to a specific file or directory prefix (e.g. `robot/src/main/java/frc/robot/` or `frc-docs/`).
- `limit` (optional): Max snippets to return (default: 8, max: 25).

### `get_frc_file` parameters

- `sourcePath` (required): Relative path from `list_frc_sources` (e.g. `robot/src/main/java/frc/robot/Constants.java`).
- `startLine` (optional): 1-based start line.
- `endLine` (optional): 1-based end line (inclusive).

## Quick Start

### Prerequisites

- Node.js 20 or later

### Install and run locally

```bash
git clone https://github.com/Project516/frc-mcp-server.git
cd frc-mcp-server
npm install
npm run build
npm start
```

The server starts an HTTP endpoint at `/mcp` compatible with the MCP Streamable HTTP transport.

### Deploy to Vercel

1. Fork this repository
2. Add your robot code and docs to `src/data/` (see below)
3. Push to your fork and connect it to [Vercel](https://vercel.com)
4. The included `vercel.json` handles the build and routing configuration

## Adding Your Team's Context

Place files in `src/data/` to make them available to MCP tools. The recommended structure:

```
src/data/
  robot/                  # Your team's robot code
    src/main/java/frc/robot/...
    build.gradle
  frc-docs/               # WPILib documentation and references
  vendors/                # Vendor library notes (REV, CTRE, PathPlanner, etc.)
    rev/
    ctre/
    pathplanner/
```

See [docs/FRC_CONTEXT.md](docs/FRC_CONTEXT.md) for detailed guidance on organizing your context, keeping it clean, and updating it each season.

### Tips

- Only include source and config files — exclude `.gradle`, `build`, `bin`, `out` directories
- Keep files as plain text, markdown, or source code
- Prefer fewer, high-signal files over copies of entire documentation sites
- Add a `README.md` in each subfolder describing its contents
- Treat everything in `src/data/` as potentially visible — never include secrets or tokens

## Project Structure

```
├── src/
│   ├── index.ts          # MCP server entry point and tool definitions
│   └── data/              # Customizable context directory (robot code + docs)
├── docs/
│   └── FRC_CONTEXT.md    # Guide for organizing context data
├── public/
│   └── index.html        # Landing page for the Vercel deployment
├── package.json
├── tsconfig.json
├── vercel.json            # Vercel build and routing config
└── .gitignore
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b my-feature`)
3. Make your changes
4. Run `npm run typecheck` to verify TypeScript compiles
5. Commit and push your branch
6. Open a pull request

Please keep PRs focused. One improvement per PR makes review easier for everyone.

## License

GPL-3.0-or-later — see the [LICENSE](LICENSE) file for details.
