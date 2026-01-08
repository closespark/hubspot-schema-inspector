# HubSpot Schema Inspector - Usage Examples

This document provides examples of using the HubSpot Schema Inspector CLI tool.

## Setup

First, set your HubSpot access token:

```bash
export HUBSPOT_ACCESS_TOKEN=your_private_app_token_here
```

## Example 1: List All Schemas

View all CRM object types in a table format:

```bash
hubspot-inspector schemas
```

Expected output shows all object types with their internal names, IDs, and labels, distinguishing between standard HubSpot objects and custom portal-scoped objects.

## Example 2: Filter Schemas

Find all contact-related objects:

```bash
hubspot-inspector schemas --filter contact
```

## Example 3: Detailed Schema Information

Get verbose information about all schemas:

```bash
hubspot-inspector schemas --verbose
```

## Example 4: Inspect a Specific Object

View detailed information about the contacts object:

```bash
hubspot-inspector object contacts
```

This shows:
- Internal name
- Object type ID
- Labels (singular/plural)
- Primary display property
- Required properties
- CRM v4 API paths

## Example 5: View Object Properties

List all properties for an object:

```bash
hubspot-inspector object contacts --properties
```

This displays all properties with their types, labels, and whether they're HubSpot-defined or custom.

## Example 6: Verify Association Path

Check if associations exist between contacts and companies:

```bash
hubspot-inspector associations contacts companies
```

This shows:
- Whether the association path is valid
- Available association types
- Association type IDs and categories
- Example API request body

## Example 7: Association with Error Documentation

Verify associations and see common error documentation:

```bash
hubspot-inspector associations contacts deals --verify
```

## Example 8: List Custom Objects Only

View only portal-scoped (custom) objects:

```bash
hubspot-inspector custom
```

This is useful for identifying custom objects that require special naming conventions (e.g., "p12345_objectname").

## Example 9: View Error Documentation

Display common HubSpot API errors and their solutions:

```bash
hubspot-inspector errors
```

This command doesn't require a HubSpot token and shows:
- HTTP 400 errors (Bad Request)
- HTTP 404 errors (Not Found)
- HTTP 500 errors (Internal Server Error)
- Common causes and solutions for each

## Common Workflows

### Debugging Association Errors

1. First, list all schemas to verify object names:
   ```bash
   hubspot-inspector schemas
   ```

2. Verify the association path between two objects:
   ```bash
   hubspot-inspector associations contacts companies
   ```

3. Use the association type ID from the output in your API calls

### Working with Custom Objects

1. List all custom objects:
   ```bash
   hubspot-inspector custom
   ```

2. Inspect a custom object to get its exact internal name:
   ```bash
   hubspot-inspector object p12345_cars
   ```

3. Verify associations work with custom objects:
   ```bash
   hubspot-inspector associations p12345_cars companies
   ```

## Troubleshooting

If you get authentication errors:
- Verify your HUBSPOT_ACCESS_TOKEN is set correctly
- Ensure your private app has the `crm.schemas.read` scope
- Check that your token hasn't expired

If you get "object not found" errors:
- Use `hubspot-inspector schemas` to see all available objects
- Verify you're using the internal name, not the label
- For custom objects, ensure you include the portal prefix

## Additional Resources

- HubSpot Developer Documentation: https://developers.hubspot.com/docs
- CRM Schemas API: https://developers.hubspot.com/docs/api/crm/crm-custom-objects
- CRM Associations API v4: https://developers.hubspot.com/docs/api/crm/associations
