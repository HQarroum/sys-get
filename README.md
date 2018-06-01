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

#### Focus

Some of the widgets mounted on the dashboard grid can earn a focus, it is the case for the *terminal* widget which has the focus by default, as well for the *process* widget. In order to switch the focus between widgets use the **Ctrl+K** shortcut.

### Using `sys-get` remotely

One of the nicest feature of `sys-get` is to be able to expose a RESTful interface, using the [`expressify`](https://github.com/HQarroum/expressify) framework, on top of any transport mechanism.

#### Exposing metrics over IPC

It is sometimes useful to expose system metrics to another process running on the same host in order to decouple services but also to avoid an unecessary development. To start serving the `sys-get` API over the IPC transport, run the following command.

```bash
sys-get serve --use-expressify ipc
```

> Note that the `ipc` transport is selected by default when `sys-get serve` is run, and omitting the `use-expressify` options will have the same effect as the above command.

##### IPC advanced options

The [ipc strategy](https://github.com/HQarroum/expressify-ipc) for Expressify uses local sockets to operate the communication between processes in a cross-platform manner, these sockets can be attributed an `endpoint` which uniquely identifies the server to communicate with, and a `namespace` which is used to partition in topics the communication with an endpoint.

To specify an new endpoint or namespace, you can selectively use the following options. Below is an example where the endpoint is `expressif.server` and the namespace is `foo`.

```bash
sys-get serve --use-expressify ipc --endpoint expressify.server --namespace foo
```

This is a useful option if you happen to run multiple instances of a `sys-get serve` on the same host.

##### Using `sys-get` as a client

Once you have a running `sys-get serve` instance running on your host, you can run `sys-get` as a client to query it. Below is an example of how to connect the live dashboard to your server instance.

```bash
sys-get dashboard --use-expressify ipc
```

> If you changed the `namespace` or the `endpoint` on your server, you can specify them when running the client using the same `--endpoint` and `--namespace` options which we previously saw when running the server.

#### Exposing metrics over MQTT

The [mqtt strategy](https://github.com/HQarroum/expressify-mqtt) for Expressify uses MQTT topics to operate the communication between a `sys-get` server and a client.

To start serving the `sys-get` API over the MQTT transport, run the following command.

```bash
sys-get serve --use-expressify mqtt --mqtt-opts /path/to/config.json
```

The `mqtt-opts` sepcifier indicates to `sys-get` the location of the MQTT description file indicating where certificates are located on your host filesystem, amongst other options.

##### Updating the base topic

When the MQTT strategy is run, it defaults to a communication scheme based on `system` topic. Below is an example of how to update this topic to have another value.

```bash
sys-get serve --use-expressify mqtt --mqtt-opts /path/to/config.json --topic my/topic
```

## Examples

## See also

 - The [Expressify](https://github.com/HQarroum/expressify) framework.
 - The [expressify-ipc](https://github.com/HQarroum/expressify-ipc) strategy supporting local sockets as a transport.
 - The [expressify-mqtt](https://github.com/HQarroum/expressify-mqtt) strategy supporting MQTT as a transport.
 - The [systeminformation]() module.

