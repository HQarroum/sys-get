const EventEmitter = require('events').EventEmitter;

/**
 * Facade to a concrete PTY implementation.
 */
class Pty extends EventEmitter {

  /**
   * PTY constructor.
   * @param {*} impl a reference to the concrete
   * PTY implementation.
   */
  constructor(impl) {
    super();
    // Concrete PTY implementation.
    this.impl = impl;
    // Subscribing to events.
    this.impl.on('data', (data) => this.emit('data', data));
  }

  /**
   * Writes `data` on the terminal.
   * @param {*} data the data to send to the terminal.
   */
  write(data) {
    return (this.impl.write(data));
  }

  /**
   * Resizes the terminal.
   * @param {*} width the width of the terminal.
   * @param {*} height the height of the terminal.
   */
  resize(width, height) {
    return (this.impl.resize(width, height));
  }

  /**
   * Destroys the terminal.
   */
  destroy() {
    return (this.impl.destroy());
  }

  /**
   * Creates a new PTY.
   * @param {*} shell the `shell` to use.
   * @param {*} args the arguments to pass to the shell.
   * @param {*} options the options to pass to the terminal.
   */
  static fork(shell, args, options) {
    return (impl.fork(shell, args, options));
  }
};

module.exports = Pty;
