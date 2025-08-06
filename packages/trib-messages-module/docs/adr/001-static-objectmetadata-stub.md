# ADR 001: Static ObjectMetadata Stub for Real-time Event Emission

**Status:** Accepted
**Date:** 2025-01-28
**Authors:** Engineering Team
**Review Date:** 2025-07-28 (6 months)

## Context

Real-time SMS updates in Twenty CRM require `objectMetadata` field in event emissions for webhook, timeline, and audit systems. Cross-package
dependency injection from `@twenty/trib-messages-module` to `twenty-server` ObjectMetadataService fails due to module dependency issues
(ObjectMetadataModule is not @Global()).

## Decision

Implement static ObjectMetadata stub with hardcoded TribMessage metadata to eliminate dependency injection complexity while maintaining full real-time
functionality.

## Implementation

- **File:** `src/constants/trib-message-metadata-stub.ts`
- **Replaces:** 5 async `getObjectMetadata()` calls across services
- **Fields provided:** All 18 required ObjectMetadataInterface fields
- **Consumers satisfied:** Webhook (id, nameSingular), Timeline (isSystem, nameSingular), Audit (id)

## Consequences

### Positive
- ✅ Eliminates cross-package dependency injection issues
- ✅ Improves performance (no database lookups)
- ✅ Maintains full real-time functionality
- ✅ Simple implementation (< 4 hours total work)

### Negative
- ⚠️ Violates single-source-of-truth principle
- ⚠️ Risk of silent drift if canonical metadata changes
- ⚠️ Creates maintenance overhead for dual updates

## Mitigation Strategies

1. **Automated drift tests** in CI comparing stub to canonical metadata
2. **Clear ownership** documentation (trib-messages-module team)
3. **ESLint rule** preventing proliferation of similar stubs
4. **Sunset plan** with 6-month review for shared SDK migration

## Alternative Considered

- Factory function with ModuleRef: Failed due to package boundaries
- @Global() ObjectMetadataModule: Too risky architectural change
- Shared @twenty/object-metadata-sdk: Higher complexity, future solution

## Success Metrics

- Real-time SMS updates work without page reload
- No dependency injection errors in logs
- Webhook/timeline/audit systems function normally