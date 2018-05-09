const program  = require('commander');
const term     = require('terminal-kit').terminal;
const progress = require('cli-progress');
const chalk    = require('chalk');
const dump     = require('./lib/dump');
const cpu      = require('./lib/cpu');
const bars     = [];
let init       = false;

/**
 * Command-line interface.
 */
program
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .parse(process.argv);

/**
 * Displays `CPU` information.
 */
const display = () => cpu.get().then((cpu) => {
  dump.cpu(cpu);
  console.log();
  cpu.load.cpus.forEach((cpu_, idx, array) => {  
    !init && bars.push(new progress.Bar({}, {
      format: `Core #${idx} ${chalk.grey('{bar}')} {percentage}%`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591'
    }));
    !init && bars[idx].start(100, 0);
    bars[idx].update(Math.floor(cpu_.load));
    idx < array.length - 1 && console.log();
  });
  init = true;
});

// Displaying `CPU` information.
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