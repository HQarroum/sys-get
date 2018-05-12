const system = require('systeminformation');

/**
 * CPU module entry point.
 */
module.exports = {
  get: () => Promise.all([ system.cpu(), system.currentLoad(), system.cpuTemperature(), system.cpuCurrentspeed() ]).then((results) => ({
      information: results[0],
      load: results[1],
      temperature: results[2],
      speed: results[3]
    })
  )
};