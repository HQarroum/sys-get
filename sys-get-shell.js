const program = require('commander');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const system  = require('./lib');
const XTerm   = require('./lib/pty/blessed-xterm');

// Creating a new screen instance.
const screen = blessed.screen();

// Creating a new grid on the screen.
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// Instanciating the client.
const client = system.factory(program);

// Terminal options.
let opts = {
  args:          [],
  env:           process.env,
  cwd:           '/',
  cursorType:    'block',
  border:        'line',
  scrollback:    1000,
  style: {
    fg:        'default',
    bg:        'default',
    border:    { fg: 'default' },
    focus:     { border: { fg: 'green' } },
    scrolling: { border: { fg: 'red' } }
  }
};

// Terminal hint.
let hint = "\r\nWelcome in the remote shell !\r\n" +
  "Press Q or type `exit` to quit the application, Ctrl+k to change focus between widgets.\r\n\r\n";

/**
 * Dumps the given error object on `stderr` and
 * exists the application.
 * @param {*} err the error to dump.
 */
const fail = (err) => {
  // Destrying the screen.
  screen.destroy();
  // Logging the error.
  console.error(err);
  // Quitting the application.
  process.exit(-1);
};

// Preparing the client and refreshing the dashboard 
// information.
client.prepare()
  .then(() => {
    // Creating a new terminal.
    const terminal = new XTerm(Object.assign({}, opts, {
      left:    0,
      top:     0,
      width:   screen.width,
      height:  screen.height,
      label:   'Remote Terminal',
      ptyInstance: client.pty()
    }));

    // Waiting for the `ready` event.
    terminal.once('ready', () => {
      terminal.write(hint)
      terminal.focus();
      screen.append(terminal);
    });

    // On a PTY error, we exit the application.
    terminal.on('error', fail);
    
    // Gracefully exits the application on `exit`.
    terminal.on('exit', () => process.kill(process.pid, 'SIGTERM'));
  })
  .catch(fail);

// Quitting the application on defined key events.
screen.key(['escape', 'q'], () => process.kill(process.pid, 'SIGTERM'));

// Instanlling handlers for terminal signals to gracefully
// exit the application.
['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    // Destrying the screen.
    screen.destroy();
    // Logging that we are quitting the application.
    console.log('[+] Closing the terminal ...');
    // Closing the client.
    client.close().then(() => process.exit(0)).catch(() => process.exit(-1));
  })
});

// Rendering the screen.
screen.render();