const express = require('express');
const path = require('path');
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = require('./addon');

const PORT = process.env.PORT || 7000;
const app = express();
const staticDir = path.join(__dirname, '..', 'public');

app.get('/', (_, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.use(express.static(staticDir));
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use(getRouter(addonInterface));

const server = app.listen(PORT, () => {
  const address = server.address();
  const actualPort = address && typeof address === 'object' ? address.port : PORT;

  console.log(`Libre Subtitles Stremio Addon listening on port ${actualPort}`);
  console.log(`Install URL: http://localhost:${actualPort}/manifest.json`);
  console.log('');
  console.log('Interface web: http://localhost:' + actualPort + '/');
  console.log('To install this addon in Stremio:');
  console.log('1. Open Stremio');
  console.log('2. Go to Addons');
  console.log('3. Click on "Community Addons"');
  console.log(`4. Paste the URL: http://localhost:${actualPort}/manifest.json`);
});

module.exports = { app, server };
