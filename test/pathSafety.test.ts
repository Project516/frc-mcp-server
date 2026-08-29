import { test } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { safeResolveWithinRoot } from "../src/pathSafety.js";

const ROOT = "/srv/data";

test("resolves a normal nested file inside root", () => {
  const got = safeResolveWithinRoot(ROOT, "robot/Constants.java");
  assert.equal(got, path.resolve(ROOT, "robot/Constants.java"));
});

test("strips leading slashes before joining", () => {
  const got = safeResolveWithinRoot(ROOT, "/robot/Constants.java");
  assert.equal(got, path.resolve(ROOT, "robot/Constants.java"));
});

test("allows the root directory itself", () => {
  const got = safeResolveWithinRoot(ROOT, "");
  assert.equal(got, path.resolve(ROOT));
});

test("rejects a .. traversal to a parent directory", () => {
  assert.equal(safeResolveWithinRoot(ROOT, "../secrets.txt"), null);
  assert.equal(safeResolveWithinRoot(ROOT, "../../etc/passwd"), null);
  assert.equal(safeResolveWithinRoot(ROOT, "robot/../../etc/passwd"), null);
});

test("tames a leading slash into the root rather than escaping it", () => {
  // path.join collapses a leading slash, so '/etc/passwd' resolves to
  // '<root>/etc/passwd' and stays inside the root instead of escaping to
  // the filesystem root. That is the safe outcome, not a traversal escape.
  const got = safeResolveWithinRoot(ROOT, "/etc/passwd");
  assert.equal(got, path.resolve(ROOT, "etc/passwd"));
});

test("rejects a sibling directory that shares the root name prefix", () => {
  // '/srv/data-evil/x' is not inside '/srv/data', but a bare prefix check
  // without a trailing separator would wrongly allow it.
  assert.equal(safeResolveWithinRoot("/srv/data", "../data-evil/x"), null);
});
