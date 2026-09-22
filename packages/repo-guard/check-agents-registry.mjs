#!/usr/bin/env node
/**
 * Validate .agents registry, AGENTS.md index, and markdown doc references.
 * Usage: pnpm check-agents-registry
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { ROOT } from "./repo-root.mjs";

function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

function relFromRoot(absPath) {
  return toPosixPath(path.relative(ROOT, absPath));
}

const AGENTS_DIR = path.join(ROOT, ".agents");
const REGISTRY_PATH = path.join(AGENTS_DIR, "registry.yaml");
const AGENTS_MD_PATH = path.join(ROOT, "AGENTS.md");

const REGEX_NON_WHITESPACE = /\S/;
const REGEX_MD_SUFFIX = /\.md$/;
const REGEX_QUOTE_WRAP = /^"|"$/g;
const REGEX_RULES_PKG = /^\.agents\/rules\/[^/]+\/([^/]+)\//;
const REGEX_SKILLS_PKG = /^\.agents\/skills\/[^/]+\/([^/]+)\//;
const REGEX_DEPENDS_ON_BLOCK = /depends_on:\s*\n((?:\s+-\s+.+\n?)+)/;
const REGEX_DEPENDS_ON_INLINE = /depends_on:\s*\[([^\]]*)\]/;
const REGEX_DEPENDS_LINE = /^\s+-\s+(.+)$/;
const REGISTRY_SCHEME = "registry://";
const REGEX_RULES_ID_PREFIX = /^registry:\/\/rules\./;
const REGEX_SKILLS_ID_PREFIX = /^registry:\/\/skills\./;
const REGEX_README_TITLE = /^#\s+(.+)$/m;
const DOC_ID_BODY = /^(rules|skills|shared)\.[a-z0-9-]+(?:\.[a-z0-9-]+)*$/;
const DOC_ID_CANONICAL =
  /^registry:\/\/(rules|skills|shared)\.[a-z0-9-]+(?:\.[a-z0-9-]+)*$/;
const DOC_ID_ANYWHERE =
  /registry:\/\/(rules|skills|shared)\.[a-z0-9-]+(?:\.[a-z0-9-]+)*/g;
const LEGACY_DOC_ID_IN_TEXT =
  /`(rules|skills|shared)\.[a-z0-9-]+(?:\.[a-z0-9-]+)*`/g;
const LEGACY_DEPENDS_ID =
  /^(rules|skills|shared)\.[a-z0-9-]+(?:\.[a-z0-9-]+)*$/;
const RELATIVE_MD_LINK = /\[[^\]]*\]\(((?:\.\/|\.\.\/)[^)#]*(?:#[^)]*)?)\)/g;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** @type {string[]} */
const errors = [];

function fail(message) {
  errors.push(message);
}

function listDirs(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).filter((name) =>
    statSync(path.join(dir, name)).isDirectory()
  );
}

function collectMdFiles(dir, acc = []) {
  if (!existsSync(dir)) {
    return acc;
  }
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      collectMdFiles(full, acc);
    } else if (name.endsWith(".md")) {
      acc.push(full);
    }
  }
  return acc;
}

function parseRegistryYaml(text) {
  /** @type {Record<string, unknown>} */
  const root = {};
  /** @type {Record<string, unknown>[]} */
  const stack = [root];
  /** @type {number[]} */
  const indents = [-1];

  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }
    const indent = line.search(REGEX_NON_WHITESPACE);
    const trimmed = line.trim();
    const colon = trimmed.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const key = trimmed.slice(0, colon).trim();
    const rest = trimmed.slice(colon + 1).trim();

    while (indents.length > 1 && indent <= indents.at(-1)) {
      stack.pop();
      indents.pop();
    }

    const parent = stack.at(-1);
    if (!parent) {
      continue;
    }

    if (rest === "") {
      parent[key] = {};
      stack.push(/** @type {Record<string, unknown>} */ (parent[key]));
      indents.push(indent);
    } else {
      parent[key] = rest.replace(REGEX_QUOTE_WRAP, "");
    }
  }

  return root;
}

function docIdBody(id) {
  const trimmed = id.trim();
  if (!DOC_ID_CANONICAL.test(trimmed)) {
    return null;
  }
  const body = trimmed.slice(REGISTRY_SCHEME.length);
  return DOC_ID_BODY.test(body) ? body : null;
}

function canonicalDocId(body) {
  return `${REGISTRY_SCHEME}${body}`;
}

function resolveId(registry, id) {
  const body = docIdBody(id);
  if (!body) {
    return null;
  }
  const parts = body.split(".");
  const sectionData = registry[parts[0]];
  if (!sectionData || typeof sectionData !== "object") {
    return null;
  }

  /** @type {unknown} */
  let node = /** @type {Record<string, unknown>} */ (sectionData)[parts[1]];
  if (parts.length === 2) {
    if (node && typeof node === "object" && "path" in node) {
      return /** @type {{ path: string }} */ (node).path;
    }
    return null;
  }

  for (let i = 2; i < parts.length; i++) {
    if (!node || typeof node !== "object") {
      return null;
    }
    node = /** @type {Record<string, unknown>} */ (node)[parts[i]];
  }

  return typeof node === "string" ? node : null;
}

function buildPathToIdMap(registry) {
  /** @type {Map<string, string>} */
  const map = new Map();

  function walk(node, prefix) {
    if (typeof node.path === "string") {
      map.set(node.path, canonicalDocId(prefix));
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "path") {
        continue;
      }
      if (typeof value === "string") {
        map.set(value, canonicalDocId(`${prefix}.${key}`));
      } else if (value && typeof value === "object") {
        walk(
          /** @type {Record<string, unknown>} */ (value),
          `${prefix}.${key}`
        );
      }
    }
  }

  for (const section of ["rules", "skills", "shared"]) {
    const data = registry[section];
    if (!data || typeof data !== "object") {
      continue;
    }
    for (const [slug, pkg] of Object.entries(
      /** @type {Record<string, unknown>} */ (data)
    )) {
      if (pkg && typeof pkg === "object") {
        walk(
          /** @type {Record<string, unknown>} */ (pkg),
          `${section}.${slug}`
        );
      }
    }
  }

  return map;
}

function collectAllIds(registry) {
  return new Set(buildPathToIdMap(registry).values());
}

function scanDiskPackages(sectionDir, entryName) {
  /** @type {Map<string, { tier: string, files: string[] }>} */
  const packages = new Map();

  for (const tier of listDirs(sectionDir)) {
    for (const slug of listDirs(path.join(sectionDir, tier))) {
      const packageDir = path.join(sectionDir, tier, slug);
      if (!existsSync(path.join(packageDir, entryName))) {
        continue;
      }
      const files = collectMdFiles(packageDir).map(relFromRoot).sort();
      const existing = packages.get(slug);
      if (existing) {
        fail(`slug conflict: ${slug} in tiers ${existing.tier} and ${tier}`);
      } else {
        packages.set(slug, { tier, files });
      }
    }
  }
  return packages;
}

function collectRegistryPaths(pkgNode) {
  /** @type {string[]} */
  const paths = [];

  function walk(node) {
    if (typeof node.path === "string") {
      paths.push(node.path);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "path") {
        continue;
      }
      if (typeof value === "string") {
        paths.push(value);
      } else if (value && typeof value === "object") {
        walk(/** @type {Record<string, unknown>} */ (value));
      }
    }
  }

  walk(pkgNode);
  return paths.sort();
}

function comparePackagePaths(section, slug, regPaths, diskPaths) {
  for (const p of diskPaths) {
    if (!regPaths.includes(p)) {
      fail(`registry missing path for ${section}.${slug}: ${p}`);
    }
  }
  for (const p of regPaths) {
    if (!diskPaths.includes(p)) {
      fail(`registry extra path (not on disk): ${p}`);
    }
    if (!existsSync(path.join(ROOT, p))) {
      fail(`registry path does not exist: ${p}`);
    }
  }
}

function assertSectionParity(registry, section, sectionDir, entryName) {
  const disk = scanDiskPackages(sectionDir, entryName);
  const regSection = registry[section];
  if (!regSection || typeof regSection !== "object") {
    fail(`registry missing section: ${section}`);
    return;
  }

  const regKeys = new Set(Object.keys(regSection));
  for (const key of disk.keys()) {
    if (!regKeys.has(key)) {
      fail(`registry missing package: ${section}.${key}`);
    }
  }
  for (const key of regKeys) {
    if (!disk.has(key)) {
      fail(`registry orphan package (not on disk): ${section}.${key}`);
    }
  }

  for (const [slug, info] of disk) {
    const pkgNode = /** @type {Record<string, unknown>} */ (regSection)[slug];
    if (!pkgNode || typeof pkgNode !== "object") {
      continue;
    }
    comparePackagePaths(
      section,
      slug,
      collectRegistryPaths(/** @type {Record<string, unknown>} */ (pkgNode)),
      info.files
    );
  }
}

function assertSharedParity(registry) {
  const sharedDir = path.join(AGENTS_DIR, "shared");
  if (!existsSync(sharedDir)) {
    return;
  }

  const diskShared = readdirSync(sharedDir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => n.replace(REGEX_MD_SUFFIX, ""))
    .sort();
  const regShared = registry.shared;
  if (!regShared || typeof regShared !== "object") {
    if (diskShared.length > 0) {
      fail("registry missing shared section");
    }
    return;
  }

  const regKeys = Object.keys(regShared).sort();
  for (const key of diskShared) {
    if (!regKeys.includes(key)) {
      fail(`registry missing shared.${key}`);
    }
  }
  for (const key of regKeys) {
    const node = /** @type {Record<string, unknown>} */ (regShared)[key];
    const expectedPath = `.agents/shared/${key}.md`;
    if (!diskShared.includes(key)) {
      fail(`registry orphan shared.${key} (no ${expectedPath} on disk)`);
    }
    if (typeof node?.path === "string") {
      if (node.path !== expectedPath) {
        fail(`shared.${key} path must be ${expectedPath}, got ${node.path}`);
      }
      if (!existsSync(path.join(ROOT, node.path))) {
        fail(`shared.${key} path missing on disk: ${node.path}`);
      }
    } else {
      fail(`shared.${key} missing path`);
    }
  }
}

function assertRegistryDiskParity(registry) {
  assertSectionParity(
    registry,
    "rules",
    path.join(AGENTS_DIR, "rules"),
    "README.md"
  );
  assertSectionParity(
    registry,
    "skills",
    path.join(AGENTS_DIR, "skills"),
    "SKILL.md"
  );
  assertSharedParity(registry);
}

function packageRootForFile(filePath) {
  const rel = relFromRoot(filePath);
  const rulesMatch = rel.match(REGEX_RULES_PKG);
  if (rulesMatch) {
    return `.agents/rules/${rel.split("/")[2]}/${rulesMatch[1]}`;
  }
  const skillsMatch = rel.match(REGEX_SKILLS_PKG);
  if (skillsMatch) {
    return `.agents/skills/${rel.split("/")[2]}/${skillsMatch[1]}`;
  }
  if (rel.startsWith(".agents/shared/")) {
    return ".agents/shared";
  }
  return null;
}

function isUnderRegistryDoc(relPath) {
  return (
    relPath.startsWith(".agents/rules/") ||
    relPath.startsWith(".agents/skills/") ||
    relPath.startsWith(".agents/shared/")
  );
}

function resolveLinkTarget(absFile, href) {
  const targetRel = href.split("#")[0];
  const resolved = path.normalize(path.join(path.dirname(absFile), targetRel));
  return {
    resolved,
    targetPath: relFromRoot(resolved),
    targetPkg: packageRootForFile(resolved),
  };
}

function collectDependsOnIds(fmBody) {
  /** @type {string[]} */
  const ids = [];

  const block = fmBody.match(REGEX_DEPENDS_ON_BLOCK);
  if (block) {
    for (const line of block[1].split("\n")) {
      const m = line.match(REGEX_DEPENDS_LINE);
      if (m) {
        ids.push(m[1].trim());
      }
    }
  }

  const inline = fmBody.match(REGEX_DEPENDS_ON_INLINE);
  if (inline) {
    for (const part of inline[1].split(",")) {
      const id = part.trim();
      if (id) {
        ids.push(id);
      }
    }
  }

  return ids;
}

function assertDependsOn(relFile, fmBody, registry, allIds) {
  for (const id of collectDependsOnIds(fmBody)) {
    if (LEGACY_DEPENDS_ID.test(id)) {
      fail(
        `${relFile}: depends_on must use ${REGISTRY_SCHEME} prefix (legacy: ${id})`
      );
      continue;
    }
    if (!(allIds.has(id) && resolveId(registry, id))) {
      fail(`${relFile}: depends_on unknown ID: ${id}`);
    }
  }
}

function assertLegacyDocIdsInText(relFile, text, registry, allIds) {
  for (const match of text.matchAll(LEGACY_DOC_ID_IN_TEXT)) {
    const bare = match[0].slice(1, -1);
    const id = `${REGISTRY_SCHEME}${bare}`;
    // Only flag bare forms that resolve as real doc IDs (not e.g. html-locale keys).
    if (allIds.has(id) && resolveId(registry, id)) {
      fail(
        `${relFile}: doc ID must use ${REGISTRY_SCHEME} prefix (legacy: ${match[0]})`
      );
    }
  }
}

function assertDocIdsInText(relFile, text, registry, allIds) {
  for (const match of text.matchAll(DOC_ID_ANYWHERE)) {
    const id = match[0];
    if (!(allIds.has(id) && resolveId(registry, id))) {
      fail(`${relFile}: unresolved doc ID: ${id}`);
    }
  }
}

function assertRelativeLinks(relFile, absFile, text, pkgRoot) {
  for (const match of text.matchAll(RELATIVE_MD_LINK)) {
    const href = match[1];
    const { resolved, targetPath, targetPkg } = resolveLinkTarget(
      absFile,
      href
    );

    if (
      targetPkg &&
      isUnderRegistryDoc(targetPath) &&
      (!pkgRoot || targetPkg !== pkgRoot)
    ) {
      fail(
        `${relFile}: cross-package relative link (use ${REGISTRY_SCHEME} doc ID): ${match[0]} → ${targetPath}`
      );
      continue;
    }

    if (targetPkg === pkgRoot && !existsSync(resolved)) {
      fail(`${relFile}: broken intra-package link: ${match[0]}`);
    } else if (
      !targetPkg &&
      isUnderRegistryDoc(targetPath) &&
      !existsSync(resolved)
    ) {
      fail(`${relFile}: broken rules doc link: ${match[0]}`);
    }
  }
}

function assertMarkdownFile(registry, allIds, absFile) {
  const relFile = relFromRoot(absFile);
  const text = readFileSync(absFile, "utf8");
  const pkgRoot = packageRootForFile(absFile);
  const fm = text.match(FRONTMATTER);

  if (fm) {
    assertDependsOn(relFile, fm[1], registry, allIds);
  }
  assertLegacyDocIdsInText(relFile, text, registry, allIds);
  assertDocIdsInText(relFile, text, registry, allIds);
  assertRelativeLinks(relFile, absFile, text, pkgRoot);
}

function assertMarkdownFiles(registry) {
  const allIds = collectAllIds(registry);
  for (const absFile of collectMdFiles(AGENTS_DIR)) {
    assertMarkdownFile(registry, allIds, absFile);
  }
}

function parseAgentsMdIndex(text) {
  const tableStart = text.indexOf("## 规范索引");
  if (tableStart === -1) {
    return { ids: [], rows: [] };
  }

  /** @type {{ id: string, title: string, when: string, skill: string }[]} */
  const rows = [];
  for (const line of text.slice(tableStart).split("\n")) {
    if (!line.startsWith(`| \`${REGISTRY_SCHEME}rules.`)) {
      continue;
    }
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 4) {
      continue;
    }
    rows.push({
      id: cells[0].replace(/^`|`$/g, ""),
      title: cells[1],
      when: cells[2],
      skill: cells[3].replace(/^`|`$/g, ""),
    });
  }

  return { ids: rows.map((r) => r.id), rows };
}

function assertIndexTitles(rows, regRules) {
  for (const row of rows) {
    const slug = row.id.replace(REGEX_RULES_ID_PREFIX, "");
    const pkg = /** @type {Record<string, unknown>} */ (regRules)[slug];
    const pkgPath =
      pkg && typeof pkg === "object" && typeof pkg.path === "string"
        ? pkg.path
        : null;
    if (!pkgPath) {
      continue;
    }
    const readme = readFileSync(path.join(ROOT, pkgPath), "utf8");
    const readmeTitle = readme.match(REGEX_README_TITLE)?.[1]?.trim();
    if (readmeTitle && readmeTitle !== row.title) {
      fail(
        `AGENTS.md title mismatch for ${row.id}: index "${row.title}" vs README "${readmeTitle}"`
      );
    }
  }
}

function assertIndexSkillIds(rows, registry, allIds) {
  for (const row of rows) {
    const skill = row.skill.trim();
    if (skill === "—" || skill === "-") {
      continue;
    }
    if (!DOC_ID_CANONICAL.test(skill)) {
      fail(`AGENTS.md invalid skill ID for ${row.id}: ${skill}`);
      continue;
    }
    if (!REGEX_SKILLS_ID_PREFIX.test(skill)) {
      fail(
        `AGENTS.md skill column must reference skills.* for ${row.id}: ${skill}`
      );
      continue;
    }
    if (!(allIds.has(skill) && resolveId(registry, skill))) {
      fail(`AGENTS.md unresolved skill ID for ${row.id}: ${skill}`);
    }
  }
}

function assertAgentsMd(registry, allIds) {
  if (!existsSync(AGENTS_MD_PATH)) {
    fail("AGENTS.md missing");
    return;
  }

  const text = readFileSync(AGENTS_MD_PATH, "utf8");
  if (!text.includes("registry.yaml")) {
    fail("AGENTS.md must mention registry.yaml as path SSOT");
  }
  if (!text.includes(REGISTRY_SCHEME)) {
    fail(`AGENTS.md must document doc IDs with ${REGISTRY_SCHEME} prefix`);
  }

  assertLegacyDocIdsInText("AGENTS.md", text, registry, allIds);
  assertDocIdsInText("AGENTS.md", text, registry, allIds);

  const { ids, rows } = parseAgentsMdIndex(text);
  const regRules = registry.rules;
  if (!regRules || typeof regRules !== "object") {
    fail("registry rules section missing");
    return;
  }

  const regIds = new Set(
    Object.keys(regRules).map((k) => canonicalDocId(`rules.${k}`))
  );
  for (const id of regIds) {
    if (!ids.includes(id)) {
      fail(`AGENTS.md index missing: ${id}`);
    }
  }
  for (const id of ids) {
    if (!regIds.has(id)) {
      fail(`AGENTS.md index unknown rule: ${id}`);
    }
  }

  assertIndexTitles(rows, regRules);
  assertIndexSkillIds(rows, registry, allIds);
}

function assertSharedDeliveryPrerequisites(registry) {
  const shared = registry.shared;
  if (!shared || typeof shared !== "object") {
    fail("registry missing shared.delivery-prerequisites");
    return;
  }
  const node = /** @type {Record<string, unknown>} */ (shared)[
    "delivery-prerequisites"
  ];
  if (!node || typeof node !== "object" || typeof node.path !== "string") {
    fail("registry missing shared.delivery-prerequisites path");
  }
}

function main() {
  if (!existsSync(REGISTRY_PATH)) {
    fail(`missing ${relFromRoot(REGISTRY_PATH)}`);
  }

  const registry = parseRegistryYaml(readFileSync(REGISTRY_PATH, "utf8"));
  const allIds = collectAllIds(registry);

  assertRegistryDiskParity(registry);
  assertSharedDeliveryPrerequisites(registry);
  assertAgentsMd(registry, allIds);
  assertMarkdownFiles(registry);

  if (errors.length > 0) {
    console.error(`[check-agents-registry] ${errors.length} error(s):\n`);
    for (const e of errors) {
      console.error(`  • ${e}`);
    }
    process.exit(1);
  }

  console.log("[check-agents-registry] OK");
}

main();
