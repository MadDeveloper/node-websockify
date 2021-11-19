const net = require("net")
const http = require("http")
const https = require("https")
const { URL } = require("url")
const path = require("path")
const fs = require("fs")
const mime = require("mime")
const WebSocketServer = require("ws").Server

let webServer = null
let wsServer = null
let sourcePort = null
let targetHost = null
let targetPort = null
let web = false
let callbacks = {}

// Handle new WebSocket client
function onConnectWebsocketClient(client) {
  const target = net.createConnection(targetPort, targetHost, () => {
    if (typeof callbacks.onConnected === "function") {
      try {
        callbacks.onConnected(client, target)
      } catch (e) {
        target.end()
      }
    }
  })

  target.on("data", (data) => {
    try {
      client.send(data)
    } catch (e) {
      target.end()
    }
  })
  target.on("end", () => client.close())
  target.on("error", () => {
    target.end()
    client.close()
  })

  client.on("message", (msg) => target.write(msg))
  client.on("close", (code, reason) => {
    if (typeof callbacks.onDisconnected === "function") {
      try {
        callbacks.onDisconnected(client, target, code, reason)
      } catch (e) {}
    }

    target.end()
  })
  client.on("error", () => target.end())
}

// Send an HTTP error response
function requestError(response, code, msg) {
  response.writeHead(code, { "Content-Type": "text/plain" })
  response.write(msg + "\n")
  response.end()

  return
}

// Process an HTTP static file request
function requestListener(request, response) {
  if (!web) {
    return requestError(response, 403, "403 Permission Denied")
  }

  const pathname = new URL(request.url).pathname
  let filename = path.join(web, pathname)
  const exists = fs.existsSync(filename)

  if (!exists) {
    return requestError(response, 404, "404 Not Found")
  }

  if (fs.statSync(filename).isDirectory()) {
    filename += "/index.html"
  }

  fs.readFile(filename, "binary", (error, file) => {
    if (error) {
      return requestError(response, 500, error)
    }

    response.setHeader("Content-type", mime.getType(path.parse(pathname).ext))
    response.writeHead(200)
    response.write(file, "binary")
    response.end()
  })
}

module.exports = (args = {}, _callbacks = null) => {
  web = args.web || web
  callbacks = _callbacks || callbacks || {}

  const { source, target, server, webSocketServer } = args || {}

  // parse source and target arguments into parts
  try {
    if (source.includes(":")) {
      sourcePort = parseInt(source.slice(source.indexOf(":") + 1), 10)
    } else {
      sourcePort = parseInt(source, 10)
    }

    if (!target.includes(":")) {
      throw "target must be host:port"
    }

    const [host, port] = target.split(":")

    targetHost = host
    targetPort = port

    if (isNaN(sourcePort) || isNaN(targetPort)) {
      throw "illegal port"
    }
  } catch (error) {
    return [null, null, error]
  }

  if (server) {
    webServer = server
  } else {
    if (args.cert) {
      args.key = args.key || args.cert

      const cert = fs.readFileSync(args.cert)
      const key = fs.readFileSync(args.key)

      webServer = https.createServer({ cert, key }, requestListener)
    } else {
      webServer = http.createServer(requestListener)
    }
  }

  if (webSocketServer) {
    wsServer = webSocketServer
  } else {
    wsServer = new WebSocketServer({ server: webServer })
  }

  wsServer.on("connection", onConnectWebsocketClient)

  if (!server) {
    try {
      webServer.listen(sourcePort)
    } catch (error) {
      return [webServer, wsServer, error]
    }
  }

  return [webServer, wsServer, null]
}
