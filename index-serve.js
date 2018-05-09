const program = require('commander');
const term    = require('terminal-kit').terminal;
const dump    = require('./lib/dump');
const storage = require('./lib/storage');

/**
 * Command-line interface.
 */
program
  .option('-n, --namespace', 'The IPC namespace to use.')
  .option('-b, --endpoint', 'The IPC endpoint to use.')
  .parse(process.argv);

