declare module "@maddeveloper/node-websockify" {
  type WebServer = import("http").Server
  type WebSocketServer = import("ws").WebSocketServer
  type VNCSocket = import("net").Socket

  function websockify(
    options?: {
      source?: string
      target?: string
      web?: string
      cert?: string
      key?: string
    },
    callbacks?: {
      onConnected?(client: WebSocketServer, vncSocket: VNCSocket): void
      onDisconnected?(
        client: WebSocketServer,
        vncSocket: VNCSocket,
        code: number,
        message: string
      ): void
    }
  ): [WebServer, WebSocketServer]

  export default websockify
}
