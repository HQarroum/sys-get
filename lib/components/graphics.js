const system = require('systeminformation');

/**
 * Graphics module entry point.
 */
module.exports = {
  get: () => system.graphics()
};