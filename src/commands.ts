import chalk from 'chalk';
import { HubSpotClient } from './hubspot-client';
import { formatSchema, formatSchemasTable, formatSchemasSimple, formatObjectDetails, formatAssociationsList, formatVerifyOutput, formatCommonErrors, isPortalScoped } from './utils';
import { HubSpotSchema } from './types';

// Exit codes as per specification
const EXIT_CODES = {
  SUCCESS: 0,
  ASSOCIATION_INVALID: 1,
  OBJECT_NOT_FOUND: 2,
  API_ERROR: 3,
};

interface CommandOptions {
  json?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  filter?: string;
  properties?: boolean;
  verify?: boolean;
}

/**
 * List all schemas command
 */
export async function listSchemasCommand(options: CommandOptions) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(EXIT_CODES.API_ERROR);
  }

  try {
    const client = new HubSpotClient(accessToken);
    if (!options.quiet && !options.json) {
      console.log(chalk.blue('Fetching schemas from HubSpot...'));
    }
    
    const schemas = await client.getSchemas();
    
    // Apply filter if provided
    let filteredSchemas = schemas;
    if (options.filter) {
      const filterLower = options.filter.toLowerCase();
      filteredSchemas = schemas.filter(
        (s) =>
          s.name.toLowerCase().includes(filterLower) ||
          s.labels.singular.toLowerCase().includes(filterLower) ||
          s.labels.plural.toLowerCase().includes(filterLower)
      );
    }

    if (filteredSchemas.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ results: [], total: 0 }));
      } else {
        console.log(chalk.yellow('No schemas found matching the filter.'));
      }
      return;
    }

    if (options.json) {
      // JSON output
      const output = filteredSchemas.map((s) => ({
        name: s.name,
        objectTypeId: s.objectTypeId || s.id,
        label: s.labels.singular,
        isPortalScoped: isPortalScoped(s),
      }));
      console.log(JSON.stringify({ results: output, total: output.length }));
    } else {
      // Standard output matching spec format
      console.log(formatSchemasSimple(filteredSchemas, options.quiet));
    }
  } catch (error: any) {
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(EXIT_CODES.API_ERROR);
  }
}

/**
 * Inspect a specific object type command
 */
export async function inspectObjectCommand(objectType: string, options: CommandOptions) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(EXIT_CODES.API_ERROR);
  }

  try {
    const client = new HubSpotClient(accessToken);
    if (!options.quiet && !options.json) {
      console.log(chalk.blue(`Fetching schema for "${objectType}"...`));
    }
    
    const schema = await client.getSchema(objectType);
    
    if (options.json) {
      // JSON output
      const output = {
        name: schema.name,
        label: schema.labels.singular,
        objectTypeId: schema.objectTypeId || schema.id,
        isPortalScoped: isPortalScoped(schema),
        associations: schema.associations || [],
        ...(options.properties && schema.properties ? { properties: schema.properties } : {}),
      };
      console.log(JSON.stringify(output));
    } else {
      // Standard output matching spec format
      console.log(formatObjectDetails(schema, options.quiet, options.verbose));
      
      // Show properties if requested
      if (options.properties && schema.properties) {
        console.log(chalk.bold('\nProperties:'));
        console.log(chalk.gray('-'.repeat(80)));
        
        const sorted = [...schema.properties].sort((a, b) => a.name.localeCompare(b.name));
        
        sorted.forEach((prop) => {
          const hubspotDefined = prop.hubspotDefined ? chalk.blue('[HS]') : chalk.yellow('[CUSTOM]');
          console.log(`  ${hubspotDefined} ${chalk.white(prop.name)}`);
          console.log(chalk.gray(`      Label: ${prop.label}`));
          console.log(chalk.gray(`      Type: ${prop.type} (${prop.fieldType})`));
          if (prop.description) {
            console.log(chalk.gray(`      Description: ${prop.description}`));
          }
          console.log('');
        });
      }
    }
  } catch (error: any) {
    const isNotFound = error.message.includes('404');
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(isNotFound ? EXIT_CODES.OBJECT_NOT_FOUND : EXIT_CODES.API_ERROR);
  }
}

/**
 * Inspect associations between two object types
 */
export async function inspectAssociationsCommand(
  objectA: string,
  objectB: string,
  options: CommandOptions
) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(EXIT_CODES.API_ERROR);
  }

  // If --verify flag is set, delegate to verifyAssociationsCommand
  if (options.verify) {
    return verifyAssociationsCommand(objectA, objectB, options);
  }

  try {
    const client = new HubSpotClient(accessToken);
    
    if (!options.quiet && !options.json) {
      console.log(chalk.blue(`Checking associations from "${objectA}" to "${objectB}"...`));
    }
    
    const result = await client.verifyAssociationPath(objectA, objectB);
    
    if (options.json) {
      console.log(JSON.stringify({
        objectA,
        objectB,
        valid: result.valid,
        path: result.path,
        associationTypes: result.associationTypes?.results || [],
        error: result.error,
      }));
      if (!result.valid) {
        process.exit(EXIT_CODES.ASSOCIATION_INVALID);
      }
      return;
    }
    
    console.log(formatAssociationsList(objectA, objectB, result, options.quiet, options.verbose));
    
    if (!result.valid) {
      process.exit(EXIT_CODES.ASSOCIATION_INVALID);
    }
  } catch (error: any) {
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(EXIT_CODES.API_ERROR);
  }
}

/**
 * Verify associations between two objects - the power feature
 * Answers: "Can I safely associate these two objects via the CRM v4 API, and how?"
 * 
 * Read-only verification logic:
 * 1. Try schema lookup - if found, it's a custom object
 * 2. If not in schemas, probe objects API - if 200, it's a standard object
 * 3. Only after both exist, check associations via GET /crm/v4/associations/{A}/{B}/types
 * 
 * No POST, no mutation, no assumptions.
 */
export async function verifyAssociationsCommand(
  objectA: string,
  objectB: string,
  options: CommandOptions
) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(EXIT_CODES.API_ERROR);
  }

  try {
    const client = new HubSpotClient(accessToken);
    
    // Step 1: Fetch all schemas (for custom objects discovery)
    const schemas = await client.getSchemas();
    
    // Step 2: Check object A existence
    // First try schema lookup (custom objects are only discoverable via schemas)
    let schemaA = findSchemaByNameOrLabel(schemas, objectA);
    let objectAExists = schemaA !== null;
    let verifiedViaA: 'schemas' | 'objects' = 'schemas';
    
    // If not found in schemas, try probing the objects API (for standard objects)
    if (!objectAExists) {
      const probeResultA = await client.objectExists(objectA);
      objectAExists = probeResultA.exists;
      verifiedViaA = 'objects';
    }
    
    // Step 3: Check object B existence
    let schemaB = findSchemaByNameOrLabel(schemas, objectB);
    let objectBExists = schemaB !== null;
    let verifiedViaB: 'schemas' | 'objects' = 'schemas';
    
    if (!objectBExists) {
      const probeResultB = await client.objectExists(objectB);
      objectBExists = probeResultB.exists;
      verifiedViaB = 'objects';
    }
    
    // Get the actual internal names
    const internalNameA = schemaA?.name || objectA;
    const internalNameB = schemaB?.name || objectB;
    
    // Step 4: Only check association definition after BOTH objects exist
    let associationResult = null;
    let associationExists = false;
    let cardinality = '';
    
    if (objectAExists && objectBExists) {
      // GET /crm/v4/associations/{A}/{B}/types
      associationResult = await client.verifyAssociationPath(internalNameA, internalNameB);
      associationExists = associationResult.valid && 
        (associationResult.associationTypes?.results?.length ?? 0) > 0;
      
      if (associationExists && associationResult.associationTypes?.results) {
        // Try to determine cardinality from association types
        const firstAssoc = associationResult.associationTypes.results[0];
        if (firstAssoc.name) {
          cardinality = firstAssoc.name;
        }
      }
    }
    
    // Detect portal-scoped names
    const isAPortalScoped = schemaA ? isPortalScoped(schemaA) : false;
    const isBPortalScoped = schemaB ? isPortalScoped(schemaB) : false;
    const labelDiffersA = schemaA && objectA !== schemaA.name && objectA === schemaA.labels.singular.toLowerCase();
    const labelDiffersB = schemaB && objectB !== schemaB.name && objectB === schemaB.labels.singular.toLowerCase();
    
    if (options.json) {
      const output = {
        objectA: {
          input: objectA,
          internalName: internalNameA,
          exists: objectAExists,
          verifiedVia: verifiedViaA,
          isPortalScoped: isAPortalScoped,
        },
        objectB: {
          input: objectB,
          internalName: internalNameB,
          exists: objectBExists,
          verifiedVia: verifiedViaB,
          isPortalScoped: isBPortalScoped,
        },
        association: {
          defined: associationExists,
          cardinality: cardinality || null,
          types: associationResult?.associationTypes?.results || [],
        },
        recommendedApiPath: associationExists 
          ? `POST /crm/v4/associations/${internalNameA}/${internalNameB}/batch/create`
          : null,
        valid: objectAExists && objectBExists && associationExists,
        writeOperationsPerformed: false,
      };
      console.log(JSON.stringify(output));
      
      if (!objectAExists || !objectBExists) {
        process.exit(EXIT_CODES.OBJECT_NOT_FOUND);
      }
      if (!associationExists) {
        process.exit(EXIT_CODES.ASSOCIATION_INVALID);
      }
      return;
    }
    
    // Standard output
    console.log(formatVerifyOutput({
      objectA,
      objectB,
      internalNameA,
      internalNameB,
      objectAExists,
      objectBExists,
      verifiedViaA,
      verifiedViaB,
      associationExists,
      cardinality,
      isAPortalScoped,
      isBPortalScoped,
      labelDiffersA: labelDiffersA || false,
      labelDiffersB: labelDiffersB || false,
      associationTypes: associationResult?.associationTypes?.results || [],
    }, options.quiet, options.verbose));
    
    if (!objectAExists || !objectBExists) {
      process.exit(EXIT_CODES.OBJECT_NOT_FOUND);
    }
    if (!associationExists) {
      process.exit(EXIT_CODES.ASSOCIATION_INVALID);
    }
  } catch (error: any) {
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(EXIT_CODES.API_ERROR);
  }
}

/**
 * Find a schema by name or label (case-insensitive)
 */
function findSchemaByNameOrLabel(schemas: HubSpotSchema[], nameOrLabel: string): HubSpotSchema | null {
  const lower = nameOrLabel.toLowerCase();
  
  // First try exact name match
  let schema = schemas.find((s) => s.name.toLowerCase() === lower);
  if (schema) return schema;
  
  // Then try label match
  schema = schemas.find(
    (s) => 
      s.labels.singular.toLowerCase() === lower ||
      s.labels.plural.toLowerCase() === lower
  );
  if (schema) return schema;
  
  // Finally try partial name match
  schema = schemas.find((s) => s.name.toLowerCase().includes(lower));
  
  return schema || null;
}

/**
 * Show common errors documentation
 */
export async function showErrorsCommand() {
  console.log(formatCommonErrors());
}

/**
 * Show portal-scoped (custom) objects
 */
export async function listCustomObjectsCommand(options: CommandOptions = {}) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(EXIT_CODES.API_ERROR);
  }

  try {
    const client = new HubSpotClient(accessToken);
    if (!options.quiet && !options.json) {
      console.log(chalk.blue('Fetching custom objects from HubSpot...'));
    }
    
    const schemas = await client.getSchemas();
    const customObjects = schemas.filter(isPortalScoped);
    
    if (customObjects.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ results: [], total: 0 }));
      } else {
        console.log(chalk.yellow('No custom objects found in this portal.'));
      }
      return;
    }
    
    if (options.json) {
      const output = customObjects.map((s) => ({
        name: s.name,
        objectTypeId: s.objectTypeId || s.id,
        label: s.labels.singular,
      }));
      console.log(JSON.stringify({ results: output, total: output.length }));
    } else {
      console.log(chalk.bold(`\n${customObjects.length} Custom Objects Found:`));
      console.log(chalk.gray('='.repeat(80)));
      
      customObjects.forEach((schema) => {
        console.log(formatSchema(schema, true));
      });
    }
  } catch (error: any) {
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(EXIT_CODES.API_ERROR);
  }
}
