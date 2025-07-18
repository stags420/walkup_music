#!/usr/bin/env node

/**
 * Script to automatically fix deprecated npm dependencies
 * 
 * This script:
 * 1. Identifies deprecated packages in the dependency tree
 * 2. Adds necessary overrides to package.json
 * 3. Reinstalls dependencies to apply the fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Known replacements for common deprecated packages
const KNOWN_REPLACEMENTS = {
  'glob@7': '^11.0.3',
  'inflight': 'npm:@isaacs/inflight@^1.0.0',
  'request': 'npm:undici-shim@^1.0.0',
  'node-sass': 'npm:sass@^1.60.0',
  'uuid@3': '^9.0.0',
  'mkdirp@0': '^3.0.0',
  'minimist': '^1.2.8',
  'chokidar@2': '^3.5.3',
};

// Function to run a command and return its output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    if (error.stdout) {
      return error.stdout.toString();
    }
    return '';
  }
}

// Function to find deprecated packages
function findDeprecatedPackages() {
  console.log('🔍 Scanning for deprecated packages...');
  
  // Generate package-lock.json if it doesn't exist
  runCommand('npm install --package-lock-only');
  
  // Read package-lock.json and look for deprecated packages
  const packageLockContent = fs.readFileSync('package-lock.json', 'utf8');
  const deprecatedPackages = [];
  
  // Parse package-lock.json to find deprecated packages
  const packageLock = JSON.parse(packageLockContent);
  const packages = packageLock.packages || {};
  
  Object.entries(packages).forEach(([pkgPath, pkgInfo]) => {
    if (pkgInfo.deprecated) {
      const name = pkgPath.replace('node_modules/', '');
      const version = pkgInfo.version;
      const fullName = name + '@' + version;
      const message = pkgInfo.deprecated;
      
      deprecatedPackages.push({
        name,
        version,
        fullName,
        message
      });
    }
  });
  
  return deprecatedPackages;
}

// Function to update package.json with overrides
function updatePackageJson(deprecatedPackages) {
  console.log('📝 Updating package.json with overrides...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Initialize overrides if it doesn't exist
  if (!packageJson.overrides) {
    packageJson.overrides = {};
  }
  
  // Add overrides for each deprecated package
  let updatedCount = 0;
  
  deprecatedPackages.forEach(pkg => {
    let replacement = null;
    
    // Check if we have a known replacement
    for (const [pattern, replace] of Object.entries(KNOWN_REPLACEMENTS)) {
      if (pkg.fullName.startsWith(pattern) || pkg.name === pattern) {
        replacement = replace;
        break;
      }
    }
    
    if (replacement) {
      packageJson.overrides[pkg.name] = replacement;
      updatedCount++;
      console.log(`  ✅ Added override for ${pkg.name}: ${replacement}`);
    } else {
      console.log(`  ⚠️ No known replacement for ${pkg.fullName}: "${pkg.message}"`);
    }
  });
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  return updatedCount;
}

// Function to reinstall dependencies
function reinstallDependencies() {
  console.log('📦 Reinstalling dependencies to apply fixes...');
  runCommand('npm install');
}

// Main function
function main() {
  console.log('🔧 Starting deprecated dependency fixer...');
  
  const deprecatedPackages = findDeprecatedPackages();
  
  if (deprecatedPackages.length === 0) {
    console.log('✨ No deprecated packages found. All good!');
    return;
  }
  
  console.log(`\n🚨 Found ${deprecatedPackages.length} deprecated packages:`);
  deprecatedPackages.forEach(pkg => {
    console.log(`  - ${pkg.fullName}: "${pkg.message}"`);
  });
  
  const updatedCount = updatePackageJson(deprecatedPackages);
  
  if (updatedCount > 0) {
    reinstallDependencies();
    
    // Verify fixes
    const remainingDeprecated = findDeprecatedPackages();
    if (remainingDeprecated.length === 0) {
      console.log('\n✅ All deprecated packages have been fixed!');
    } else {
      console.log(`\n⚠️ ${remainingDeprecated.length} deprecated packages still remain.`);
      console.log('   You may need to add custom overrides for these packages.');
    }
  } else {
    console.log('\n⚠️ No overrides were added. You may need to manually fix these dependencies.');
  }
}

// Run the script
main();