const fs   = require('fs');
const path = require('path');

// Supported commands.
const array = [];

// Loading supported commands.
const directory = path.resolve(__dirname, './components');
fs.readdirSync(directory).forEach((file) => array.push(file.replace(/\.[^/.]+$/, '')));

// Exporting the array of commands.
module.exports = () => array;