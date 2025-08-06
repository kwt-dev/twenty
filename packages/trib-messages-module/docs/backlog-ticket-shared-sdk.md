# Ticket: TM-XXX - Migrate to Shared Object Metadata SDK

**Priority:** Medium
**Epic:** Technical Debt Reduction
**Estimate:** 5 story points

## Description

Replace static ObjectMetadata stub (implemented in ADR-001) with shared `@twenty/object-metadata-sdk` package to restore single-source-of-truth
architecture.

## Acceptance Criteria

- [ ] Create `@twenty/object-metadata-sdk` package with TypeScript interfaces
- [ ] Migrate TribMessagesModule to use shared SDK instead of static stub
- [ ] Remove `trib-message-metadata-stub.ts` file
- [ ] Update dependency injection to use SDK providers
- [ ] Verify real-time SMS updates still work normally
- [ ] Update ADR-001 status to "Superseded"

## Technical Requirements

- Must work across package boundaries without @Global() modules
- Must maintain compatibility with existing webhook/timeline/audit consumers
- Must not require ObjectMetadataService dependency injection
- Must provide same 18 ObjectMetadataInterface fields as current stub

## Definition of Done

- All tests pass including existing drift detection tests
- No ESLint warnings about metadata stubs
- Real-time SMS functionality verified in staging
- Documentation updated with new architecture
- ADR-001 marked as superseded with migration notes

## Dependencies

- None

## References

- ADR-001: Static ObjectMetadata Stub
- Cross-package dependency injection investigation
- Modified Option 3 consensus analysis