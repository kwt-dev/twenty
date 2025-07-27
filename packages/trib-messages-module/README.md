# TRIB Messages Module - Package Foundation

[![npm version](https://badge.fury.io/js/%40twenty%2Ftrib-messages-module.svg)](https://badge.fury.io/js/%40twenty%2Ftrib-messages-module)
[![Build Status](https://travis-ci.org/twenty-org/twenty.svg?branch=main)](https://travis-ci.org/twenty-org/twenty)
[![Coverage Status](https://coveralls.io/repos/github/twenty-org/twenty/badge.svg?branch=main)](https://coveralls.io/github/twenty-org/twenty?branch=main)

## Overview

The TRIB (Twenty Record Integration Bridge) Messages Module provides the foundation for integrating messaging functionality with the Twenty CRM system. This package contains core constants, utilities, and type definitions for the TRIB messaging system.

## Features

- **UUID Generation**: Create TRIB-compatible UUIDs following the `20202020-XXXX` pattern
- **Standard Object IDs**: Pre-defined constants for common messaging objects
- **Type Safety**: Full TypeScript support with exported types
- **Immutable Constants**: Frozen object constants prevent accidental modifications
- **Validation**: Built-in validation for TRIB UUID format and standard object IDs

## Installation

```bash
npm install @twenty/trib-messages-module
# or
yarn add @twenty/trib-messages-module
```

## Usage

### Basic UUID Generation

```typescript
import { generateTribUuid, isValidTribUuid, parseTribUuid } from '@twenty/trib-messages-module';

// Generate a new TRIB UUID
const uuid = generateTribUuid('MSG', 1);
console.log(uuid); // "20202020-MSG0-0001-A3B4-C5D6E7F8G9H0"

// Validate a TRIB UUID
const isValid = isValidTribUuid(uuid);
console.log(isValid); // true

// Parse a TRIB UUID
const parsed = parseTribUuid(uuid);
console.log(parsed); // { category: 'MSG', index: 1 }
```

### Standard Object IDs

```typescript
import { 
  TRIB_MESSAGE_OBJECT_IDS, 
  TRIB_CONTACT_OBJECT_IDS,
  getTribObjectId,
  isValidTribStandardObjectId
} from '@twenty/trib-messages-module';

// Use pre-defined object IDs
const smsMessageId = TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE;
const contactPersonId = TRIB_CONTACT_OBJECT_IDS.CONTACT_PERSON;

// Get object ID by name
const emailMessageId = getTribObjectId('EMAIL_MESSAGE');

// Validate standard object IDs
const isStandardId = isValidTribStandardObjectId(smsMessageId);
console.log(isStandardId); // true
```

### TypeScript Types

```typescript
import type { 
  TribMessageObjectId, 
  TribContactObjectId, 
  TribStandardObjectId 
} from '@twenty/trib-messages-module';

function processSmsMessage(messageId: TribMessageObjectId) {
  // Your message processing logic here
}

function processContact(contactId: TribContactObjectId) {
  // Your contact processing logic here
}
```

## API Reference

### Functions

#### `generateTribUuid(category: string, index: number): string`
Generates a TRIB-compatible UUID with the specified category and index.

**Parameters:**
- `category`: Category identifier (e.g., 'MSG', 'CNT', 'USR')
- `index`: Index number (0-9999)

**Returns:** Formatted UUID string

#### `isValidTribUuid(uuid: string): boolean`
Validates if a UUID follows the TRIB pattern.

#### `parseTribUuid(uuid: string): { category: string; index: number } | null`
Extracts category and index from a TRIB UUID.

#### `getTribObjectId(objectName: string): string`
Gets a standard object ID by name.

#### `isValidTribStandardObjectId(id: string): boolean`
Validates if an ID is a valid TRIB standard object ID.

### Constants

#### Message Object IDs
- `SMS_MESSAGE`
- `EMAIL_MESSAGE`
- `WHATSAPP_MESSAGE`
- `MESSAGE_THREAD`
- `MESSAGE_TEMPLATE`
- `MESSAGE_ATTACHMENT`

#### Contact Object IDs
- `CONTACT_PERSON`
- `CONTACT_COMPANY`
- `CONTACT_PHONE`
- `CONTACT_EMAIL`
- `CONTACT_ADDRESS`

#### Integration Object IDs
- `API_INTEGRATION`
- `WEBHOOK_INTEGRATION`
- `CALENDAR_INTEGRATION`
- `EMAIL_PROVIDER_INTEGRATION`
- `SMS_PROVIDER_INTEGRATION`

#### Workflow Object IDs
- `WORKFLOW_DEFINITION`
- `WORKFLOW_EXECUTION`
- `WORKFLOW_STEP`
- `WORKFLOW_TRIGGER`
- `WORKFLOW_ACTION`

#### System Object IDs
- `USER`
- `ROLE`
- `PERMISSION`
- `WORKSPACE`
- `WORKSPACE_MEMBER`
- `AUDIT_LOG`
- `CONFIGURATION`

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Format code
npm run format
```

### Testing

The package includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Package Structure

```
src/
├── constants/
│   └── trib-standard-object-ids.ts    # Standard object ID constants
├── utils/
│   └── uuid-generator.ts              # UUID generation utilities
├── __tests__/
│   ├── index.test.ts                  # Package integration tests
│   ├── trib-standard-object-ids.test.ts # Object ID tests
│   └── uuid-generator.test.ts         # UUID utility tests
└── index.ts                           # Main package exports
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue on the [Twenty GitHub repository](https://github.com/twenty-org/twenty).