/**
 * Facade to a concrete PTY implementation.
 */
class PtyFacade {

  /**
   * PTY constructor.
   * @param {*} impl a reference to the concrete
   * PTY implementation.
   */
  constructor(impl) {
    // Concrete PTY implementation.
    this.impl = impl;
  }

  /**
   * Creates a new PTY.
   * @param {*} shell the `shell` to use.
   * @param {*} args the arguments to pass to the shell.
   * @param {*} options the options to pass to the terminal.
   */
  fork(shell, args, options) {
    return (this.impl.fork(shell, args, options));
  }
};

module.exports = PtyFacade;