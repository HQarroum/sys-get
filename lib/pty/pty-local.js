const EventEmitter = require('events').EventEmitter;
const Pty          = require('node-pty');
const os           = require('os');

/**
 * Local PTY implementation.
 */
class PtyLocal extends EventEmitter {

  /**
   * PTY local constructor.
   * @param {*} impl a reference to the concrete
   * PTY implementation.
   */
  constructor(impl) {
    super();
    // Concrete PTY implementation.
    this.impl = impl;
  }

  /**
   * Writes `data` on the terminal.
   * @param {*} data the data to send to the terminal.
   */
  write(data) {
    return (this.pty ? 
      Promise.resolve(this.pty.write(data)) : Promise.reject()
    );
  }

  /**
   * Resizes the terminal.
   * @param {*} width the width of the terminal.
   * @param {*} height the height of the terminal.
   */
  resize(width, height) {
    return (this.pty ? 
      Promise.resolve(this.pty.resize(width, height)) : Promise.reject()
    );
  }

  /**
   * Destroys the terminal.
   */
  destroy() {
    return (this.pty ? 
      Promise.resolve(this.pty.destroy()) : Promise.reject()
    );
  }

  /**
   * Creates a new PTY.
   * @param {*} shell the `shell` to use.
   * @param {*} args the arguments to pass to the shell.
   * @param {*} options the options to pass to the terminal.
   */
  fork(shell, args, options) {
    if (!shell) {
      // Set the system `shell`.
      shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');
    }
    this.pty = Pty.fork(shell, args, options);
    // Subscribing to events.
    this.pty.on('data', (data) => this.emit('data', data));
    setImmediate(() => this.pty.emit('ready'));
    return (this.pty);
  }
};

module.exports = PtyLocal;
