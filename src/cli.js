/**
 * Update Checker CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { check } from './checker.js';

const red = chalk.red;
const green = chalk.green;
const yellow = chalk.yellow;
const blue = chalk.blue;
const bold = chalk.bold;
const orange = chalk.hex('#f97316');

const program = new Command();

program
  .name('dep-update-checker')
  .description('Check for outdated dependencies')
  .version('1.0.0');

program
  .command('check')
  .description('Check for outdated packages')
  .option('-p, --path <path>', 'Workspace path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Checking for outdated dependencies...').start();
    
    try {
      const results = await check({ workspacePath: options.path });
      spinner.succeed('Check complete!');
      
      console.log('\n' + '='.repeat(60));
      console.log(bold('📦 UPDATE CHECKER SUMMARY'));
      console.log('='.repeat(60));
      console.log(`Total Dependencies: ${results.summary.totalScanned}`);
      console.log(`Outdated:           ${results.summary.outdated}`);
      console.log(`Up to Date:        ${results.summary.upToDate}`);
      console.log('='.repeat(60));
      
      if (results.majorUpdates.length > 0) {
        console.log(bold('\n🔴 MAJOR UPDATES (breaking):\n'));
        for (const u of results.majorUpdates.slice(0, 10)) {
          console.log(red(`🔴 ${u.package}: ${u.current} → ${u.latest}`));
        }
      }
      
      if (results.minorUpdates.length > 0) {
        console.log(bold('\n🟡 MINOR UPDATES:\n'));
        for (const u of results.minorUpdates.slice(0, 10)) {
          console.log(yellow(`🟡 ${u.package}: ${u.current} → ${u.latest}`));
        }
      }
      
      if (results.patchUpdates.length > 0) {
        console.log(bold('\n🟢 PATCH UPDATES:\n'));
        for (const u of results.patchUpdates.slice(0, 10)) {
          console.log(green(`🟢 ${u.package}: ${u.current} → ${u.latest}`));
        }
      }
      
      if (results.summary.outdated === 0) {
        console.log(green('\n✅ All dependencies are up to date!'));
      }
      
    } catch (error) {
      spinner.fail('Check failed!');
      console.error(red('Error:'), error.message);
    }
  });

program.parse();
