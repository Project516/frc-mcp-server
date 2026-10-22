import path from "path";

/**
 * Resolve a possibly user supplied relative path against a known root and
 * confirm it stays inside that root.
 *
 * Returns the absolute, normalized target on success, or null when the
 * resolved path would escape the root (a path traversal attempt). The check
 * compares the normalized target against the normalized root plus a trailing
 * separator, so a sibling directory named `root.txt` can never masquerade as
 * the root itself.
 */
export function safeResolveWithinRoot(
  root: string,
  relativePath: string,
): string | null {
  const safeRelative = relativePath.replace(/^\/+/, "");
  const absoluteTarget = path.join(root, safeRelative);
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(absoluteTarget);

  if (normalizedTarget === normalizedRoot) {
    return normalizedTarget;
  }
  if (normalizedTarget.startsWith(normalizedRoot + path.sep)) {
    return normalizedTarget;
  }
  return null;
}
