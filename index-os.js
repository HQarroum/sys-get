const program = require('commander');
const term    = require('terminal-kit').terminal;
const dump    = require('./lib/dump');
const os      = require('./lib/os');

/**
 * Command-line interface.
 */
program
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .parse(process.argv);

/**
 * Displays `os` information.
 */
const display = () => os.get().then(dump.os);

// Displaying `os` information.
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