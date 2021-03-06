const program = require('commander');
const pb      = require('pretty-bytes');
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

/**
 * The domains we are notifying the client about.
 */
const domains = [
  'processes',
  'cpu',
  'storage',
  'memory',
  'network'
];

/**
 * Network stats.
 */
const tx = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const rx = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

/**
 * Dashboard widgets instanciations.
 */

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
 * Helper function returning the current time
 * in a textual form.
 */
const getTime = () => {
  const date  = new Date();
  return `${date.getHours()}:${date.getMinutes()}`;
};

// Storage donut layout.
const donut = grid.set(8, 8, 4, 2, contrib.donut, {
  label: 'Used Storage Space',
  radius: 16,
  arcWidth: 4,
  yPadding: 2,
  data: [{ label: 'Storage', percent: 0 }]
});

// Memory usage gauge layout.
const gauge = grid.set(8, 10, 2, 2, contrib.gauge, {
  label: 'Memory (Free, Used, Swap)',
  percent: [10, 10, 10]
});

// Main network card throughput.
const sparkline = grid.set(10, 10, 2, 2, contrib.sparkline, {
  label: 'Throughput (kbits/sec)',
  tags: true,
  style: { fg: 'blue', titleFg: 'white' }
});

// Bar layout for CPU cores utilization.
const bar = grid.set(4, 6, 4, 3, contrib.bar, {
  label: 'CPU Core Utilization (%)',
  barWidth: 4,
  barSpacing: 8,
  xOffset: 2,
  maxHeight: 100
});

// Running processes table layout.
const table = grid.set(2, 9, 6, 3, contrib.table, {
  keys: true,
  fg: 'yellow',
  label: 'Running Processes',
  columnSpacing: 1,
  columnWidth: [24, 10, 10, 10]
});

// CPU temperature layout.
const lcdLineOne = grid.set(0,9,2,3, contrib.lcd, {
  label: 'CPU Temperature',
  display: '-----',
  segmentWidth: 0.06,
  segmentInterval: 0.11,
  strokeWidth: 0.1,
  elements: 5,
  elementSpacing: 4,
  elementPadding: 2
});

// Disk throughput graph layout.
const diskLine = grid.set(0, 6, 4, 3, contrib.line, {
  style: {
    line: 'red',
    text: 'white',
    baseline: 'black'
  },
  label: 'Disk Throughput',
  showLegend: true 
});

// System statistics graph layout.
const transactionsLine = grid.set(0, 0, 6, 6, contrib.line, {
  showNthLabel: 5,
  maxY: 600,
  label: 'System Statistics',
  showLegend: true,
  legend: { width: 12 }
});

// Log layout.
const log = grid.set(8, 6, 4, 2, contrib.log, {
  fg: 'green',
  selectedFg: 'green',
  label: 'Server Log'
});

// CPU line.
const cpuLine = {
  title: 'CPU',
  style: { line: 'red' },
  x: [],
  y: []
};

// Memory line.
const memoryLine = {
  title: 'Memory',
  style: { line: 'yellow' },
  x: [],
  y: []
};

// Processes line.
const processesLine = {
  title: 'Processes',
  style: { line: 'green' },
  x: [],
  y: []
};

// Disk read throughput data.
var diskReadData = {
  title: 'Read I/O',
  style: { line: 'red' },
  x: [],
  y: []
};

// Disk write throughput data.
var diskWriteData = {
  title: 'Write I/O',
  style: { line: 'green' },
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
  let load    = 0;

  cpu.load.cpus.forEach((cpu, idx) => {
    // Adding a title to a CPU Core bar.
    cores.push(`#${idx}`);
    // Adding its associated value.
    array.push(Math.round(cpu.load));
    // Suming up core loads.
    load += Math.round(cpu.load);
  });
  // Averaging the load across the cores.
  load /= cpu.load.cpus.length;
  // Shifting values.
  if (cpuLine.x.length > 50) {
    cpuLine.x.shift(); cpuLine.y.shift();
  }
  // Updating line.
  cpuLine.x.push(getTime());
  cpuLine.y.push(load);
  // Updating the graph data.
  setLineData([cpuLine, memoryLine, processesLine], transactionsLine);
  // Updating the bar.
  bar.setData({ titles: cores, data: array });
  // Updating the CPU temperature.
  const value = cpu.temperature.main;
  lcdLineOne.setDisplay(value > 0 ? value : 'N-A');
  lcdLineOne.setOptions({
    color: value > 90 ? 'red' : value > 70 ? 'yellow' : 'green',
    elementPadding: 4
  });
  // Refreshing the screen.
  screen.render();
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
  let percent = (used * 100) / total;
  if (percent > 99) percent = 0.00;
  if (percent >= 25) color = 'cyan';
  if (percent >= 50) color = 'yellow';
  if (percent >= 75) color = 'red';
  // Shifting values.
  if (diskReadData.x.length > 15) {
    diskReadData.x.shift(); diskReadData.y.shift();
    diskWriteData.x.shift(); diskWriteData.y.shift();
  }
  if (storage.ios) {
    // Updating line.
    diskReadData.x.push(getTime());
    diskReadData.y.push(storage.ios.rIO_sec);
    diskWriteData.x.push(getTime());
    diskWriteData.y.push(storage.ios.wIO_sec);
  }
  // Updating the disk throughput graph.
  setLineData([diskReadData, diskWriteData], diskLine);
  // Updating the storage donut.
  donut.setData([
    { percent: Math.round(percent), label: 'storage', color }
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
  const mem      = Math.round((memory.used * 100) / memory.total);
  // Updating the memory gauge.
  gauge.setStack([memFree, memUsed, swapUsed]);
  // Shifting values.
  if (memoryLine.x.length > 50) {
    memoryLine.x.shift();
    memoryLine.y.shift();
  }
  // Updating values.
  memoryLine.x.push(getTime());
  memoryLine.y.push(mem);
  // Updating the graph data.
  setLineData([cpuLine, memoryLine, processesLine], transactionsLine);
};

/**
 * Refreshes the processes state in the dashboard.
 * @param {*} processes the processes information object.
 */
const refreshProcesses = (processes) => {
  var data = [];

  processes.list.sort((a, b) => b.pcpu - a.pcpu).forEach((process) => {
    const row = [];
    row.push(process.name);
    row.push(`${Math.round(process.pcpu)}%`);
    row.push(`${Math.round(process.pmem)}%`);
    row.push(process.user);
    data.push(row);
  });
  // Updating the process list.
  table.setData({ headers: ['Process', 'Cpu', 'Memory', 'User'], data });
  // Shifting values.
  if (processesLine.x.length > 50) {
    processesLine.x.shift();
    processesLine.y.shift();
  }
  // Updating values.
  processesLine.x.push(getTime());
  processesLine.y.push(processes.list.length);
  // Updating the graph data.
  setLineData([cpuLine, memoryLine, processesLine], transactionsLine);
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
 * Refreshes the dashboard view with the
 * given `results.
 * @param {*} results the results to use to update
 * the dashboard.
 */
const render = (results) => {
  results.forEach((o) => {
    if (o.command === 'cpu') {
      refreshCpu(o.res);
    } else if (o.command === 'storage') {
      refreshStorage(o.res);
    } else if (o.command === 'memory') {
      refreshMemory(o.res);
    } else if (o.command === 'network') {
      refreshNetwork(o.res);
    } else if (o.command === 'processes') {
      refreshProcesses(o.res);
    }
  });
  // Rendering the screen.
  screen.render();
};

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

/**
 * Loads system information periodically at
 * a `rate` interval.
 */
const refresh = () => client.some(domains).then((results) => render(results)).catch(fail);

// Preparing the client and refreshing the dashboard 
// information.
client.prepare()
  .then(() => {
    // Creating a new terminal.
    const terminal = new XTerm(Object.assign({}, opts, {
      left:    0,
      top:     31,
      width:   Math.floor(screen.width / 2),
      height:  30,
      label:   'Remote Terminal',
      ptyInstance: client.pty()
    }));

    // Waiting for the `ready` event.
    terminal.once('ready', () => {
      terminal.write(hint);
      terminal.focus();
      screen.append(terminal);
    });

    // On a PTY error, we exit the application.
    terminal.on('error', fail);

    // Logging client initialization.
    log.log('[+] Client initialized.');
    
    // Gracefully exits the application on `exit`.
    terminal.on('exit', () => process.kill(process.pid, 'SIGTERM'));

    // Triggering immediate `refresh` and subscribing to domains.
    return (refresh().then(() => {
      // Logging reception of all metrics.
      log.log('[+] Got all metrics from the host.');
      domains.forEach((domain) => client.subscribe(domain, (topic, value) => {
        log.log(`[+] Received '${topic}' update.`);
        render(value);
      }));
    }));
  })
  .catch(fail);

// Quitting the application on defined key events.
screen.key(['escape', 'q'], () => process.kill(process.pid, 'SIGTERM'));

// Handling changes of focus.
screen.key(['C-k'], () => screen.focusNext());

// Attaching on a `resize` event.
screen.on('resize', function () {
  donut.emit('attach');
  gauge.emit('attach');
  sparkline.emit('attach');
  bar.emit('attach');
  table.emit('attach');
  lcdLineOne.emit('attach');
  transactionsLine.emit('attach');
  log.emit('attach');
});

// Instanlling handlers for terminal signals to gracefully
// exit the application.
['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    // Destrying the screen.
    screen.destroy();
    // Logging that we are quitting the application.
    console.log('[+] Closing the dashboard ...');
    // Closing the client.
    client.close().then(() => process.exit(0)).catch(() => process.exit(-1));
  })
});

// Rendering the screen.
screen.render();