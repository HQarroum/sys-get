const fs = require('fs');

// Supported commands.
const array = [];

// Loading supported commands.
fs.readdirSync('./lib/components').forEach((file) => array.push(file.replace(/\.[^/.]+$/, '')));

/**
 * Exporting the array of commands.
 */
module.exports = () => array;