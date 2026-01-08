# HubSpot Schema Inspector

A standalone diagnostic CLI tool for inspecting HubSpot CRM schemas, object types, and associations. Helps developers verify internal object names, understand association models, and generate correct CRM v4 API paths to debug 400/500 errors.

## Features

- 📋 **List all CRM object types** with internal names, IDs, and labels
- 🔍 **Inspect specific objects** in detail, including properties
- 🔗 **Verify association paths** between any two object types
- 🎯 **Detect portal-scoped objects** (custom objects)
- 📚 **Document common errors** and their solutions for HubSpot API 400/500 errors
- ✅ **Validate CRM v4 API paths** before making API calls

## Installation

```bash
npm install -g hubspot-schema-inspector
```

Or use directly with npx:

```bash
npx hubspot-schema-inspector schemas
```

## Prerequisites

You need a HubSpot Private App access token with the following scopes:
- `crm.schemas.read`
- `crm.objects.read` (optional, for additional features)

[Create a Private App in HubSpot](https://developers.hubspot.com/docs/api/private-apps)

## Environment Variables

### ✅ Required: `HUBSPOT_ACCESS_TOKEN`

**What it is:**
A Private App access token from HubSpot.

**Why it's required:**
Authenticates all calls to:
- `/crm/v3/schemas`
- `/crm/v4/associations`
- `/crm/v3/objects/*`

Needed to inspect object types, internal names, IDs, and associations.

## Usage

### Set your access token

```bash
export HUBSPOT_ACCESS_TOKEN=your_access_token_here
```

### CLI Name & Entrypoint

The binary name is:

```
hubspot-crm
```

### Core Command Structure

```
hubspot-crm <command> [options]
```

### Commands

#### 🔍 schemas — Inspect all objects

```bash
hubspot-crm schemas
```

**Purpose:** Fetch `/crm/v3/schemas`, print all CRM objects, and reveal real internal names.

**Options:**
- `--json` - Machine-readable output
- `--quiet` - Suppress headers
- `--verbose` - Show raw API paths
- `-f, --filter <pattern>` - Filter schemas by name or label

**Example Output:**
```
Found 18 CRM objects

contacts               (0-1)
companies              (0-2)
deals                  (0-3)
p45060878_listings     (2-123456)  ← portal-scoped
tickets                (0-5)
```

#### 🔎 object — Inspect a single object deeply

```bash
hubspot-crm object <objectName>
```

**Examples:**
```bash
hubspot-crm object listings
hubspot-crm object p45060878_listings
hubspot-crm object contacts
```

**Purpose:** Show schema details, labels, object type ID, whether it's portal-scoped, and associations defined on it.

**Options:**
- `--json` - Machine-readable output
- `--quiet` - Suppress headers
- `--verbose` - Show raw API paths
- `-p, --properties` - Show all properties for the object

**Example Output:**
```
Object: Listings
Internal name: p45060878_listings
ObjectTypeId: 2-123456
Scope: portal-scoped

Associations:
- contacts (1-to-many)
- companies (many-to-many)
```

#### 🔗 associations — List associations between two objects

```bash
hubspot-crm associations <objectA> <objectB>
```

**Examples:**
```bash
hubspot-crm associations contacts listings
hubspot-crm associations deals companies
```

**Purpose:** Call `/crm/v4/associations/{A}/{B}/types`, list valid association definitions, and show cardinality + IDs.

**Options:**
- `--verify` - Verify if you can safely associate these two objects via the CRM v4 API
- `--json` - Machine-readable output
- `--quiet` - Suppress headers
- `--verbose` - Show raw API paths

**Example Output:**
```
Associations between contacts ↔ listings:

- ID: 512
  Category: HUBSPOT_DEFINED
  Label: (default)
```

#### ⭐ verify — The power feature

```bash
hubspot-crm verify <objectA> <objectB>
```

Or use with associations:
```bash
hubspot-crm associations <objectA> <objectB> --verify
```

**What --verify does:**

It answers one question: "Can I safely associate these two objects via the CRM v4 API, and how?"

**Verification steps:**
1. Confirm both objects exist
2. Confirm association definition exists
3. Detect portal-scoped names
4. Determine safe API strategy
5. Warn about known failure cases
6. Output exact API paths

**Example: Contacts ↔ Listings**
```bash
hubspot-crm verify contacts listings
```

**Output:**
```
✔ Object contacts exists
✔ Object p45060878_listings exists
✔ Association defined (1-to-many)

Recommended API usage:
✓ Use batch association endpoint (more reliable)

POST /crm/v4/associations/contacts/p45060878_listings/batch/create
{
  "inputs": [
    { "from": { "id": "<CONTACT_ID>" }, "to": { "id": "<LISTING_ID>" } }
  ]
}

Warnings:
⚠ UI label "Listings" differs from API object name
⚠ Single PUT association endpoint may return 500 in sandbox
```

**Example: Invalid pair**
```bash
hubspot-crm verify tickets listings
```

**Output:**
```
✖ No association defined between tickets and listings

Result:
Association is NOT supported via API
```

Exit code: 1

#### custom — List custom objects

Show only portal-scoped (custom) objects:

```bash
hubspot-crm custom
```

**Options:**
- `--json` - Machine-readable output
- `--quiet` - Suppress headers
- `--verbose` - Show raw API paths

#### errors — Show common errors

Display documentation for common HubSpot API errors:

```bash
hubspot-crm errors
```

### Optional Flags

| Flag | Purpose |
|------|---------|
| `--json` | Machine-readable output |
| `--quiet` | Suppress headers |
| `--verbose` | Show raw API paths |

**Example:**
```bash
hubspot-crm verify contacts listings --json
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Verification passed |
| 1 | Association invalid |
| 2 | Object not found |
| 3 | HubSpot API error |

## Common Use Cases

### Debugging 400 Errors

If you're getting 400 errors when creating associations:

1. Verify object type names are correct:
   ```bash
   hubspot-crm schemas
   ```

2. Check the association path:
   ```bash
   hubspot-crm associations contacts companies
   ```

3. Get the correct association type ID from the output

### Working with Custom Objects

Custom objects have special naming conventions in HubSpot:

1. List all custom objects:
   ```bash
   hubspot-crm custom
   ```

2. Inspect a custom object to get its exact internal name:
   ```bash
   hubspot-crm object p12345_cars
   ```

3. Verify associations between custom objects:
   ```bash
   hubspot-crm associations p12345_cars p12345_dealerships
   ```

### Verifying API Paths

Before making CRM v4 API calls, verify the paths:

```bash
hubspot-crm verify contacts deals
```

This shows you the exact path and request body format to use.

## API Documentation

This tool uses the following HubSpot APIs:
- [CRM Schemas API (v3)](https://developers.hubspot.com/docs/api/crm/crm-custom-objects)
- [CRM Associations API (v4)](https://developers.hubspot.com/docs/api/crm/associations)

Internally you'll only need:
- `/crm/v3/schemas`
- `/crm/v4/associations/{A}/{B}/types`

## The Mental Model

- **schemas** → What objects exist
- **object** → What is this object really
- **associations** → What relationships exist
- **verify** → Can I safely use the API, and how

This turns tribal HubSpot knowledge into deterministic answers.

## Development

### Setup

```bash
git clone https://github.com/closespark/hubspot-schema-inspector.git
cd hubspot-schema-inspector
npm install
```

### Build

```bash
npm run build
```

### Run locally

```bash
export HUBSPOT_ACCESS_TOKEN=your_token
npm run dev schemas
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
- GitHub Issues: https://github.com/closespark/hubspot-schema-inspector/issues
- HubSpot Developer Documentation: https://developers.hubspot.com/docs
