const { addonBuilder } = require('stremio-addon-sdk');
const { manifest } = require('./manifest');
const { handleSubtitles } = require('./handlers/subtitles');

// Create addon builder with manifest
const builder = new addonBuilder(manifest);

// Define the subtitles handler
builder.defineSubtitlesHandler(async (args) => {
  try {
    console.log('Subtitles request:', args);
    return await handleSubtitles(args);
  } catch (error) {
    console.error('Error handling subtitles request:', error);
    return { subtitles: [] };
  }
});

module.exports = builder.getInterface();
