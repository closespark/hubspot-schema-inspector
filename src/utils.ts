import chalk from 'chalk';
import { HubSpotSchema } from './types';

/**
 * Determine if a schema represents a portal-scoped (custom) object
 */
export function isPortalScoped(schema: HubSpotSchema): boolean {
  // Portal-scoped objects typically have:
  // 1. A metaType of "PORTAL_SPECIFIC" or similar
  // 2. An objectTypeId that starts with "2-" (custom objects)
  // 3. A fullyQualifiedName that contains "p" followed by portal ID
  
  if (schema.metaType === 'PORTAL_SPECIFIC') {
    return true;
  }

  if (schema.objectTypeId && schema.objectTypeId.startsWith('2-')) {
    return true;
  }

  if (schema.fullyQualifiedName && schema.fullyQualifiedName.startsWith('p')) {
    return true;
  }

  // Standard HubSpot objects typically have well-known names
  const standardObjects = [
    'contacts',
    'companies',
    'deals',
    'tickets',
    'products',
    'line_items',
    'quotes',
    'calls',
    'emails',
    'meetings',
    'notes',
    'tasks',
    'communications',
    'postal_mail',
    'marketing_events',
    'feedback_submissions',
    'goals',
    'invoices',
    'subscriptions',
    'taxes',
    'discounts',
    'fees',
  ];

  return !standardObjects.includes(schema.name);
}

/**
 * Format a schema for display
 */
export function formatSchema(schema: HubSpotSchema, verbose: boolean = false): string {
  const parts: string[] = [];
  
  // Header
  const portalScoped = isPortalScoped(schema);
  const badge = portalScoped ? chalk.yellow('[CUSTOM]') : chalk.blue('[STANDARD]');
  parts.push(chalk.bold(`\n${badge} ${schema.labels.singular} (${schema.labels.plural})`));
  
  // Basic info
  parts.push(chalk.gray(`  Internal Name: ${chalk.white(schema.name)}`));
  parts.push(chalk.gray(`  Object Type ID: ${chalk.white(schema.objectTypeId || schema.id)}`));
  
  if (schema.fullyQualifiedName) {
    parts.push(chalk.gray(`  Fully Qualified: ${chalk.white(schema.fullyQualifiedName)}`));
  }
  
  parts.push(chalk.gray(`  Meta Type: ${chalk.white(schema.metaType)}`));
  
  if (verbose) {
    if (schema.primaryDisplayProperty) {
      parts.push(chalk.gray(`  Primary Display: ${chalk.white(schema.primaryDisplayProperty)}`));
    }
    
    if (schema.requiredProperties && schema.requiredProperties.length > 0) {
      parts.push(chalk.gray(`  Required Properties: ${chalk.white(schema.requiredProperties.join(', '))}`));
    }
    
    if (schema.createdAt) {
      parts.push(chalk.gray(`  Created: ${chalk.white(new Date(schema.createdAt).toLocaleString())}`));
    }
    
    if (schema.archived) {
      parts.push(chalk.red(`  Status: ARCHIVED`));
    }
  }
  
  return parts.join('\n');
}

/**
 * Format schemas as a table
 */
export function formatSchemasTable(schemas: HubSpotSchema[]): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('\n' + '='.repeat(100)));
  lines.push(chalk.bold('HubSpot CRM Object Types'));
  lines.push(chalk.bold('='.repeat(100)));
  
  // Sort: standard objects first, then custom objects
  const sorted = [...schemas].sort((a, b) => {
    const aCustom = isPortalScoped(a);
    const bCustom = isPortalScoped(b);
    
    if (aCustom !== bCustom) {
      return aCustom ? 1 : -1;
    }
    
    return a.name.localeCompare(b.name);
  });
  
  // Header
  const header = `${'TYPE'.padEnd(10)} ${'INTERNAL NAME'.padEnd(25)} ${'ID'.padEnd(15)} ${'LABEL'.padEnd(30)}`;
  lines.push(chalk.bold(header));
  lines.push('-'.repeat(100));
  
  // Rows
  for (const schema of sorted) {
    const type = isPortalScoped(schema) 
      ? chalk.yellow('CUSTOM')
      : chalk.blue('STANDARD');
    
    const name = schema.name.padEnd(25).substring(0, 25);
    const id = (schema.objectTypeId || schema.id).padEnd(15).substring(0, 15);
    const label = schema.labels.singular.padEnd(30).substring(0, 30);
    
    lines.push(`${type.padEnd(18)} ${name} ${id} ${label}`);
  }
  
  lines.push('-'.repeat(100));
  lines.push(chalk.gray(`Total: ${schemas.length} object types (${sorted.filter(s => !isPortalScoped(s)).length} standard, ${sorted.filter(s => isPortalScoped(s)).length} custom)`));
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Common HubSpot Association API errors and their causes
 */
export const COMMON_ERRORS = {
  '400': [
    {
      cause: 'Invalid object type name',
      solution: 'Use the internal object name (e.g., "contacts" not "contact"). Run `hubspot-inspector schemas` to see all valid names.',
    },
    {
      cause: 'Incorrect association type ID',
      solution: 'Use `hubspot-inspector associations <fromObject> <toObject>` to get valid association type IDs.',
    },
    {
      cause: 'Missing required association label',
      solution: 'For custom associations, ensure you include the correct label name.',
    },
    {
      cause: 'Invalid object ID format',
      solution: 'Object IDs must be valid HubSpot record IDs (numeric strings).',
    },
  ],
  '404': [
    {
      cause: 'Object type does not exist',
      solution: 'Verify the object type exists using `hubspot-inspector schemas`.',
    },
    {
      cause: 'No association definition between objects',
      solution: 'Check available associations with `hubspot-inspector associations <fromObject> <toObject>`.',
    },
  ],
  '500': [
    {
      cause: 'Portal-scoped object name mismatch',
      solution: 'For custom objects, use the exact internal name including the portal prefix (e.g., "p12345_customobject").',
    },
    {
      cause: 'Association type ID collision',
      solution: 'Ensure you\'re using the correct association type ID for the direction (from -> to vs to -> from).',
    },
    {
      cause: 'API version mismatch',
      solution: 'Use v4 API for associations: /crm/v4/associations/{fromObjectType}/{toObjectType}/batch/create',
    },
  ],
};

/**
 * Format common errors for display
 */
export function formatCommonErrors(): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('\n' + '='.repeat(100)));
  lines.push(chalk.bold('Common HubSpot Association API Errors'));
  lines.push(chalk.bold('='.repeat(100)));
  
  for (const [code, errors] of Object.entries(COMMON_ERRORS)) {
    lines.push(chalk.bold(`\n${code === '400' ? chalk.yellow(`HTTP ${code} - Bad Request`) : code === '404' ? chalk.red(`HTTP ${code} - Not Found`) : chalk.red(`HTTP ${code} - Internal Server Error`)}`));
    lines.push('');
    
    errors.forEach((error, index) => {
      lines.push(chalk.gray(`  ${index + 1}. ${chalk.white('Cause:')} ${error.cause}`));
      lines.push(chalk.gray(`     ${chalk.green('Solution:')} ${error.solution}`));
      lines.push('');
    });
  }
  
  return lines.join('\n');
}
