#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
  listSchemasCommand,
  inspectObjectCommand,
  inspectAssociationsCommand,
  verifyAssociationsCommand,
  showErrorsCommand,
  listCustomObjectsCommand,
} from './commands';

// Exit codes as per specification
export const EXIT_CODES = {
  SUCCESS: 0,
  ASSOCIATION_INVALID: 1,
  OBJECT_NOT_FOUND: 2,
  API_ERROR: 3,
};

const program = new Command();

program
  .name('hubspot-crm')
  .description('Inspect and debug HubSpot CRM schemas and associations')
  .version('1.0.0');

// Schemas command
program
  .command('schemas')
  .description('Fetch /crm/v3/schemas - Print all CRM objects and reveal real internal names')
  .option('--json', 'Machine-readable output')
  .option('--quiet', 'Suppress headers')
  .option('--verbose', 'Show raw API paths')
  .option('-f, --filter <pattern>', 'Filter schemas by name or label')
  .action(listSchemasCommand);

// Object command
program
  .command('object <objectName>')
  .description('Inspect a single object deeply - show schema details, labels, object type ID, scope, and associations')
  .option('--json', 'Machine-readable output')
  .option('--quiet', 'Suppress headers')
  .option('--verbose', 'Show raw API paths')
  .option('-p, --properties', 'Show all properties for the object')
  .action(inspectObjectCommand);

// Associations command
program
  .command('associations <objectA> <objectB>')
  .description('List associations between two objects - calls /crm/v4/associations/{A}/{B}/types')
  .option('--verify', 'Verify if you can safely associate these two objects via the CRM v4 API')
  .option('--json', 'Machine-readable output')
  .option('--quiet', 'Suppress headers')
  .option('--verbose', 'Show raw API paths')
  .action(inspectAssociationsCommand);

// Verify command (shorthand for associations with --verify)
program
  .command('verify <objectA> <objectB>')
  .description('Verify if you can safely associate two objects via the CRM v4 API - shows recommended API usage')
  .option('--json', 'Machine-readable output')
  .option('--quiet', 'Suppress headers')
  .option('--verbose', 'Show raw API paths')
  .action(verifyAssociationsCommand);

// Custom objects command
program
  .command('custom')
  .description('List all portal-scoped (custom) objects')
  .option('--json', 'Machine-readable output')
  .option('--quiet', 'Suppress headers')
  .option('--verbose', 'Show raw API paths')
  .action(listCustomObjectsCommand);

// Errors command
program
  .command('errors')
  .description('Show documentation for common HubSpot API errors')
  .action(showErrorsCommand);

// Help examples
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ export HUBSPOT_ACCESS_TOKEN=your_token_here');
  console.log('  $ hubspot-crm schemas');
  console.log('  $ hubspot-crm schemas --verbose');
  console.log('  $ hubspot-crm schemas --filter contact');
  console.log('  $ hubspot-crm object contacts');
  console.log('  $ hubspot-crm object contacts --properties');
  console.log('  $ hubspot-crm associations contacts companies');
  console.log('  $ hubspot-crm associations contacts listings --verify');
  console.log('  $ hubspot-crm verify contacts listings');
  console.log('  $ hubspot-crm custom');
  console.log('  $ hubspot-crm errors');
  console.log('');
  console.log('Exit Codes:');
  console.log('  0    Verification passed');
  console.log('  1    Association invalid');
  console.log('  2    Object not found');
  console.log('  3    HubSpot API error');
  console.log('');
  console.log('Environment Variables:');
  console.log('  HUBSPOT_ACCESS_TOKEN    Required. Your HubSpot private app access token');
  console.log('');
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
