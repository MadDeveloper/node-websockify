declare module "@maddeveloper/node-websockify" {
  type Server = import("http").Server
  type WebSocketServer = import("ws").WebSocketServer
  type VNCSocket = import("net").Socket

  function websockify(
    options?: {
      source?: string
      target?: string
      web?: string
      cert?: string
      key?: string
      server: Server
      webSocketServer: WebSocketServer
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
  ): [Server | null, WebSocketServer | null, Error | null | undefined]

  export default websockify
}
