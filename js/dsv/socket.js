class Socket {
    constructor({ port }) {
        this.port = port;
        this.socket = null;
        this.actions = {};
    }

    execute(action, ...args) {
        if (!this.actions[action]) {
            console.error(`socket action not found! ${action}`);
            return;
        }

        this.actions[action].forEach(act => { act(...args); });
    }

    on(action, func) {
        if (!this.actions[action]) this.actions[action] = [];
        this.actions[action].push(func)
    }

    connect() {
        this.socket = new WebSocket(`ws://localhost:${this.port}`);
        this.socket.onopen = () => { this.execute('open'); };
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.execute(data.type, data.data);
            } catch (e) {
                console.log('Mensagem do servidor:', e);
            }
        };
    }

    send(to, data) {
        this.socket.send(JSON.stringify({ type: to, data: data }));
    }
}

export default Socket
