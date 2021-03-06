const prettyBytes = require('pretty-bytes');
const moment      = require('moment');
const chalk       = require('chalk');
const progress    = require('cli-progress');

/**
 * Converts the given number of seconds to a day, hours, minutes
 * and seconds textual representation.
 * @param {} seconds the number of seconds to convert.
 */
const secondstoTime = (seconds) => {
  const days = Math.floor(seconds / (24 * 60 * 60));
      seconds -= days * (24 * 60 * 60);
  const hours = Math.floor(seconds / (60 * 60));
      seconds -= hours * (60 * 60);
  const minutes = Math.floor(seconds / (60));
      seconds -= minutes * (60);
  return ((0 < days) ? (days + " day(s), ") : "") + hours + "h, " + minutes + "m and " + seconds + "s";
};

/**
 * Helper function to create a progress bar.
 * @param {*} format the progress bar format to use.
 * @param {*} value the value to associate with the progress bar.
 */
const progressBar = (format, value) => {
  const bar = new progress.Bar({}, {
    format: format,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  });
  bar.start(100, value);
  bar.stop();
};

/**
 * Renders the CPU usage progress bar for a given
 * core.
 * @param {*} cpu load information about a CPU core.
 * @param {*} idx the index of the core.
 */
const cpuUsage = (cpu, idx) => {
  progressBar(
    `Core #${idx} ${chalk.grey('{bar}')} {percentage}%`,
    cpu.load
  );
};

/**
 * Renders the memory usage progress bar.
 * @param {*} memory the memory information object.
 */
const memoryUsage = (memory) => {
  const percent = (memory.used * 100) / memory.total;
  const color   = percent < 50 ? chalk.green : percent > 80 ? chalk.red : chalk.yellow;
  progressBar(
    `Memory usage ${color('{bar}')} {percentage}%`,
    percent
  );
};

/**
 * Renders the swap usage progress bar.
 * @param {*} memory the memory information object.
 */
const swapUsage = (memory) => {
  const percent = (memory.swapused * 100) / memory.swaptotal;
  const color   = percent < 50 ? chalk.green : percent > 80 ? chalk.red : chalk.yellow;
  progressBar(
    `Swap usage   ${color('{bar}')} {percentage}%`,
    percent
  );
};

module.exports = {
  
  /**
   * Dumps processes information to the standard output.
   */
  processes: (processes) => {
    console.log(chalk.underline.red.bold('Processes Information'));
    console.log(` - ${chalk.bold(processes.all)} processes are currently executed by the host.`);
    console.log(` - ${chalk.bold(processes.running)} are currently running processes on the host.`);
    console.log(` - ${chalk.bold(processes.sleeping)} are currently sleeping processes on the host.`);
  },

  /**
   * Dumps CPU information to the standard output.
   */
  cpu: (cpu) => {
    console.log(chalk.underline.cyan.bold('CPU Information'));
    console.log(` - Average system load is ${chalk.bold(cpu.load.avgload)}.`);
    console.log(` - There are ${chalk.bold(cpu.load.cpus.length)} CPUs available on the host.`);
    console.log(` - ${chalk.bold(cpu.information.manufacturer)} ${chalk.bold(cpu.information.brand)} from ${chalk.bold(cpu.information.vendor)} cadenced at a frequency of ${chalk.bold(cpu.information.speed + 'Ghz')}.`);
    console.log(` - CPU temperature is ${chalk.bold(cpu.temperature.main)} degrees celsius.`);
    console.log();
    // Displaying CPU load for each core.
    cpu.load.cpus.forEach(cpuUsage);
  },

  /**
   * Dumps memory information to the standard output.
   */
  memory: (memory) => {
    console.log(chalk.underline.magenta.bold('Memory Information'));
    console.log(` - ${chalk.bold(prettyBytes(memory.total))} total memory available, (${chalk.bold(prettyBytes(memory.free))} free, ${chalk.bold(prettyBytes(memory.used))} used, ${chalk.bold(prettyBytes(memory.active))} active).`);
    console.log(` - ${chalk.bold(prettyBytes(memory.swaptotal))} total swap available, (${chalk.bold(prettyBytes(memory.swapfree))} free, ${chalk.bold(prettyBytes(memory.swapused))} used).`);
    console.log();
    // Displaying memory usage progress bar.
    memoryUsage(memory);
    // Displaying swap usage progress bar.
    swapUsage(memory);
  },

  /**
   * Dumps network information to the standard output.
   */
  network: (network) => {
    console.log(chalk.underline.yellow.bold('Network Interfaces'));
    network.interfaces.forEach((iface) => {
      console.log(` ${chalk.bold(iface.iface)}${iface.default ? chalk.bold(' (Default)') : ''}`);
      iface.ip4 && console.log(`  - IPv4 (${iface.ip4}).`);
      iface.ip6 && console.log(`  - IPv6 (${iface.ip6}).`);
      iface.mac && console.log(`  - MAC (${iface.mac}).`);
      iface.stats && console.log(`  - RX (${prettyBytes(iface.stats.rx_sec)}/second), TX (${prettyBytes(iface.stats.tx_sec)}/second).`);
    });
  },

  /**
   * Dumps storage information to the standard output.
   */
  storage: (storage) => {
    console.log(chalk.underline.blue.bold('Storage Information'));
    console.log(` -> Available file systems :`);
    for (let i = 0; i < storage.filesystems.length; ++i) {
      console.log(`   - ${chalk.bold(storage.filesystems[i].fs)} mounted on ${chalk.bold(storage.filesystems[i].mount)} using a ${chalk.bold(storage.filesystems[i].type)} filesystem (${chalk.bold(prettyBytes(+storage.filesystems[i].size))}, ${chalk.bold(Math.round(storage.filesystems[i].use))} % currently in use).`);
    }
    console.log(` -> Available block devices :`);
    for (let i = 0; i < storage.devices.length; ++i) {
      console.log(`   - ${chalk.bold(storage.devices[i].name)} (${storage.devices[i].physical}) - ${chalk.bold(storage.devices[i].label ? storage.devices[i].label + ' - ' : 'Unknown Label - ')}${chalk.bold(storage.devices[i].model || 'Unknown Model')} - ${chalk.bold(storage.devices[i].protocol || 'Unknown Protocol')}.`);
    }
    // I/Os are not available on Windows.
    if (!storage.ios) return;
    console.log(` -> Throughput :`);
    console.log(`   - ${Math.round(storage.ios.rIO_sec)} reads/second.`);
    console.log(`   - ${Math.round(storage.ios.wIO_sec)} writes/second.`);
  },

  /**
   * Dumps OS information to the standard output.
   */
  os: (os) => {
    console.log(chalk.underline.green.bold('OS & HW Information'));
    console.log(` - ${os.hw.manufacturer} ${chalk.bold(os.hw.model)} (${os.hw.serial}).`);
    console.log(` - Host OS is a ${chalk.bold(os.information.os.distro)} (${os.information.os.release}) on a ${os.information.os.platform} platform (${chalk.bold(os.information.os.arch)}).`);
    console.log(` - Hostname - ${chalk.bold(os.information.os.hostname)}.`);
    console.log(` - Kernel version is ${chalk.bold(os.information.versions.kernel)}, with a ${chalk.bold(os.information.versions.openssl)} OpenSSL version, and a ${chalk.bold(os.information.versions.node)} node version.`);
    console.log(` - Host time - ${chalk.bold(moment(os.time.current))} in the ${chalk.bold(os.time.timezoneName)} timezone.`);
    console.log(` - Uptime - ${chalk.bold(secondstoTime(os.time.uptime))}.`);
  },

  /**
   * Dumps information on the Graphics Card to the standard output.
   */
  graphics: (graphics) => {
    console.log(chalk.underline.white.bold('Graphics Information'));
    console.log(` -> Graphic cards :`);
    graphics.controllers.forEach((controller) => {
      console.log(`   - ${chalk.bold(controller.model || 'Unknown')} (${chalk.bold(controller.bus || 'Unknown Bus')}) ${controller.vram}MB of VRAM, manufactured by ${controller.vendor || 'Unknown'}.`);
    });
    console.log(` -> Available displays :`);
    graphics.displays.forEach((display) => {
      console.log(`   - ${chalk.bold(display.model)} (${chalk.bold(display.connection)}) - ${display.resolutionx}x${display.resolutiony}.`);
    });
  }
}