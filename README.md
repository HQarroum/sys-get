<p align="center">
  <img width="220" src="assets/logo.png" />
</p>

# sys-get
> Portable, system information provider command-line tool.

[![CodeFactor](https://www.codefactor.io/repository/github/hqarroum/sys-get/badge/master)](https://www.codefactor.io/repository/github/hqarroum/sys-get/overview/master)

Current version: **1.0.0**

Lead Maintainer: [Halim Qarroum](mailto:hqm.post@gmail.com)

## Table of contents

- [Installation](#install)
- [Features](#features)
- [Usage](#usage)
- [Examples](#examples)
- [See also](#see-also)

## Install

```bash
npm install --global sys-get
```

## Features

 - Portable monitoring of system components (CPU, Memory, Processes, Network, Storage, OS).
 - CPU temperature monitoring (see below for details).
 - Terminal based live dashboard of system metrics.
 - All features work locally or remotely by exposing system metrics through `ipc` or `mqtt` using [`expressify`](https://github.com/HQarroum/expressify).
 - Enables local and remote shell access.

## Usage

In this section, we are going to review all the commands and use-cases associated with `sys-get` command-line tool through working examples.

### Retrieving system informations

Once `sys-get` is installed, you can simply run `sys-get` without any arguments, which will dump all the system metrics currently available on the host machine.

It is also possible to filter the system metrics by topic when running `sys-get`. The available system metrics are the following :

 - **os** - Dumps general information about the host operating system.
 - **memory** - Displays available, used and total memory and swap metrics.
 - **graphics** - Lists the available graphic cards as well as the currently connected monitors.
 - **cpu** - Displays information on the CPU (architecture, model, load, etc.)
 - **storage** - Lists the available block devices and partitions on the system.
 - **network** - Displays information on the network interface and their associated metrics.
 - **processes** - Lists the current processes along with their associated metrics (memory usage, cpu load, etc.)
 
For instance, in order to display information about the CPU, the memory and the storage sub-systems, you simply run :

```bash
sys-get cpu memory storage
```

### Using the dashboard
 
The `sys-get` tool comes buit-in with a dashboard built using [blessed-contrib](https://github.com/yaronn/blessed-contrib/) allowing to display the system metrics using live graphs and structured information right in your terminal !
 
To launch the dashboard, you simply run :

```bash
sys-get dashboard
```

The information are updated at a default time interval, to update the refresh interval of the dashboard, you can specify an optional `--refresh-rate` option to `sys-get`. For instance, the following command will request the dashboard to update system metrics once every 1 second.

```bash
sys-get dashboard --refresh-rate 1000
```

> Note that the retrieval of system metrics can be a heavy process, it is thus recommended to keep the refresh rate equal or above to 1 second.

### Using `sys-get` remotely



## Examples

## See also

 - The [Expressify](https://github.com/HQarroum/expressify) framework.
 - The [expressify-ipc](https://github.com/HQarroum/expressify-ipc) strategy supporting local sockets as a transport.
 - The [systeminformation]() module.

