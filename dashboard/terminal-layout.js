const blessed = require('blessed');
const os      = require('os');
const pty     = require('node-pty');
const Node    = blessed.Node;
const Box     = blessed.Box;

/**
 * Terminal constructor.
 * @param {*} options options object.
 */
function Terminal(options) {
  if (!(this instanceof Node)) return new Terminal(options);

  var self = this;
  options = options || {};
  options.bold = true;
  this.options = options;
  this.data = {};
  this.nodeLines = [];
  this.lineNbr = 0;
  this.shell = options.shell || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');
  Box.call(this, options);

  options.extended = options.extended || false;
  options.keys = options.keys || ['+', 'space', 'enter'];

  options.template = options.template || {};
  options.template.extend = options.template.extend || ' [+]';
  options.template.retract = options.template.retract || ' [-]';
  options.template.lines = options.template.lines || false;

  // Do not set height, since this create a bug where the first line is not always displayed
  this.rows = blessed.list({
    top: 1,
    width: 0,
    left: 1,
    style: options.style,
    padding: options.padding,
    keys: true,
    tags: options.tags,
    input: options.input,
    vi: options.vi,
    ignoreKeys: options.ignoreKeys,
    scrollable: options.scrollable,
    mouse: options.mouse,
    selectedBg: 'blue',
  });

  this.append(this.rows);

  this.rows.key(options.keys, function() {
    /*var selectedNode = self.nodeLines[this.getItemIndex(this.selected)];
    if (selectedNode.children) {
      selectedNode.extended = !selectedNode.extended;
      self.setData(self.data);
      self.screen.render();
    }

    self.emit('select', selectedNode, this.getItemIndex(this.selected));*/
  });
  this.content = '';
  this.on('keypresss', function (ch, key) {
    console.log('key');
  });

};

/**
 * Sets the focus on the terminal.
 */
Terminal.prototype.focus = function() {
  this.rows.focus();
};

/**
 * Renders the current `Box`.
 */
Terminal.prototype.render = function () {
  Box.prototype.render.call(this);
};

/**
 * Spawns a new terminal instance.
 * @param {*} path the path at which to start the
 * shell in the terminal.
 */
Terminal.prototype.spawn = function (path) {
  /*this.ptyProcess = pty.spawn(this.shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: path || process.env.HOME,
    env: process.env
  });*/

  /*this.ptyProcess.on('data', (data) => {
    this.content += data;
    this.setContent(this.content);
    //this.render();
  });*/
};

// Inheriting the `Box` prototype.
Terminal.prototype.__proto__ = Box.prototype;

// Setting the widget type.
Terminal.prototype.type = 'terminal';

// Exporting the `Terminal` constructor.
module.exports = Terminal;