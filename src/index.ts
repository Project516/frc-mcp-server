import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import type { IncomingMessage, ServerResponse } from "http";

const DATA_ROOT = path.join(process.cwd(), "src", "data");
const MAX_SNIPPET_CHARS = 5000;

type ContextDocument = {
  relativePath: string;
  content: string;
};

async function listAllFilesRecursively(dirPath: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const childResults = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return listAllFilesRecursively(absolutePath);
      }
      return [absolutePath];
    })
  );

  return childResults.flat();
}

function toWorkspaceRelativeDataPath(absolutePath: string): string {
  return path.relative(DATA_ROOT, absolutePath).split(path.sep).join("/");
}

async function loadContextDocuments(): Promise<ContextDocument[]> {
  const allFiles = await listAllFilesRecursively(DATA_ROOT);
  const candidateFiles = allFiles.filter((filePath) => {
    const extension = path.extname(filePath).toLowerCase();
    return [
      ".md",
      ".txt",
      ".json",
      ".java",
      ".kt",
      ".cpp",
      ".cc",
      ".c",
      ".h",
      ".hpp",
      ".gradle",
      ".xml",
      ".yml",
      ".yaml",
    ].includes(extension);
  });

  const docs = await Promise.all(
    candidateFiles.map(async (absolutePath) => {
      const content = await fs.readFile(absolutePath, "utf8");
      return {
        relativePath: toWorkspaceRelativeDataPath(absolutePath),
        content,
      };
    })
  );

  return docs;
}

function createTextResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

function countCaseInsensitiveOccurrences(haystack: string, needle: string): number {
  if (!needle.trim()) return 0;
  const safeNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = haystack.match(new RegExp(safeNeedle, "gi"));
  return matches?.length ?? 0;
}

function createServer() {
  const server = new McpServer({
    name: "frc-context-mcp",
    version: "1.0.0",
  });

  server.tool(
    "list_frc_sources",
    "List all indexed files grouped by directory. Use this to discover available FRC documentation and team robot code context.",
    {},
    async () => {
      const docs = await loadContextDocuments();
      if (docs.length === 0) {
        return createTextResult(
          "No files were found in src/data yet. Add your robot code/docs first."
        );
      }

      // Group files by top-level directory for better navigation
      const grouped = new Map<string, string[]>();
      docs.forEach((doc) => {
        const topDir = doc.relativePath.split('/')[0];
        if (!grouped.has(topDir)) {
          grouped.set(topDir, []);
        }
        grouped.get(topDir)!.push(doc.relativePath);
      });

      // Format output with directory sections
      const sections = Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dir, files]) => {
          const header = dir === 'frc-docs' 
            ? `\n## frc-docs/ (${files.length} files) - Official FRC/WPILib Documentation`
            : dir === 'robot'
            ? `\n## robot/ (${files.length} files) - Team Robot Code`
            : `\n## ${dir}/ (${files.length} files)`;
          
          return header + '\n' + files.map(f => `  ${f}`).join('\n');
        });

      return createTextResult(
        "# Available FRC Context Sources\n" +
        "Use paths shown below with get_frc_file or search_frc_context.\n" +
        sections.join('\n')
      );
    }
  );

  server.tool(
    "search_frc_context",
    "Search across FRC documentation and team robot code for classes, methods, constants, and concepts. Returns relevant code snippets with context.",
    {
      query: z.string().min(2).describe("Text to search for (e.g. PIDController, swerve, vision, AutoBuilder). Case-insensitive."),
      sourcePath: z
        .string()
        .optional()
        .describe("Optional: Limit search to specific file or directory prefix (e.g. 'robot/src/main/java/frc/robot/' or 'frc-docs/')."),
      limit: z.number().int().min(1).max(25).optional().describe("Max snippets to return (default: 8)."),
    },
    async ({ query, sourcePath, limit }) => {
      const docs = await loadContextDocuments();
      const effectiveLimit = limit ?? 8;

      // Support both exact file match and directory prefix filtering
      const filteredDocs = sourcePath
        ? docs.filter((doc) => 
            doc.relativePath === sourcePath || doc.relativePath.startsWith(sourcePath)
          )
        : docs;

      if (filteredDocs.length === 0) {
        return createTextResult(
          sourcePath
            ? `No indexed file matched sourcePath='${sourcePath}'. Use list_frc_sources first.`
            : "No files were found in src/data yet."
        );
      }

      const scored = filteredDocs
        .map((doc) => ({
          ...doc,
          score: countCaseInsensitiveOccurrences(doc.content, query),
        }))
        .filter((doc) => doc.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, effectiveLimit);

      if (scored.length === 0) {
        return createTextResult(`No matches found for '${query}'.`);
      }

      const output = scored
        .map((item) => {
          const lower = item.content.toLowerCase();
          const token = query.toLowerCase();
          const matchIndex = Math.max(0, lower.indexOf(token));
          const start = Math.max(0, matchIndex - 280);
          const end = Math.min(item.content.length, start + MAX_SNIPPET_CHARS);
          const snippet = item.content.slice(start, end).trim();
          return `FILE: ${item.relativePath}\nSCORE: ${item.score}\n---\n${snippet}`;
        })
        .join("\n\n====================\n\n");

      return createTextResult(output);
    }
  );

  server.tool(
    "get_frc_file",
    "Read complete or partial content of a specific file. Use for examining exact code, documentation, or configuration details.",
    {
      sourcePath: z
        .string()
        .describe(
          "Relative path from list_frc_sources (e.g. 'robot/src/main/java/frc/robot/Constants.java' or 'frc-docs/_sources/docs/software/...')"
        ),
      startLine: z.number().int().min(1).optional().describe("1-based start line."),
      endLine: z.number().int().min(1).optional().describe("1-based end line (inclusive)."),
    },
    async ({ sourcePath, startLine, endLine }) => {
      const safePath = sourcePath.replace(/^\/+/, "");
      const absolutePath = path.join(DATA_ROOT, safePath);
      const normalizedRoot = path.resolve(DATA_ROOT);
      const normalizedTarget = path.resolve(absolutePath);

      if (!normalizedTarget.startsWith(normalizedRoot)) {
        return createTextResult("Invalid sourcePath: path traversal is not allowed.");
      }

      let rawContent: string;
      try {
        rawContent = await fs.readFile(normalizedTarget, "utf8");
      } catch {
        return createTextResult(`File not found: ${safePath}`);
      }

      const allLines = rawContent.split(/\r?\n/);
      const start = Math.max(1, startLine ?? 1);
      const end = Math.max(start, endLine ?? allLines.length);
      const selected = allLines.slice(start - 1, end);

      return createTextResult(
        `FILE: ${safePath}\nLINES: ${start}-${end}\n---\n${selected.join("\n")}`
      );
    }
  );

  return server;
}

async function readRequestBody(req: IncomingMessage): Promise<unknown> {
  const requestWithBody = req as IncomingMessage & { body?: unknown };
  if (requestWithBody.body !== undefined) {
    return requestWithBody.body;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id, mcp-protocol-version");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    const body = await readRequestBody(req);
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    const message = error instanceof Error ? error.message : "Unknown MCP server error";
    res.end(JSON.stringify({ error: message }));
  }
}