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

## Usage

### Set your access token

```bash
export HUBSPOT_ACCESS_TOKEN=your_access_token_here
```

### Commands

#### List all schemas

List all CRM object types in your portal:

```bash
hubspot-inspector schemas
```

Show detailed information:

```bash
hubspot-inspector schemas --verbose
```

Filter by name or label:

```bash
hubspot-inspector schemas --filter contact
hubspot-inspector schemas --filter custom
```

**Example Output:**
```
====================================================================================================
HubSpot CRM Object Types
====================================================================================================
TYPE       INTERNAL NAME             ID              LABEL
----------------------------------------------------------------------------------------------------
STANDARD   calls                     0-48            Call
STANDARD   companies                 0-2             Company
STANDARD   contacts                  0-1             Contact
STANDARD   deals                     0-3             Deal
STANDARD   emails                    0-49            Email
CUSTOM     p12345_cars               2-12345678      Car
CUSTOM     p12345_dealerships        2-12345679      Dealership
----------------------------------------------------------------------------------------------------
Total: 7 object types (5 standard, 2 custom)
```

#### Inspect a specific object

Get detailed information about a specific object type:

```bash
hubspot-inspector object contacts
hubspot-inspector object companies
hubspot-inspector object p12345_cars
```

Include all properties:

```bash
hubspot-inspector object contacts --properties
```

**Example Output:**
```
[STANDARD] Contact (Contacts)
  Internal Name: contacts
  Object Type ID: 0-1
  Meta Type: STANDARD
  Primary Display: firstname
  Required Properties: email
  Created: 1/1/2020, 12:00:00 PM

CRM v4 API Paths:
  Objects: /crm/v3/objects/contacts
  Associations: /crm/v4/associations/contacts/{toObjectType}/batch/create
```

#### Inspect associations between objects

Verify association paths and get association type IDs:

```bash
hubspot-inspector associations contacts companies
hubspot-inspector associations contacts deals
hubspot-inspector associations p12345_cars p12345_dealerships
```

Show common error documentation:

```bash
hubspot-inspector associations contacts companies --verify
```

**Example Output:**
```
Association Path:
  /crm/v4/associations/contacts/companies/labels

✓ Valid association path

Available Association Types:
--------------------------------------------------------------------------------
  Primary
    Association Type ID: 1
    Category: HUBSPOT_DEFINED

  Unlabeled
    Association Type ID: 279
    Category: HUBSPOT_DEFINED

Usage Example:
  POST /crm/v4/associations/contacts/companies/batch/create
  Body: {
    "inputs": [{
      "from": { "id": "123" },
      "to": { "id": "456" },
      "types": [{ "associationTypeId": 1, "associationCategory": "HUBSPOT_DEFINED" }]
    }]
  }
```

#### List custom objects

Show only portal-scoped (custom) objects:

```bash
hubspot-inspector custom
```

#### Show common errors

Display documentation for common HubSpot API errors:

```bash
hubspot-inspector errors
```

**Example Output:**
```
====================================================================================================
Common HubSpot Association API Errors
====================================================================================================

HTTP 400 - Bad Request

  1. Cause: Invalid object type name
     Solution: Use the internal object name (e.g., "contacts" not "contact"). Run `hubspot-inspector schemas` to see all valid names.

  2. Cause: Incorrect association type ID
     Solution: Use `hubspot-inspector associations <fromObject> <toObject>` to get valid association type IDs.
...
```

## Common Use Cases

### Debugging 400 Errors

If you're getting 400 errors when creating associations:

1. Verify object type names are correct:
   ```bash
   hubspot-inspector schemas
   ```

2. Check the association path:
   ```bash
   hubspot-inspector associations contacts companies
   ```

3. Get the correct association type ID from the output

### Working with Custom Objects

Custom objects have special naming conventions in HubSpot:

1. List all custom objects:
   ```bash
   hubspot-inspector custom
   ```

2. Inspect a custom object to get its exact internal name:
   ```bash
   hubspot-inspector object p12345_cars
   ```

3. Verify associations between custom objects:
   ```bash
   hubspot-inspector associations p12345_cars p12345_dealerships
   ```

### Verifying API Paths

Before making CRM v4 API calls, verify the paths:

```bash
hubspot-inspector associations contacts deals
```

This shows you the exact path and request body format to use.

## API Documentation

This tool uses the following HubSpot APIs:
- [CRM Schemas API (v3)](https://developers.hubspot.com/docs/api/crm/crm-custom-objects)
- [CRM Associations API (v4)](https://developers.hubspot.com/docs/api/crm/associations)

## Common Errors and Solutions

### HTTP 400 - Bad Request

**Invalid object type name**
- **Cause**: Using incorrect object type name (e.g., "contact" instead of "contacts")
- **Solution**: Use `hubspot-inspector schemas` to get the correct internal name

**Incorrect association type ID**
- **Cause**: Using wrong association type ID or category
- **Solution**: Use `hubspot-inspector associations <from> <to>` to get valid IDs

### HTTP 404 - Not Found

**No association definition**
- **Cause**: No association exists between the two object types
- **Solution**: Create a custom association definition in HubSpot settings first

### HTTP 500 - Internal Server Error

**Portal-scoped object name mismatch**
- **Cause**: Custom object internal name doesn't match (missing portal prefix)
- **Solution**: Use `hubspot-inspector custom` to get the exact internal name with portal prefix

**Association type ID collision**
- **Cause**: Using association type ID for wrong direction
- **Solution**: Verify you're using the ID for the correct direction (from -> to)

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
