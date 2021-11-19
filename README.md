# WebSocket-to-TCP proxy/bridge in NodeJS (forked & inspired by https://github.com/novnc/websockify)

[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://github.com/maddeveloper/node-websockify/blob/master/LICENSE.md)

Node-websockify is a WebSocket-to-TCP proxy/bridge you can use in a NodeJS program.

As said it is inspired of the javascript library of https://github.com/novnc/websockify. Unfortunately this library can't be used directly in a nodeJS program. Thats the reason why I created this project.

## Usage

Import this module in your project

```bash
npm install --save @maddeveloper/node-websockify
```

Require the module and call the main function in your program code

```javascript
import websockify from "@maddeveloper/node-websockify"

const [webServer, wsServer, error] = websockify({
  source: "url:port",
  target: "url:port",
  web: "./directory",
  cert: "certSSL",
  key: "certSSL-key",
})
```

Example :

```javascript
import websockify from "@maddeveloper/node-websockify"

const [webServer, wsServer, error] = websockify({
  source: "127.0.0.1:8080",
  target: "192.168.0.100:5900",
})
```

## Params

| Name            | Description                                       | Default         |
| --------------- | ------------------------------------------------- | --------------- |
| source          | URL of websocket Server                           | null            |
| target          | URL of the VNC Server                             | null            |
| web             | Directory of static sources exposed by the server | null (optional) |
| cert            | Path of the SSL certificate                       | null (optional) |
| key             | Key of the SSL certificate                        | null (optional) |
| server          | HTTP server to use                                | null (optional) |
| webSocketServer | WebSocket server to use                           | null (optional) |

## Options

| Name           | Description                                       | Default   |
| -------------- | ------------------------------------------------- | --------- |
| onConnected    | Called when connection is established with target | undefined |
| onDisconnected | Called when connection is interruped with target  | undefined |

## CLI usage

```bash
websockify [--web web_dir] [--cert cert.pem [--key key.pem]] [source_addr:]source_port target_addr:target_port
```
