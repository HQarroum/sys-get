const EventEmitter = require('events').EventEmitter;

/**
 * Expressify PTY implementation.
 */
class PtyExpressify extends EventEmitter {

  /**
   * PTY local constructor.
   * @param {*} impl a reference to the Expressify
   * client.
   */
  constructor(client) {
    super();
    this.client = client;
  }

  /**
   * Writes `data` on the terminal.
   * @param {*} data the data to send to the terminal.
   */
  write(data) {
    if (this.uuid) {
      this.client.put(`/system/pty/${this.uuid}`, { data });
    }
  }

  /**
   * Resizes the terminal.
   * @param {*} width the width of the terminal.
   * @param {*} height the height of the terminal.
   */
  resize(width, height) {
    if (this.uuid) {
      this.client.patch(`/system/pty/${this.uuid}`, { data: {
        request: 'resize',
        width, height
      }});
    }
  }

  /**
   * Destroys the terminal.
   */
  destroy() {
    if (this.uuid) {
      this.client.delete(`/system/pty/${this.uuid}`);
    }
  }

  /**
   * Creates a new PTY.
   * @param {*} shell the `shell` to use.
   * @param {*} args the arguments to pass to the shell.
   * @param {*} options the options to pass to the terminal.
   */
  fork(shell, args, options) {
    this.client.post('/system/pty', { data: {
      shell, args, options
    }}).then((res) => {
      this.uuid = res.payload.uuid;
      this.client.subscribe(`/system/pty/${this.uuid}`, (data) => {
        this.emit('data', data.payload);
      });
      this.emit('ready');
    });
    return (this);
  }
};

module.exports = PtyExpressify;
