import chalk from 'chalk';
import { HubSpotSchema, AssociationDefinition } from './types';

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
 * Format schemas as a simple list (matching spec output format)
 */
export function formatSchemasSimple(schemas: HubSpotSchema[], quiet: boolean = false): string {
  const lines: string[] = [];
  
  // Sort: standard objects first, then custom objects
  const sorted = [...schemas].sort((a, b) => {
    const aCustom = isPortalScoped(a);
    const bCustom = isPortalScoped(b);
    
    if (aCustom !== bCustom) {
      return aCustom ? 1 : -1;
    }
    
    return a.name.localeCompare(b.name);
  });
  
  if (!quiet) {
    lines.push('');
    lines.push(`Found ${chalk.bold(schemas.length.toString())} CRM objects`);
    lines.push('');
  }
  
  // Output each object in the simple format: name (objectTypeId)
  for (const schema of sorted) {
    const objectTypeId = schema.objectTypeId || schema.id;
    const portalScoped = isPortalScoped(schema);
    const suffix = portalScoped ? chalk.yellow(' ← portal-scoped') : '';
    
    const namePadded = schema.name.padEnd(25);
    lines.push(`${namePadded} (${objectTypeId})${suffix}`);
  }
  
  lines.push('');
  
  return lines.join('\n');
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
 * Format object details (matching spec output format)
 */
export function formatObjectDetails(schema: HubSpotSchema, quiet: boolean = false, verbose: boolean = false): string {
  const lines: string[] = [];
  const portalScoped = isPortalScoped(schema);
  const scope = portalScoped ? 'portal-scoped' : 'standard';
  
  lines.push('');
  lines.push(`Object: ${chalk.bold(schema.labels.singular)}`);
  lines.push(`Internal name: ${chalk.white(schema.name)}`);
  lines.push(`ObjectTypeId: ${chalk.white(schema.objectTypeId || schema.id)}`);
  lines.push(`Scope: ${portalScoped ? chalk.yellow(scope) : chalk.blue(scope)}`);
  
  // Show associations if available
  if (schema.associations && schema.associations.length > 0) {
    lines.push('');
    lines.push(chalk.bold('Associations:'));
    schema.associations.forEach((assoc) => {
      lines.push(`- ${assoc.name || assoc.toObjectTypeId}`);
    });
  }
  
  if (verbose) {
    lines.push('');
    lines.push(chalk.bold('API Paths:'));
    lines.push(`  Objects: /crm/v3/objects/${schema.name}`);
    lines.push(`  Associations: /crm/v4/associations/${schema.name}/{toObjectType}/batch/create`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Format associations list (matching spec output format)
 */
export function formatAssociationsList(
  objectA: string,
  objectB: string,
  result: {
    valid: boolean;
    path: string;
    associationTypes?: { results: AssociationDefinition[] };
    error?: string;
  },
  quiet: boolean = false,
  verbose: boolean = false
): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push(`Associations between ${chalk.bold(objectA)} ↔ ${chalk.bold(objectB)}:`);
  lines.push('');
  
  if (!result.valid) {
    lines.push(chalk.red('✖ No association defined between these objects'));
    lines.push('');
    if (!quiet) {
      lines.push(chalk.bold('Troubleshooting:'));
      lines.push(chalk.gray('  1. Verify object type names with: hubspot-crm schemas'));
      lines.push(chalk.gray('  2. Check if both objects exist in your portal'));
      lines.push(chalk.gray('  3. Ensure association definition exists between these object types'));
      lines.push('');
    }
    return lines.join('\n');
  }
  
  if (result.associationTypes?.results && result.associationTypes.results.length > 0) {
    result.associationTypes.results.forEach((assoc) => {
      lines.push(`- ID: ${chalk.white(assoc.associationTypeId.toString())}`);
      lines.push(`  Category: ${chalk.white(assoc.associationCategory)}`);
      if (assoc.name) {
        lines.push(`  Label: ${chalk.white(assoc.name)}`);
      } else {
        lines.push(`  Label: ${chalk.gray('(default)')}`);
      }
      lines.push('');
    });
  } else {
    lines.push(chalk.yellow('No association types defined.'));
    lines.push('');
  }
  
  if (verbose) {
    lines.push(chalk.bold('API Path:'));
    lines.push(`  ${result.path}`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Format verify output (the power feature output)
 * Shows object existence with verification source (schemas API vs objects API)
 * and the recommended API path for associations.
 */
export function formatVerifyOutput(
  data: {
    objectA: string;
    objectB: string;
    internalNameA: string;
    internalNameB: string;
    objectAExists: boolean;
    objectBExists: boolean;
    verifiedViaA: 'schemas' | 'objects';
    verifiedViaB: 'schemas' | 'objects';
    associationExists: boolean;
    cardinality: string;
    isAPortalScoped: boolean;
    isBPortalScoped: boolean;
    labelDiffersA: boolean;
    labelDiffersB: boolean;
    associationTypes: AssociationDefinition[];
  },
  quiet: boolean = false,
  verbose: boolean = false
): string {
  const lines: string[] = [];
  
  lines.push('');
  
  // Step 1: Object existence checks with verification source
  if (data.objectAExists) {
    const source = data.verifiedViaA === 'schemas' ? 'schemas API' : 'objects API';
    lines.push(chalk.green(`✔ Object ${data.internalNameA} exists (verified via ${source})`));
  } else {
    lines.push(chalk.red(`✖ Object ${data.objectA} not found`));
  }
  
  if (data.objectBExists) {
    const source = data.verifiedViaB === 'schemas' ? 'schemas API' : 'objects API';
    lines.push(chalk.green(`✔ Object ${data.internalNameB} exists (verified via ${source})`));
  } else {
    lines.push(chalk.red(`✖ Object ${data.objectB} not found`));
  }
  
  // Step 2: Association check
  if (data.objectAExists && data.objectBExists) {
    if (data.associationExists) {
      lines.push('');
      lines.push(chalk.green('✔ Association definition found'));
    } else {
      lines.push(chalk.red(`✖ No association defined between ${data.objectA} and ${data.objectB}`));
    }
  }
  
  lines.push('');
  
  // If association exists, show recommended API usage
  if (data.objectAExists && data.objectBExists && data.associationExists) {
    lines.push(chalk.bold('Recommended API path:'));
    lines.push(`POST /crm/v4/associations/${data.internalNameA}/${data.internalNameB}/batch/create`);
    lines.push('');
    
    // Warnings
    const warnings: string[] = [];
    
    if (data.labelDiffersA) {
      warnings.push(`UI label "${data.objectA}" differs from API object name "${data.internalNameA}"`);
    }
    if (data.labelDiffersB) {
      warnings.push(`UI label "${data.objectB}" differs from API object name "${data.internalNameB}"`);
    }
    if (data.isAPortalScoped || data.isBPortalScoped) {
      warnings.push('Single PUT association endpoint may return 500 in sandbox');
    }
    
    if (warnings.length > 0) {
      lines.push(chalk.bold('Warnings:'));
      warnings.forEach((w) => {
        lines.push(chalk.yellow(`⚠ ${w}`));
      });
      lines.push('');
    }
  } else {
    // Association is NOT supported
    lines.push(chalk.bold('Result:'));
    if (!data.objectAExists || !data.objectBExists) {
      lines.push(chalk.red('Object not found'));
    } else {
      lines.push(chalk.red('Association is NOT supported via API'));
    }
    lines.push('');
  }
  
  // Always show the read-only notice
  lines.push(chalk.cyan('ℹ No write operations were performed'));
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
      solution: 'Use the internal object name (e.g., "contacts" not "contact"). Run `hubspot-crm schemas` to see all valid names.',
    },
    {
      cause: 'Incorrect association type ID',
      solution: 'Use `hubspot-crm associations <fromObject> <toObject>` to get valid association type IDs.',
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
      solution: 'Verify the object type exists using `hubspot-crm schemas`.',
    },
    {
      cause: 'No association definition between objects',
      solution: 'Check available associations with `hubspot-crm associations <fromObject> <toObject>`.',
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
