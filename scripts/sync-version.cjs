#!/usr/bin/env node
/**
 * Sync version from package.json to src-tauri/Cargo.toml
 * Usage: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '../package.json');
const cargoPath = path.resolve(__dirname, '../src-tauri/Cargo.toml');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

let cargo = fs.readFileSync(cargoPath, 'utf8');

// Replace version in [package] section
cargo = cargo.replace(
  /^version = ".*"$/m,
  `version = "${version}"`
);

fs.writeFileSync(cargoPath, cargo);
console.log(`Synced Cargo.toml to version ${version}`);