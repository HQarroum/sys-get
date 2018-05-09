const program     = require('commander');
const term        = require('terminal-kit').terminal;
const { version } = require('./package.json');

/**
 * Command-line interface.
 */
program
  .version(version)
  .name('sys-get')
  .command('all', 'Displays general infromation about the system.', { isDefault: true })
  .command('cpu', 'Displays information about the system CPU.')
  .command('memory', 'Displays information about the current memory usage.')
  .command('network', 'Displays information on the system network interfaces.')
  .command('os', 'Displays information on the operating system.')
  .command('processes', 'Displays information on the currently running processes.')
  .command('storage', 'Display information on the storage devices.')
  .command('serve [namespace] [endpoint]', 'Serves system information on a local IPC interface.')
  .command('remote [namespace] [endpoint]', 'Displays system information by connecting to a remote IPC agent.')
  .parse(process.argv);


/**
 * Resetting the terminal on exit.
 */
process.on('SIGINT', term.reset);