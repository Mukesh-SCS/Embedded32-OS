let socket: WebSocket | null = null;

export function connectWS(url: string, onMessage: (msg: any) => void) {
  socket = new WebSocket(url);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onopen = () => console.log("Connected to Embedded32 bridge");
  socket.onclose = () => console.log("Disconnected");
  socket.onerror = (error) => console.error("WebSocket error:", error);
}

export function disconnectWS() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendCommand(cmd: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(cmd));
    console.log('Sent command:', cmd);
  } else {
    console.warn('WebSocket not connected, cannot send command:', cmd);
  }
}
