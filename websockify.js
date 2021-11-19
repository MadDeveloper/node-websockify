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
let source_port = null
let target_host = null
let target_port = null
let web = false
let callbacks = {}

// Handle new WebSocket client
function onConnectWebsocketClient(client) {
  const target = net.createConnection(target_port, target_host, () => {
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

module.exports = (options, _callbacks) => {
  web = options.web || web
  callbacks = _callbacks || callbacks || {}

  const source_arg = options.source
  const target_arg = options.target

  // parse source and target arguments into parts
  try {
    if (source_arg.includes(":")) {
      source_port = parseInt(source_arg.slice(source_arg.indexOf(":") + 1), 10)
    } else {
      source_port = parseInt(source_arg, 10)
    }

    if (!target_arg.includes(":")) {
      throw "target must be host:port"
    }

    const [host, port] = target_arg.split(":")

    target_host = host
    target_port = port

    if (isNaN(source_port) || isNaN(target_port)) {
      throw "illegal port"
    }
  } catch (error) {
    // websockify.js [--web web_dir] [--cert cert.pem [--key key.pem]] [source_addr:]source_port target_addr:target_port
    return [null, null, error]
  }

  if (options.cert) {
    options.key = options.key || options.cert

    const cert = fs.readFileSync(options.cert)
    const key = fs.readFileSync(options.key)

    webServer = https.createServer({ cert, key }, requestListener)
  } else {
    webServer = http.createServer(requestListener)
  }

  wsServer = new WebSocketServer({ server: webServer })
  wsServer.on("connection", onConnectWebsocketClient)

  webServer.listen(source_port)

  return [webServer, wsServer, null]
}
