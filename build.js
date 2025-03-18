// build.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the React build
console.log('Building React application...');
execSync('react-scripts build', { stdio: 'inherit' });

// Create the docs directory if it doesn't exist
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs');
} else {
  // Clear the docs directory
  console.log('Clearing docs directory...');
  fs.readdirSync('docs').forEach((file) => {
    const filePath = path.join('docs', file);
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  });
}

// Copy files from build to docs
console.log('Copying files from build to docs...');
fs.cpSync('build', 'docs', { recursive: true });

// Create a .nojekyll file to prevent GitHub Pages from using Jekyll
fs.writeFileSync('docs/.nojekyll', '');

// Ensure manifest.json is correct
const manifestContent = JSON.stringify({
  "short_name": "Signal",
  "name": "Signal Animation",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}, null, 2);

fs.writeFileSync('docs/manifest.json', manifestContent);
console.log('Fixed manifest.json file');

console.log('Build complete! Files are ready in the docs directory.');