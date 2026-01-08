#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
  listSchemasCommand,
  inspectObjectCommand,
  inspectAssociationsCommand,
  showErrorsCommand,
  listCustomObjectsCommand,
} from './commands';

const program = new Command();

program
  .name('hubspot-inspector')
  .description('Inspect and debug HubSpot CRM schemas and associations')
  .version('1.0.0');

// Schemas command
program
  .command('schemas')
  .description('List all CRM object types with internal names, IDs, and labels')
  .option('-v, --verbose', 'Show detailed information for each schema')
  .option('-f, --filter <pattern>', 'Filter schemas by name or label')
  .action(listSchemasCommand);

// Object command
program
  .command('object <objectType>')
  .description('Inspect a specific object type in detail')
  .option('-p, --properties', 'Show all properties for the object')
  .action(inspectObjectCommand);

// Associations command
program
  .command('associations <fromObject> <toObject>')
  .description('Inspect associations between two object types')
  .option('-v, --verify', 'Show common error documentation')
  .action(inspectAssociationsCommand);

// Custom objects command
program
  .command('custom')
  .description('List all portal-scoped (custom) objects')
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
  console.log('  $ hubspot-inspector schemas');
  console.log('  $ hubspot-inspector schemas --verbose');
  console.log('  $ hubspot-inspector schemas --filter contact');
  console.log('  $ hubspot-inspector object contacts');
  console.log('  $ hubspot-inspector object contacts --properties');
  console.log('  $ hubspot-inspector associations contacts companies');
  console.log('  $ hubspot-inspector associations contacts deals --verify');
  console.log('  $ hubspot-inspector custom');
  console.log('  $ hubspot-inspector errors');
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
