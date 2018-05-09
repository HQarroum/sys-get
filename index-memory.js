const program = require('commander');
const term    = require('terminal-kit').terminal;
const dump    = require('./lib/dump');
const memory  = require('./lib/memory');

/**
 * Command-line interface.
 */
program
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .parse(process.argv);

/**
 * Displays `memory` information.
 */
const display = () => memory.get().then(dump.memory);

// Displaying `memory` information.
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