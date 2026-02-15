/**
 * Update Checker
 * Checks for outdated dependencies and available updates
 */

// Known latest versions for common packages
const LATEST_VERSIONS = {
  'react': '19.0.0',
  'react-dom': '19.0.0',
  'vue': '3.5.13',
  'vue-router': '4.5.0',
  'next': '15.1.6',
  'nuxt': '3.16.1',
  'express': '4.21.2',
  'koa': '2.15.3',
  'fastify': '5.2.0',
  'axios': '1.7.9',
  'fetch': '2.0.0',
  'lodash': '4.17.21',
  'underscore': '1.13.6',
  'webpack': '5.97.1',
  'vite': '6.0.11',
  'rollup': '4.34.1',
  'esbuild': '0.24.2',
  'typescript': '5.7.3',
  'babel': '7.26.0',
  'tailwindcss': '3.4.17',
  'postcss': '8.5.1',
  'sass': '1.83.4',
  'node-sass': '9.0.0',
  'mongoose': '8.9.5',
  'prisma': '5.22.0',
  'graphql': '16.10.0',
  'apollo-server': '3.13.0',
  'jest': '29.7.0',
  'vitest': '2.1.8',
  'mocha': '11.0.1',
  'eslint': '9.17.0',
  'prettier': '3.4.2',
  'nodemon': '3.1.9',
  'pm2': '5.4.3',
  'dotenv': '16.4.7',
  'commander': '12.1.0',
  'chalk': '5.4.1',
  'ora': '7.0.1',
  'inquirer': '11.4.0',
  'yargs': '17.7.2',
  'meow': '13.2.0',
  'fs-extra': '11.3.0',
  'rimraf': '6.0.1',
  'mkdirp': '3.0.1',
  'glob': '11.0.0',
  'moment': '2.30.1',
  'dayjs': '1.11.13',
  'date-fns': '4.1.0',
  'luxon': '3.5.0',
  'uuid': '11.0.5',
  'crypto-js': '4.2.0',
  'validator': '13.12.0',
  'joi': '17.13.3',
  'zod': '3.24.1',
  'yup': '1.6.1',
  'jsonwebtoken': '9.0.2',
  'bcrypt': '5.1.1',
  'passport': '0.7.0',
  'cors': '2.8.5',
  'helmet': '8.0.0',
  'express-rate-limit': '7.5.0',
  'winston': '3.17.0',
  'pino': '9.6.0',
  'morgan': '1.10.0',
  'body-parser': '1.20.3',
  'cookie-parser': '1.4.7',
  'socket.io': '4.8.1',
  'ws': '8.18.0',
  'nodemailer': '6.9.16',
  'sharp': '0.33.5',
  'jimp': '1.6.0',
  'puppeteer': '24.1.0',
  'playwright': '1.49.1',
  'cheerio': '1.0.0',
  'jsdom': '26.0.0',
  'axios': '1.7.9'
};

export class UpdateChecker {
  constructor(options = {}) {
    this.options = {
      workspacePath: options.workspacePath || process.cwd(),
      excludeDirs: options.excludeDirs || ['node_modules', '.git', 'dist'],
      ...options
    };
    
    this.results = {
      outdated: [],
      upToDate: [],
      majorUpdates: [],
      minorUpdates: [],
      patchUpdates: [],
      summary: {
        totalScanned: 0,
        outdated: 0,
        upToDate: 0
      }
    };
  }

  async check() {
    console.log('🔍 Checking for outdated dependencies...\n');
    
    const projects = this.findProjects();
    console.log(`📦 Found ${projects.length} projects\n`);
    
    for (const project of projects) {
      const dependencies = this.parseDependencies(project);
      
      for (const [pkg, currentVersion] of Object.entries(dependencies)) {
        this.results.summary.totalScanned++;
        
        const latest = LATEST_VERSIONS[pkg.toLowerCase()];
        
        if (latest) {
          const updateType = this.getUpdateType(currentVersion, latest);
          
          if (updateType) {
            this.results.outdated.push({
              package: pkg,
              current: currentVersion,
              latest: latest,
              updateType: updateType
            });
            this.results.summary.outdated++;
            
            if (updateType === 'major') {
              this.results.majorUpdates.push({ package: pkg, current: currentVersion, latest });
            } else if (updateType === 'minor') {
              this.results.minorUpdates.push({ package: pkg, current: currentVersion, latest });
            } else {
              this.results.patchUpdates.push({ package: pkg, current: currentVersion, latest });
            }
          } else {
            this.results.upToDate.push({ package: pkg, version: currentVersion });
            this.results.summary.upToDate++;
          }
        }
      }
    }
    
    return this.results;
  }

  findProjects() {
    const { readFileSync, existsSync, readdirSync, statSync } = require('fs');
    const { join, resolve } = require('path');
    
    const projects = [];
    const workspacePath = resolve(this.options.workspacePath);
    
    try {
      const entries = readdirSync(workspacePath);
      
      for (const entry of entries) {
        const fullPath = join(workspacePath, entry);
        
        if (!statSync(fullPath).isDirectory()) continue;
        if (this.options.excludeDirs.includes(entry)) continue;
        if (entry.startsWith('.')) continue;
        
        if (existsSync(join(fullPath, 'package.json'))) {
          projects.push({ name: entry, path: fullPath });
        }
      }
    } catch (error) {
      console.error('Error finding projects:', error.message);
    }
    
    return projects;
  }

  parseDependencies(project) {
    const { readFileSync, existsSync } = require('fs');
    const { join } = require('path');
    
    const pkgPath = join(project.path, 'package.json');
    if (!existsSync(pkgPath)) return {};
    
    try {
      const content = readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      return {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
    } catch {
      return {};
    }
  }

  getUpdateType(current, latest) {
    if (!current || !latest) return null;
    
    const cleanCurrent = current.replace(/[\^~>=<]+/g, '').split('.');
    const cleanLatest = latest.replace(/[\^~>=<]+/g, '').split('.');
    
    const currMajor = parseInt(cleanCurrent[0]) || 0;
    const currMinor = parseInt(cleanCurrent[1]) || 0;
    const currPatch = parseInt(cleanCurrent[2]) || 0;
    
    const latestMajor = parseInt(cleanLatest[0]) || 0;
    const latestMinor = parseInt(cleanLatest[1]) || 0;
    const latestPatch = parseInt(cleanLatest[2]) || 0;
    
    if (latestMajor > currMajor) return 'major';
    if (latestMinor > currMinor) return 'minor';
    if (latestPatch > currPatch) return 'patch';
    
    return null;
  }
}

export async function check(options = {}) {
  const checker = new UpdateChecker(options);
  return await checker.check();
}
