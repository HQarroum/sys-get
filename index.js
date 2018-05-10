const program     = require('commander');
const term        = require('terminal-kit').terminal;
const { version } = require('./package.json');
const dump        = require('./lib/dump');
const fs          = require('fs');
const commands    = [];

// Argument list.
const argument = process.argv.slice(2, process.argv.length);
if (!process.argv[2]) process.argv.push('all');

/**
 * Command-line interface.
 */
program
  .version(version)
  .name('sys-get')
  .option('all', 'Displays all the system information.')
  .option('cpu', 'Displays information about the system CPU.')
  .option('memory', 'Displays information about the current memory usage.')
  .option('network', 'Displays information on the system network interfaces.')
  .option('os', 'Displays information on the operating system.')
  .option('processes', 'Displays information on the currently running processes.')
  .option('storage', 'Display information on the storage devices.')
  .command('serve [namespace] [endpoint]', 'Serves system information on a local IPC interface.')
  .command('remote [namespace] [endpoint]', 'Displays system information by connecting to a remote IPC agent.')
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .option('-r, --refresh-rate <rate>', 'Specify after how many time, in milliseconds, the display should be refreshed.')
  .parse(process.argv);

/**
 * The application refresh rate.
 */
const rate = program.refreshRate || (2 * 1000);

/**
 * Building the `commands` array.
 */
fs.readdirSync('./lib').forEach((file) => commands.push(file.replace(/\.[^/.]+$/, '')));

// If `commander` handled a command, we stop.
if (program.args.length > 0) {
  return;
}

/**
 * Displays the system information associated with the
 * given array of topics.
 * @param {*} list the array of topics to display information
 * about.
 */
const display = (list) => {
  const array = [];

  // Loads commands in an array of promises.
  const load = (cmds) => {
    cmds.forEach((command) => {
      if (commands.indexOf(command) < 0) return;
      const provider = require(`./lib/${command}`);
      if (provider.get) {
        array.push(provider.get().then((res) => ({ res, command })).catch((err) => console.log(`Error : ${err}`)));
      }
    });
  };

  load(list);

  // If no commands were found, we stop.
  if (!array.length) load(commands);

  // Displaying the gathered information.
  return Promise.all(array).then((results) => results.forEach((o, idx) => {
    dump[o.command](o.res);
    idx < results.length - 1 && console.log();
  }));
};

/**
 * Called on each refresh tick in `live` mode.
 */
const tick = () => {
  term.resetScrollingRegion();
  display(argument).then(() => setTimeout(tick, rate));
};

// Displaying informations.
display(argument).then(() => {
  // Showing real-time information in case the `live`
  // argument is specified.
  if (program.live) {
    term
      .clear()
      .hideCursor()
      .grabInput({ mouse: 'button' })
      .on('key', (name, matches, data) => {
        process.kill(process.pid, 'SIGINT');
      });
    setTimeout(tick, rate);
  }
});

/**
 * Resetting the terminal on exit.
 */
process.on('SIGINT', () => {
  term.reset();
  if (process.rawListeners('SIGINT').length === 1) {
    // If no other listeners are executing, we close the program.
    process.exit(0);
  }
});