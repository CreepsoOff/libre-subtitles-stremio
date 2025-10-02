const { serveHTTP } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const PORT = process.env.PORT || 7000;

// Serve the addon via HTTP
serveHTTP(addonInterface, { port: PORT });

console.log(`Libre Subtitles Stremio Addon listening on port ${PORT}`);
console.log(`Install URL: http://localhost:${PORT}/manifest.json`);
console.log('');
console.log('To install this addon in Stremio:');
console.log('1. Open Stremio');
console.log('2. Go to Addons');
console.log('3. Click on "Community Addons"');
console.log(`4. Paste the URL: http://localhost:${PORT}/manifest.json`);
