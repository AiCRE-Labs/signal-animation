// clean-build.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Cleaning any previous builds...');
// Remove build directory if it exists
if (fs.existsSync('build')) {
  fs.rmSync('build', { recursive: true, force: true });
}

// Remove docs directory if it exists
if (fs.existsSync('docs')) {
  fs.rmSync('docs', { recursive: true, force: true });
}

console.log('Running production build...');
// Run React build process
execSync('react-scripts build', { stdio: 'inherit' });

console.log('Preparing docs directory...');
// Create docs directory
fs.mkdirSync('docs', { recursive: true });

// Copy build content to docs
fs.cpSync('build', 'docs', { recursive: true });

// Create .nojekyll file
fs.writeFileSync('docs/.nojekyll', '');

// Make sure manifest.json is valid
const manifestPath = path.join('docs', 'manifest.json');
const manifest = {
  "short_name": "Signal",
  "name": "Signal Animation",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('Build complete! Files are ready in the docs directory.');