const program   = require('commander');
const term      = require('terminal-kit').terminal;
const dump      = require('./lib/dump');
const processes = require('./lib/processes');

/**
 * Command-line interface.
 */
program
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .parse(process.argv);

/**
 * Displays `processes` information.
 */
const display = () => processes.get().then(dump.processes);

// Displaying `processes` information.
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