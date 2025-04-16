import { useWebSocket } from '@vueuse/core';
import { StepProgramProof } from '@navigators-exploration-team/mina-mastermind';
import { useZkAppStore } from '@/store/zkAppModule';

export class WebSocketService {
  socket: ReturnType<typeof useWebSocket>;
  gameId: string;
  onMessageCallback: ((data: any) => void) | null = null;

  constructor(gameId: string) {
    this.gameId = gameId;
    console.log('web socket server : ', import.meta.env.VITE_WEB_SOCKET_URL);
    this.socket = useWebSocket(import.meta.env.VITE_WEB_SOCKET_URL, {
      autoReconnect: {
        retries: 5,
        delay: 1000,
        onFailed: () => {
          console.error('Max reconnection attempts reached!');
        },
      },
      immediate: true,
      onMessage: async (_ws: WebSocket, event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received data:', data);
          if (data.zkProof) {
            const receivedProof = await StepProgramProof.fromJSON(
              JSON.parse(data.zkProof)
            );
            receivedProof.verify();
            if (this.onMessageCallback) this.onMessageCallback(data);
          }
          if (data.hash) {
            const { setLastTransactionHash } = useZkAppStore();
            setLastTransactionHash(data.hash);
          }
          if (data.game) {
            const { setGame } = useZkAppStore();
            setGame(data.game);
          }
        } catch (e) {
          console.log('Error handling message:', e);
        }
      },
      onConnected: async (_ws: WebSocket) => {
        this.send({ action: 'join', gameId });
      },
    });
  }

  setCallback(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  send(msg: object) {
    this.socket.send(JSON.stringify(msg));
  }

  open() {
    this.socket.open();
  }

  close() {
    this.socket.close();
  }
}
