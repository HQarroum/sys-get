const program     = require('commander');
const Expressify  = require('../expressify');
const IpcStrategy = require('../expressify-ipc');
const system      = require('./lib');

/**
 * Command-line interface.
 */
program
  .option('-n, --namespace [namespace]', 'The IPC namespace to use.')
  .option('-b, --endpoint [endpoint]', 'The IPC endpoint to use.')
  .parse(process.argv);

/**
 * The domains we are notifying the client about.
 */
const domains = [
  'processes',
  'cpu',
  'storage',
  'os',
  'memory',
  'network'
];

/**
 * Creating the Expressify server.
 */
const server = new Expressify.Server({
  strategy: new IpcStrategy({
    endpoint: program.endpoint || 'monitoring.server',
    namespace: program.namespace || 'system'
  })
});

/**
 * Retrieves and returns informations about running
 * processes on the host, along with load information.
 */
server.get('/system/processes', (req, res) => {
  system.processes.get().then((r) => res.send(r));
});

/**
 * Retrieves and returns information about the avaialable CPUs,
 * as well as load information.
 */
server.get('/system/cpu', (req, res) => {
  system.cpu.get().then((r) => res.send(r));
});

/**
 * Retrieves and returns information abut the storage
 * devices available on the host.
 */
server.get('/system/storage', (req, res) => {
  system.storage.get().then((r) => res.send(r));
});

/**
 * Retrieves and returns general information about
 * the host operating system.
 */
server.get('/system/os', (req, res) => {
  system.os.get().then((r) => res.send(r));
});

/**
 * Retrieves and returns information about the host
 * memory (usage, load, free memory).
 */
server.get('/system/memory', (req, res) => {
  system.memory.get().then((r) => res.send(r));
});

/**
 * Retrieves and returns information on the network
 * interfaces available on the host.
 */
server.get('/system/network', (req, res) => {
  system.network.get().then((r) => res.send(r));
});

/**
 * Listening for incoming requests.
 */
server.listen().then(() => {
  console.log(`[+] The server is listening for incoming requests on namespace '${server.strategy.opts.namespace}' !`);
  // Creating the interval loop notifying clients of
  // changes in the local system model.
  intervals = domains.map((d) => setInterval(() => {
    system[d].get().then((r) => server.publish(`/system/${d}`, r));
  }, 10 * 1000));
});

/**
 * Closing the IPC connection when leaving the application.
 */
process.on('SIGINT', () => {
  console.log('[+] Closing the IPC connection ...');
  // Clears all created intervals.
  intervals.forEach((i) => clearInterval(i));
  // Closing the connection.
  server.close().then(process.exit);
});
