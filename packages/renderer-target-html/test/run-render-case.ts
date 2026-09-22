import { readFile } from "node:fs/promises";
import { AirpDiagnosticError } from "@airp/diagnostics";
import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import { documentRenderLocale } from "@airp/renderer-shared";
import { documentPath } from "@airp/test-kit";
import { JSDOM } from "jsdom";
import { renderHtml as renderHtmlNode } from "../src/node/render.js";
import { renderHtml as renderHtmlIso } from "../src/render.js";
import type { HtmlRenderCase } from "./render-case.js";

const STYLE_ELEMENT_RE = /<style>[\s\S]*?<\/style>/;

async function loadSnapshot(
  relDocument: string
): Promise<AirpDocumentSnapshot> {
  const raw = await readFile(documentPath(relDocument), "utf8");
  return JSON.parse(raw) as AirpDocumentSnapshot;
}

function assertSvgViewer(caseId: string, body: string): void {
  if (!(body.includes('data-mermaid="true"') && body.includes("<svg"))) {
    throw new Error(`${caseId}: expected Mermaid SVG figures`);
  }
  if (!body.includes("data-min-height=")) {
    throw new Error(`${caseId}: expected svg-viewer min-height contract`);
  }
  if (!body.includes("data-storage-key=")) {
    throw new Error(`${caseId}: expected svg-viewer storage-key contract`);
  }
  const storageKeys = [...body.matchAll(/\bdata-storage-key="([^"]+)"/g)].map(
    (match) => match[1]
  );
  if (
    storageKeys.length >= 2 &&
    new Set(storageKeys).size !== storageKeys.length
  ) {
    throw new Error(
      `${caseId}: duplicate svg-viewer storage keys: ${storageKeys.join(",")}`
    );
  }
}

function assertDistinctMermaidSvgIds(caseId: string, body: string): void {
  const roots = [...body.matchAll(/\bid="(airp-mmd-\d+)"/g)].map((m) => m[1]);
  if (roots.length < 2) {
    throw new Error(
      `${caseId}: expected at least two Mermaid SVG root ids, got ${roots.join(",")}`
    );
  }
  if (new Set(roots).size !== roots.length) {
    throw new Error(
      `${caseId}: duplicate Mermaid SVG root ids: ${roots.join(",")}`
    );
  }
}

function assertExtraAppHeader(caseId: string, body: string): void {
  if (!body.includes('data-test-extra-app-header="true"')) {
    throw new Error(`${caseId}: expected extraAppHeader injection marker`);
  }
  const headerIdx = body.indexOf("data-app-header-trailing");
  const injectIdx = body.indexOf('data-test-extra-app-header="true"');
  if (headerIdx < 0 || injectIdx < headerIdx) {
    throw new Error(
      `${caseId}: expected extraAppHeader inside app-header trailing region`
    );
  }
}

function assertExtraHeadPre(caseId: string, body: string): void {
  const preIdx = body.indexOf("<!-- airp-test-extra-head-pre -->");
  const applyIdx = body.indexOf('id="airp-color-scheme-apply"');
  const headIdx = body.indexOf("<!-- airp-test-extra-head -->");
  if (preIdx < 0 || applyIdx < 0 || headIdx < 0) {
    throw new Error(
      `${caseId}: expected extraHeadPre, color-scheme apply, and extraHead markers`
    );
  }
  if (!(preIdx < applyIdx && applyIdx < headIdx)) {
    throw new Error(
      `${caseId}: expected extraHeadPre before color-scheme apply before extraHead`
    );
  }
}

function assertSectionAnchors(caseId: string, body: string): void {
  if (!(body.includes('data-block-type="section"') && body.includes(" id="))) {
    throw new Error(`${caseId}: expected section blocks with anchor ids`);
  }
}

function assertPageToc(caseId: string, body: string): void {
  const dom = new JSDOM(body.replace(STYLE_ELEMENT_RE, ""));
  const doc = dom.window.document;
  const toc = doc.querySelector("[data-page-toc]");
  const sections = [...doc.querySelectorAll('[data-block-type="section"][id]')];
  const ticks = toc ? [...toc.querySelectorAll("[data-page-toc-tick]")] : [];
  const items = toc ? [...toc.querySelectorAll("[data-page-toc-item]")] : [];
  dom.window.close();

  if (!toc) {
    throw new Error(`${caseId}: expected floating page TOC`);
  }
  if (sections.length < 2) {
    throw new Error(
      `${caseId}: page TOC fixture must include at least two sections`
    );
  }
  if (ticks.length !== sections.length || items.length !== sections.length) {
    throw new Error(
      `${caseId}: TOC entry count must match section count (${ticks.length}/${items.length} vs ${sections.length})`
    );
  }
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const id = section?.id;
    const tick = ticks[index];
    const item = items[index];
    if (!(id && tick && item)) {
      throw new Error(`${caseId}: missing TOC pair at ${index}`);
    }
    if (
      tick.getAttribute("href") !== `#${id}` ||
      item.getAttribute("href") !== `#${id}`
    ) {
      throw new Error(`${caseId}: TOC href mismatch at ${index}`);
    }
    const level = tick.getAttribute("data-toc-level");
    if (!level || level !== item.getAttribute("data-toc-level")) {
      throw new Error(`${caseId}: TOC level mismatch at ${index}`);
    }
  }
}

function assertHeroMetricTones(caseId: string, body: string): void {
  const dom = new JSDOM(body.replace(STYLE_ELEMENT_RE, ""));
  for (const tone of ["positive", "negative", "accent"]) {
    const value = dom.window.document.querySelector(
      `[data-block-type="hero"] [data-metric][data-tone="${tone}"] [data-metric-number]`
    );
    if (!value) {
      throw new Error(`${caseId}: expected hero metric tone ${tone}`);
    }
  }
  dom.window.close();
}

function assertInteractiveTabs(caseId: string, body: string): void {
  const dom = new JSDOM(body.replace(STYLE_ELEMENT_RE, ""));
  const root = dom.window.document.querySelector('[data-block-type="tabs"]');
  const tabs = root?.querySelectorAll('[role="tab"]') ?? [];
  const panels = root?.querySelectorAll('[role="tabpanel"]') ?? [];
  if (tabs.length === 0 || tabs.length !== panels.length) {
    throw new Error(`${caseId}: expected matching tabs and panels`);
  }
  for (let index = 0; index < tabs.length; index += 1) {
    const tab = tabs[index];
    const panel = panels[index] as HTMLElement | undefined;
    if (
      !(tab && panel) ||
      tab.getAttribute("aria-controls") !== panel.id ||
      panel.getAttribute("aria-labelledby") !== tab.id
    ) {
      throw new Error(`${caseId}: invalid tabs relationship at ${index}`);
    }
    if (panel.hidden !== (index !== 0)) {
      throw new Error(`${caseId}: invalid initial tabs visibility at ${index}`);
    }
  }
  dom.window.close();
}

function assertAgentNoteChrome(caseId: string, body: string): void {
  const dom = new JSDOM(body.replace(STYLE_ELEMENT_RE, ""));
  const note = dom.window.document.querySelector("aside[data-agent-note]");
  const chrome = note?.querySelector("[data-agent-note-chrome]");
  const icon = note?.querySelector('use[href="#airp-icon-info"]');
  dom.window.close();
  if (!(note && chrome && icon)) {
    throw new Error(`${caseId}: expected visible agent-note chrome`);
  }
}

function assertAppendixTitleOnly(caseId: string, body: string): void {
  const dom = new JSDOM(body.replace(STYLE_ELEMENT_RE, ""));
  const header = dom.window.document.querySelector("[data-appendix-header]");
  const title = header?.querySelector(":scope > h4");
  const hasTrailingChrome = (header?.children.length ?? 0) !== 1;
  dom.window.close();
  if (!(header && title) || hasTrailingChrome) {
    throw new Error(`${caseId}: expected title-only appendix header`);
  }
}

function assertOkBody(
  caseId: string,
  body: string,
  expect: Extract<HtmlRenderCase["expect"], { ok: true }>
): void {
  for (const needle of expect.contains) {
    if (!body.includes(needle)) {
      throw new Error(
        `${caseId}: expected body to contain ${JSON.stringify(needle)}\n---\n${body.slice(0, 2000)}`
      );
    }
  }
  for (const needle of expect.notContains ?? []) {
    if (body.includes(needle)) {
      throw new Error(
        `${caseId}: expected body not to contain ${JSON.stringify(needle)}`
      );
    }
  }
  if (expect.hasSvgViewer) {
    assertSvgViewer(caseId, body);
  }
  if (expect.distinctMermaidSvgIds) {
    assertDistinctMermaidSvgIds(caseId, body);
  }
  if (expect.hasExtraAppHeader) {
    assertExtraAppHeader(caseId, body);
  }
  if (expect.hasExtraHeadPre) {
    assertExtraHeadPre(caseId, body);
  }
  if (expect.hasSectionAnchors) {
    assertSectionAnchors(caseId, body);
  }
  if (expect.hasPageToc) {
    assertPageToc(caseId, body);
  }
  if (expect.hasHeroMetricTones) {
    assertHeroMetricTones(caseId, body);
  }
  if (expect.hasInteractiveTabs) {
    assertInteractiveTabs(caseId, body);
  }
  if (expect.hasAgentNoteChrome) {
    assertAgentNoteChrome(caseId, body);
  }
  if (expect.hasAppendixTitleOnly) {
    assertAppendixTitleOnly(caseId, body);
  }
}

function assertFailCode(caseId: string, error: unknown, code: string): void {
  if (!(error instanceof AirpDiagnosticError)) {
    throw error;
  }
  const hasCode = error.diagnostics.some((d) => d.code === code);
  if (!hasCode) {
    throw new Error(
      `${caseId}: expected code ${code}, got ${error.diagnostics.map((d) => d.code).join(", ")}`
    );
  }
}

/** Package: render HTML from a document fixture. */
export async function runRenderCase(case_: HtmlRenderCase): Promise<void> {
  const document = await loadSnapshot(case_.document);
  const locale = documentRenderLocale(document);
  if (!locale) {
    throw new Error(`${case_.id}: fixture has no document render locale`);
  }
  const ctx = {
    document,
    locale,
    targetOptions: case_.targetOptions,
  };
  const entry = case_.entry ?? "isomorphic";
  const render =
    entry === "node"
      ? () => renderHtmlNode(ctx)
      : () => Promise.resolve(renderHtmlIso(ctx));

  if (case_.expect.ok) {
    const output = await render();
    const body = output.primary.body;
    if (typeof body !== "string") {
      throw new Error(`${case_.id}: expected string HTML body`);
    }
    assertOkBody(case_.id, body, case_.expect);
    return;
  }

  try {
    await render();
    throw new Error(`${case_.id}: expected render failure`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === `${case_.id}: expected render failure`
    ) {
      throw error;
    }
    assertFailCode(case_.id, error, case_.expect.code);
  }
}
