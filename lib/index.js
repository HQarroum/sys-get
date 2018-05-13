/**
 * Exporting the `system` API.
 */
module.exports = {
  processes: require('./components/processes'),
  cpu: require('./components/cpu'),
  storage: require('./components/storage'),
  os: require('./components/os'),
  memory: require('./components/memory'),
  network: require('./components/network'),
  graphics: require('./components/graphics'),
  dump: require('./dump'),
  factory: require('./factory'),
  commands: require('./commands')
};
