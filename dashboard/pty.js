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
   * @param {*} width 
   * @param {*} height 
   */
  resize(width, height) {
    return (this.impl.resize(width, height));
  }

  destroy() {
    return (this.impl.destroy());
  }
};

module.exports = Pty;
