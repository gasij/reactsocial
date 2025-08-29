import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.onMessageCallback = null;
    }

    connect(token) {
        this.socket = io('http://localhost:3000', {
            auth: { token },
            withCredentials: true
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket');
            this.isConnected = true;
        });

        this.socket.on('new_message', (message) => {
            console.log('New message received:', message);
            if (this.onMessageCallback) {
                this.onMessageCallback(message);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            this.isConnected = false;
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    onMessage(callback) {
        this.onMessageCallback = callback;
    }
}

export const webSocketService = new WebSocketService();