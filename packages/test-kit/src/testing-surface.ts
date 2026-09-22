/** Per-package test/surface.json schema (types only; data lives in each workspace package). */

export type TestTier = "Unit" | "Package" | "E2E";

export type CaseDrivenTier = "Package" | "E2E";

export interface PackageTestSurface {
  caseDriven: boolean;
  cases?: CaseRegistryEntry[];
  tiers: TestTier[];
  usesFixtures: boolean;
}

export interface CaseRegistryEntry {
  export: string;
  /** Path relative to the package test/ directory. */
  file: string;
  tier: CaseDrivenTier;
}
