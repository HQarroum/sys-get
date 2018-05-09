const program = require('commander');
const term    = require('terminal-kit').terminal;
const dump    = require('./lib/dump');
const cpu     = require('./lib/cpu');
const fs      = require('fs');

/**
 * Command-line interface.
 */
program
  .option('-l, --live', 'Specify this option if you would like to get system information in real-time.')
  .parse(process.argv);

/**
 * Displays information from all modules.
 */
const display = () => {
  fs.readdir('./lib', (err, files) => {
    const array = [];

    // Retrieving information.
    files.forEach((file) => {
      const provider = require(`./lib/${file}`);
      if (provider.get) {
        array.push(provider.get().then((res) => ({ res, key: file.slice(0, file.length - 1 - 2) })));
      }
    });

    // Displaying the gathered information.
    Promise.all(array).then((results) => results.forEach((o, idx) => {
      dump[o.key](o.res);
      idx < results.length - 1 && console.log();
    }));
  });
};

// Displaying `all` information.
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