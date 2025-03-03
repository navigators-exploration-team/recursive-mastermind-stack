import { StepProgramProof } from "mina-mastermind";

export class WebSocketService {
  ws: WebSocket | null = null;
  gameId: string;
  onMessageCallback: ((data: any) => void) | null = null;

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  connect() {
    if (this.ws) return;

    this.ws = new WebSocket("ws://localhost:3000");

    this.ws.onopen = () => {
      this.send({ action: "join", gameId: this.gameId });
    };

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data");
      if (data.zkProof) {
        const receivedProof = await StepProgramProof.fromJSON(
          JSON.parse(data.zkProof)
        );
        receivedProof.verify();
        if (this.onMessageCallback) this.onMessageCallback(data);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.ws = null;
    };
  }

  send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendProof(proof: string) {
    this.send({ action: "sendProof", gameId: this.gameId, zkProof: proof });
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
