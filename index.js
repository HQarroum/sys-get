const program  = require('commander');
const fs       = require('fs');
const system   = require('./lib');
const dump     = system.dump;
const commands = system.commands();

// Retrieving package informations.
const { version, description, name } = require('./package.json');

// Argument list.
let argument = process.argv.slice(2, process.argv.length).filter((arg) => commands.indexOf(arg) !== -1);
if (!process.argv[2]) process.argv.push('all');
if (!argument.length) argument = commands;

/**
 * Command-line interface.
 */
program
  .version(version)
  .name(name)
  .description(description)
  .option('-e, --use-expressify <transport>', 'Use Expressify to communicate over an Expressify transport (mqtt and ipc currently supported).')
  .option('-n, --namespace <namespace>', 'The Expressify IPC namespace to use.')
  .option('-b, --endpoint <endpoint>', 'The Expressify IPC endpoint to use.')
  .option('-m, --mqtt-opts <path>', 'Path to an Expressify MQTT configuration file.')
  .option('all', 'Displays all the system information.')
  .option('cpu', 'Displays information about the system CPU.')
  .option('memory', 'Displays information about the current memory usage.')
  .option('network', 'Displays information on the system network interfaces.')
  .option('os', 'Displays information on the operating system.')
  .option('graphics', 'Displays information on the graphic system (Graphic Cards and Displays).')
  .option('processes', 'Displays information on the currently running processes.')
  .option('storage', 'Display information on the storage devices.')
  .command('dashboard', 'Display a live dashboard of the system information.')
  .command('serve [namespace] [endpoint]', 'Serves system information on a local IPC interface.')
  .parse(process.argv);

// Initializing the client.
const client = system.factory(program);

// If `commander` handled a command, we stop.
if (program.args.length > 0) {
  return;
}

/**
 * Dumps the given error object on `stderr` and
 * exists the application.
 * @param {*} err the error to dump.
 */
const fail = (err) => {
  console.error(err);
  process.exit(-1);
};

/**
 * Displays the system information associated with the
 * given array of topics.
 */
client.prepare()
  .then(() => client.some(argument))
  .then((results) => results.forEach((o, idx) => {
    dump[o.command](o.res);
    idx < results.length - 1 && console.log();
  }))
  .catch(fail);