#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_CONFIG = {
  distDir: 'dist',
  sourceDirs: {
    styles: 'styles',
    scripts: 'scripts',
    html: '.',
    assets: 'assets'
  },
  targetDirs: {
    styles: 'dist/styles',
    scripts: 'dist/scripts',
    assets: 'dist/assets'
  }
};

const logger = {
  info: (message) => console.log(`\x1b[36m[INFO]\x1b[0m ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  error: (message) => console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`),
  warn: (message) => console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`),
  step: (message) => console.log(`\x1b[35m[STEP]\x1b[0m ${message}`)
};

function executeCommand(command, description) {
  try {
    logger.step(description);
    execSync(command, { stdio: 'inherit' });
    logger.success(`${description} - completed`);
    return true;
  } catch (error) {
    logger.error(`${description} - failed`);
    logger.error(error.message);
    return false;
  }
}

function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
    return false;
  }
}

function cleanDistDirectory() {
  logger.step('Cleaning dist directory');
  try {
    if (fs.existsSync(BUILD_CONFIG.distDir)) {
      fs.rmSync(BUILD_CONFIG.distDir, { recursive: true, force: true });
      logger.success('Dist directory cleaned');
    }
    return true;
  } catch (error) {
    logger.error(`Failed to clean dist directory: ${error.message}`);
    return false;
  }
}

function createDistStructure() {
  logger.step('Creating dist directory structure');
  const directories = [
    BUILD_CONFIG.distDir,
    BUILD_CONFIG.targetDirs.styles,
    BUILD_CONFIG.targetDirs.scripts
  ];

  for (const dir of directories) {
    if (!ensureDirectoryExists(dir)) {
      return false;
    }
  }

  logger.success('Dist directory structure created');
  return true;
}

function buildCSS() {
  const command = `postcss ${BUILD_CONFIG.sourceDirs.styles}/**/*.css --dir ${BUILD_CONFIG.targetDirs.styles} --config postcss.config.js`;
  return executeCommand(command, 'Building and minifying CSS');
}

function buildJS() {
  const scriptFiles = [];
  const scriptsDir = BUILD_CONFIG.sourceDirs.scripts;

  try {
    if (fs.existsSync(scriptsDir)) {
      const files = fs.readdirSync(scriptsDir);
      files.forEach(file => {
        if (file.endsWith('.js')) {
          scriptFiles.push(path.join(scriptsDir, file));
        }
      });
    }
  } catch (error) {
    logger.error(`Failed to read scripts directory: ${error.message}`);
    return false;
  }

  if (scriptFiles.length === 0) {
    logger.warn('No JavaScript files found to minify');
    return true;
  }

  const command = `terser ${scriptFiles.join(' ')} --compress --mangle -o ${BUILD_CONFIG.targetDirs.scripts}/bundle.min.js`;
  return executeCommand(command, 'Building and minifying JavaScript');
}

function copyHTMLFiles() {
  logger.step('Copying HTML files');
  try {
    const htmlFiles = fs.readdirSync(BUILD_CONFIG.sourceDirs.html)
      .filter(file => file.endsWith('.html'));

    if (htmlFiles.length === 0) {
      logger.warn('No HTML files found to copy');
      return true;
    }

    htmlFiles.forEach(file => {
      const sourcePath = path.join(BUILD_CONFIG.sourceDirs.html, file);
      const targetPath = path.join(BUILD_CONFIG.distDir, file);
      fs.copyFileSync(sourcePath, targetPath);
      logger.info(`Copied ${file}`);
    });

    logger.success(`Copied ${htmlFiles.length} HTML file(s)`);
    return true;
  } catch (error) {
    logger.error(`Failed to copy HTML files: ${error.message}`);
    return false;
  }
}

function copyAssets() {
  logger.step('Copying assets');
  const assetsDir = BUILD_CONFIG.sourceDirs.assets;

  if (!fs.existsSync(assetsDir)) {
    logger.info('No assets directory found - skipping');
    return true;
  }

  try {
    const targetAssetsDir = BUILD_CONFIG.targetDirs.assets;
    ensureDirectoryExists(targetAssetsDir);

    const copyRecursive = (src, dest) => {
      const stats = fs.statSync(src);

      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        files.forEach(file => {
          copyRecursive(path.join(src, file), path.join(dest, file));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursive(assetsDir, targetAssetsDir);
    logger.success('Assets copied successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to copy assets: ${error.message}`);
    return false;
  }
}

function generateBuildReport() {
  logger.step('Generating build report');

  const report = {
    buildTime: new Date().toISOString(),
    files: {}
  };

  const getDirectorySize = (dirPath) => {
    let totalSize = 0;

    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const calculateSize = (itemPath) => {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(itemPath);
        files.forEach(file => {
          calculateSize(path.join(itemPath, file));
        });
      } else {
        totalSize += stats.size;
      }
    };

    calculateSize(dirPath);
    return totalSize;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  report.files.css = {
    size: getDirectorySize(BUILD_CONFIG.targetDirs.styles),
    formatted: formatBytes(getDirectorySize(BUILD_CONFIG.targetDirs.styles))
  };

  report.files.js = {
    size: getDirectorySize(BUILD_CONFIG.targetDirs.scripts),
    formatted: formatBytes(getDirectorySize(BUILD_CONFIG.targetDirs.scripts))
  };

  const distSize = getDirectorySize(BUILD_CONFIG.distDir);
  report.totalSize = {
    size: distSize,
    formatted: formatBytes(distSize)
  };

  logger.info('\n========== BUILD REPORT ==========');
  logger.info(`Build Time: ${report.buildTime}`);
  logger.info(`CSS Size: ${report.files.css.formatted}`);
  logger.info(`JS Size: ${report.files.js.formatted}`);
  logger.info(`Total Dist Size: ${report.totalSize.formatted}`);
  logger.info('==================================\n');

  return report;
}

function runBuild() {
  const startTime = Date.now();
  logger.info('Starting production build process...\n');

  const steps = [
    { name: 'Clean', fn: cleanDistDirectory },
    { name: 'Create Structure', fn: createDistStructure },
    { name: 'Build CSS', fn: buildCSS },
    { name: 'Build JavaScript', fn: buildJS },
    { name: 'Copy HTML', fn: copyHTMLFiles },
    { name: 'Copy Assets', fn: copyAssets }
  ];

  for (const step of steps) {
    if (!step.fn()) {
      logger.error(`\nBuild failed at step: ${step.name}`);
      process.exit(1);
    }
  }

  generateBuildReport();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.success(`\n✓ Build completed successfully in ${duration}s`);
  logger.info(`Output directory: ${path.resolve(BUILD_CONFIG.distDir)}\n`);
}

if (require.main === module) {
  try {
    runBuild();
  } catch (error) {
    logger.error(`Unexpected error during build: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

module.exports = { runBuild, BUILD_CONFIG };
