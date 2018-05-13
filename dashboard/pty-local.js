const EventEmitter = require('events').EventEmitter;
const Pty          = require('node-pty');

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
    if (this.pty) {
      this.pty.write(data);
    }
  }

  /**
   * Resizes the terminal.
   * @param {*} width the width of the terminal.
   * @param {*} height the height of the terminal.
   */
  resize(width, height) {
    if (this.pty) {
      this.pty.resize(width, height);
    }
  }

  /**
   * Destroys the terminal.
   */
  destroy() {
    if (this.pty) {
      this.pty.destroy();
    }
  }

  /**
   * Creates a new PTY.
   * @param {*} shell the `shell` to use.
   * @param {*} args the arguments to pass to the shell.
   * @param {*} options the options to pass to the terminal.
   */
  fork(shell, args, options) {
    this.pty = Pty.fork(shell, args, options);
    // Subscribing to events.
    this.pty.on('data', (data) => this.emit('data', data));
    setImmediate(() => this.pty.emit('ready'));
    return (this.pty);
  }
};

module.exports = PtyLocal;
