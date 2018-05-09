const program = require('commander');
const term    = require('terminal-kit').terminal;
const dump    = require('./lib/dump');
const storage = require('./lib/storage');

/**
 * Command-line interface.
 */
program
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .parse(process.argv);

/**
 * Displays `storage` information.
 */
const display = () => storage.get().then(dump.storage);

// Displaying `storage` information.
display();

// Showing real-time information in case the `live`
// argument is specified.
if (program.live) {
  term.clear().hideCursor();
  setInterval(() => {
    term.resetScrollingRegion();
    display();
  }, 2 * 1000);
}