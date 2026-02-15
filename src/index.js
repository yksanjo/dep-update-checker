/**
 * Dependency Update Checker - Main Entry Point
 */

import { UpdateChecker } from './checker.js';

export { UpdateChecker };

const isMain = process.argv[1]?.includes('index.js');
if (isMain) {
  console.log('Dependency Update Checker v1.0.0');
  console.log('Use: node src/cli.js <command>');
}
