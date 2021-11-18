const websockify = require("@maddeveloper/node-websockify")

const [webServer, wsServer] = websockify({
  source: "127.0.0.1:8080",
  target: "192.168.0.100:5900",
})

setTimeout(() => {
  webServer.close()
  wsServer.close()
  process.exit(0)
}, 5000)
