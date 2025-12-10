let socket: WebSocket | null = null;

export function connectWS(url: string, onMessage: (msg: any) => void) {
  socket = new WebSocket(url);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onopen = () => console.log("Connected to Embedded32 bridge");
  socket.onclose = () => console.log("Disconnected");
}

export function disconnectWS() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
