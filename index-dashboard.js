const program = require('commander');
const os      = require('os');
const pb      = require('pretty-bytes');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const layout  = require('./dashboard/terminal-layout');
const system  = require('./lib');
const XTerm   = require('./dashboard/blessed-xterm');

// Creating a new screen instance.
const screen = blessed.screen();

// Creating a new grid on the screen.
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// Instanciating the client.
const client = system.factory(program);

// The application refresh rate.
const rate = program.refreshRate || (2 * 1000);

/**
 * Network stats.
 */
const tx = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const rx = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

// Terminal options.
let opts = {
  shell:         process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'sh'),
  args:          [],
  env:           process.env,
  cwd:           process.cwd(),
  cursorType:    "block",
  border:        "line",
  scrollback:    1000,
  style: {
    fg:        "default",
    bg:        "default",
    border:    { fg: "default" },
    focus:     { border: { fg: "green" } },
    scrolling: { border: { fg: "red" } }
  }
};

// Terminal hint.
let hint = "\r\nWelcome in the remote shell.\r\n" +
    "Press Q to exit the application.\r\n\r\n";

// Storage donut layout.
const donut = grid.set(8, 8, 4, 2, contrib.donut, 
  { label: 'Used Storage Space',
    radius: 16,
    arcWidth: 4,
    yPadding: 2,
    data: [{ label: 'Storage', percent: 0 }]
  });

// Memory usage gauge layout.
const gauge = grid.set(8, 10, 2, 2, contrib.gauge, { label: 'Memory (Free, Used, Swap)', percent: [10, 10, 10] });

// Main network card throughput.
const sparkline = grid.set(10, 10, 2, 2, contrib.sparkline, 
  { label: 'Throughput (kbits/sec)'
  , tags: true
  , style: { fg: 'blue', titleFg: 'white' }});

// Bar layout for CPU cores utilization.
const bar = grid.set(4, 6, 4, 3, contrib.bar, 
  { label: 'CPU Core Utilization (%)'
  , barWidth: 4
  , barSpacing: 8
  , xOffset: 2
  , maxHeight: 100});

// Running processes table layout.
const table = grid.set(2, 9, 6, 3, contrib.table, 
  { keys: true
  , fg: 'yellow'
  , label: 'Running Processes'
  , columnSpacing: 1
  , columnWidth: [24, 10, 10, 10]});

// CPU temperature layout.
const lcdLineOne = grid.set(0,9,2,3, contrib.lcd,
  { label: 'CPU Temperature',
    segmentWidth: 0.06,
    segmentInterval: 0.11,
    strokeWidth: 0.1,
    elements: 5,
    elementSpacing: 4,
    elementPadding: 2
  });

const errorsLine = grid.set(0, 6, 4, 3, contrib.line, 
  { style: 
    { line: "red"
    , text: "white"
    , baseline: "black"}
  , label: 'Errors Rate'
  , showLegend: true });

// System statistics graph layout.
const transactionsLine = grid.set(0, 0, 6, 6, contrib.line, 
  { showNthLabel: 5
  , maxY: 600
  , label: 'System Statistics'
  , showLegend: true
  , legend: {width: 12}});

// Log layout.
const log = grid.set(8, 6, 4, 2, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: 'Server Log'
});

// CPU line.
const cpuLine = {
  title: 'CPU',
  style: {line: 'red'},
  x: [],
  y: []
};

// Memory line.
const memoryLine = {
  title: 'Memory',
  style: {line: 'yellow'},
  x: [],
  y: []
};

// Processes line.
const processesLine = {
  title: 'Processes',
  style: {line: 'green'},
  x: [],
  y: []
};

/**
 * Helper function to update a line chart with the
 * givrn data.
 */
const setLineData = (mockData, line) => {
  for (var i = 0; i < mockData.length; i++) {
    var last = mockData[i].y[mockData[i].y.length-1];
    mockData[i].y.shift();
    var num = Math.max(last + Math.round(Math.random() * 10) - 5, 10);
    mockData[i].y.push(num);
  }
  line.setData(mockData);
};

/**
 * Refreshes the CPU state in the dashboard.
 * @param {*} cpu the CPU information object.
 */
const refreshCpu = (cpu) => {
  const cores = [];
  const array = [];

  cpu.load.cpus.forEach((cpu, idx) => {
    // Adding a title to a CPU Core bar.
    cores.push(`#${idx}`);
    // Adding its associated value.
    array.push(Math.round(cpu.load));
  });
  // Updating the bar.
  bar.setData({ titles: cores, data: array });
  // Updating the CPU temperature.
  const value = cpu.temperature.main;
  lcdLineOne.setDisplay(value);
  lcdLineOne.setOptions({
    color: value > 90 ? 'red' : value > 70 ? 'yellow' : 'green',
    elementPadding: 4
  });
};

/**
 * Refreshes the storage state in the dashboard.
 * @param {*} storage the storage information object.
 */
const refreshStorage = (storage) => {
  let total = 0;
  let used  = 0;
  let color = 'green';

  storage.filesystems.forEach((storage) => {
    total += storage.size;
    used  += storage.used;
  });
  const percent = (used * 100) / total;
  if (percent > 99) percent = 0.00;
  if (percent >= 25) color = 'cyan';
  if (percent >= 50) color = 'yellow';
  if (percent >= 75) color = 'red';
  donut.setData([
    { percent: Math.round(percent), label: 'storage', color}
  ]);
};

/**
 * Refreshes the memory state in the dashboard.
 * @param {*} memory the memory information object.
 */
const refreshMemory = (memory) => {
  const total    = memory.total + memory.swaptotal;
  const memUsed  = Math.round((memory.used * 100) / total);
  const swapUsed = Math.round((memory.swapused * 100) / total);
  const memFree  = Math.round(100 - (memUsed + swapUsed));
  gauge.setStack([memFree, memUsed, swapUsed]);
};

/**
 * Refreshes the processes state in the dashboard.
 * @param {*} processes the processes information object.
 */
const refreshProcesses = (processes) => {
  var data = []

  processes.list.sort((a, b) => b.pcpu - a.pcpu).forEach((process) => {
    const row = [];
    row.push(process.name);
    row.push(`${Math.round(process.pcpu)}%`);
    row.push(`${Math.round(process.pmem)}%`);
    row.push(process.user);
    data.push(row);
  });
  table.setData({ headers: ['Process', 'Cpu', 'Memory', 'User'], data });
};

/**
 * Refreshes the network state in the dashboard.
 * @param {*} network the network information object.
 */
const refreshNetwork = (network) => {
  let tx_sec, rx_sec = 0;

  network.interfaces.forEach((iface) => {
    if (iface.default) {
      tx_sec = Math.round(iface.stats.tx_sec);
      rx_sec = Math.round(iface.stats.rx_sec);
      // Updating `TX` values.
      tx.shift(); tx.push(tx_sec);
      // Updating `RX` values.
      rx.shift(); rx.push(rx_sec);
    }
  });
  // Updating the network graph.
  try {
    sparkline.setData([`TX (${pb(tx_sec)}/s)`, `RX (${pb(rx_sec)}/s)`], [tx, rx]);
  } catch (e) {}
};

/**
 * Refreshes the system status graph.
 * @param {*} cpu the CPU information object.
 * @param {*} memory the memory information object.
 * @param {*} processes the processes information object.
 */
const refreshSystemState = (cpu, memory, processes) => {
  const date  = new Date();
  const time  = `${date.getHours()}:${date.getMinutes()}`
  const mem   = Math.round((memory.used * 100) / memory.total);
  const proc  = processes.all;
  let load    = 0;

  cpu.load.cpus.forEach((cpu) => load += Math.round(cpu.load));
  // Averaging the load across the cores.
  load /= cpu.load.cpus.length;

  // Shifting values.
  if (cpuLine.x.length > 50) {
    cpuLine.x.shift(); cpuLine.y.shift();
    memoryLine.x.shift(); memoryLine.y.shift();
    processesLine.x.shift(); processesLine.y.shift();
  }
  
  // Updating time.
  cpuLine.x.push(time);
  memoryLine.x.push(time);
  processesLine.x.push(time);

  // Updating values.
  cpuLine.y.push(load);
  memoryLine.y.push(mem);
  processesLine.y.push(proc);

  // Updating the graph data.
  setLineData([cpuLine, memoryLine, processesLine], transactionsLine);
};

// Loading system information.
const refresh = () => client.all().then((results) => {
  let cpu, memory, processes = null;
  results.forEach((o, idx) => {
    if (o.command === 'cpu') {
      refreshCpu(cpu = o.res);
    } else if (o.command === 'storage') {
      refreshStorage(o.res);
    } else if (o.command === 'memory') {
      refreshMemory(memory = o.res);
    } else if (o.command === 'network') {
      refreshNetwork(o.res);
    } else if (o.command === 'processes') {
      refreshProcesses(processes = o.res);
    }
  });
  // Updates the system state graph.
  refreshSystemState(cpu, memory, processes);
  // Rendering the screen.
  screen.render();
});

console.log('[+] Connecting to the dashboard ...');
// Preparing the client.
client.prepare()
  .then(() => {
    // Creating a new terminal.
    const terminal = new XTerm(Object.assign({}, opts, {
      left:    0,
      top:     31,
      width:   Math.floor(screen.width / 2),
      height:  30,
      label:   "Remote Terminal",
      ptyInstance: client.pty()
    }));

    // Waiting for the `ready` event.
    terminal.once('ready', () => {
      terminal.write(hint)
      terminal.focus();
      screen.append(terminal);
    });

    // Triggering immediate `refresh` and scheduling
    // subsequent refresh operations.
    return (refresh().then(() => setInterval(refresh, rate)));
  })
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  });

//set line charts dummy data

var errorsData = {
  title: 'server 1',
  x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25'],
  y: [30, 50, 70, 40, 50, 20]
}

var latencyData = {
  x: ['t1', 't2', 't3', 't4'],
  y: [5, 1, 7, 5]
}

setLineData([errorsData], errorsLine)


setInterval(function() {   
    setLineData([errorsData], errorsLine)
}, 1500)


// Quitting the application on defined key events.
screen.key(['escape', 'q', 'C-c'], process.exit);

// Handling change of focus.
screen.key(['right', 'left'], () => screen.focusNext());

// Attaching on a `resize` event.
screen.on('resize', function() {
  donut.emit('attach');
  gauge.emit('attach');
  sparkline.emit('attach');
  bar.emit('attach');
  table.emit('attach');
  lcdLineOne.emit('attach');
  errorsLine.emit('attach');
  transactionsLine.emit('attach');
  log.emit('attach');
});

// Rendering the screen.
screen.render();