import chalk from 'chalk';
import { HubSpotClient } from './hubspot-client';
import { formatSchema, formatSchemasTable, formatCommonErrors, isPortalScoped } from './utils';

/**
 * List all schemas command
 */
export async function listSchemasCommand(options: { verbose?: boolean; filter?: string }) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(1);
  }

  try {
    const client = new HubSpotClient(accessToken);
    console.log(chalk.blue('Fetching schemas from HubSpot...'));
    
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
      console.log(chalk.yellow('No schemas found matching the filter.'));
      return;
    }

    if (options.verbose) {
      // Verbose mode: show detailed information for each schema
      filteredSchemas.forEach((schema) => {
        console.log(formatSchema(schema, true));
      });
    } else {
      // Table mode: show summary table
      console.log(formatSchemasTable(filteredSchemas));
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

/**
 * Inspect a specific object type command
 */
export async function inspectObjectCommand(objectType: string, options: { properties?: boolean }) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(1);
  }

  try {
    const client = new HubSpotClient(accessToken);
    console.log(chalk.blue(`Fetching schema for "${objectType}"...`));
    
    const schema = await client.getSchema(objectType);
    
    // Show detailed schema information
    console.log(formatSchema(schema, true));
    
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
    
    // CRM v4 API path
    console.log(chalk.bold('\nCRM v4 API Paths:'));
    console.log(chalk.gray(`  Objects: ${chalk.white(`/crm/v3/objects/${schema.name}`)}`));
    console.log(chalk.gray(`  Associations: ${chalk.white(`/crm/v4/associations/${schema.name}/{toObjectType}/batch/create`)}`));
    console.log('');
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

/**
 * Inspect associations between two object types
 */
export async function inspectAssociationsCommand(
  fromObject: string,
  toObject: string,
  options: { verify?: boolean }
) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(1);
  }

  try {
    const client = new HubSpotClient(accessToken);
    
    // Verify the association path
    console.log(chalk.blue(`Checking associations from "${fromObject}" to "${toObject}"...`));
    
    const result = await client.verifyAssociationPath(fromObject, toObject);
    
    console.log(chalk.bold('\nAssociation Path:'));
    console.log(chalk.gray(`  ${result.path}`));
    console.log('');
    
    if (result.valid) {
      console.log(chalk.green('✓ Valid association path'));
      console.log('');
      
      if (result.associationTypes && result.associationTypes.results) {
        if (result.associationTypes.results.length > 0) {
          console.log(chalk.bold('Available Association Types:'));
          console.log(chalk.gray('-'.repeat(80)));
          
          result.associationTypes.results.forEach((assoc) => {
            console.log(chalk.white(`  ${assoc.name || 'Unnamed'}`));
            console.log(chalk.gray(`    Association Type ID: ${assoc.associationTypeId}`));
            console.log(chalk.gray(`    Category: ${assoc.associationCategory}`));
            console.log('');
          });
          
          console.log(chalk.bold('Usage Example:'));
          console.log(chalk.gray('  POST ' + chalk.white(`/crm/v4/associations/${fromObject}/${toObject}/batch/create`)));
          console.log(chalk.gray('  Body: {'));
          console.log(chalk.gray('    "inputs": [{'));
          console.log(chalk.gray(`      "from": { "id": "123" },`));
          console.log(chalk.gray(`      "to": { "id": "456" },`));
          console.log(chalk.gray(`      "types": [{ "associationTypeId": ${result.associationTypes.results[0].associationTypeId}, "associationCategory": "${result.associationTypes.results[0].associationCategory}" }]`));
          console.log(chalk.gray('    }]'));
          console.log(chalk.gray('  }'));
          console.log('');
        } else {
          console.log(chalk.yellow('No association types defined between these objects.'));
          console.log(chalk.gray('You may need to create a custom association definition first.'));
          console.log('');
        }
      }
    } else {
      console.log(chalk.red('✗ Invalid association path'));
      console.log(chalk.yellow(`  ${result.error}`));
      console.log('');
      
      console.log(chalk.bold('Troubleshooting:'));
      console.log(chalk.gray('  1. Verify object type names with: hubspot-inspector schemas'));
      console.log(chalk.gray('  2. Check if both objects exist in your portal'));
      console.log(chalk.gray('  3. Ensure association definition exists between these object types'));
      console.log('');
    }
    
    // Show common errors if requested
    if (options.verify) {
      console.log(formatCommonErrors());
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
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
export async function listCustomObjectsCommand() {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error(chalk.red('Error: HUBSPOT_ACCESS_TOKEN environment variable is required'));
    console.error(chalk.gray('Set it with: export HUBSPOT_ACCESS_TOKEN=your_token_here'));
    process.exit(1);
  }

  try {
    const client = new HubSpotClient(accessToken);
    console.log(chalk.blue('Fetching custom objects from HubSpot...'));
    
    const schemas = await client.getSchemas();
    const customObjects = schemas.filter(isPortalScoped);
    
    if (customObjects.length === 0) {
      console.log(chalk.yellow('No custom objects found in this portal.'));
      return;
    }
    
    console.log(chalk.bold(`\n${customObjects.length} Custom Objects Found:`));
    console.log(chalk.gray('='.repeat(80)));
    
    customObjects.forEach((schema) => {
      console.log(formatSchema(schema, true));
    });
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
