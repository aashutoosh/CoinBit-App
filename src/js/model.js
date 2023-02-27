import { WEBSOCKET_URL, WEBSOCKET_RECONNECT_SEC, WEBSOCKET_INITIAL_WAIT_SEC } from './config.js';
import { BINANCE_EXCHANGE_URL } from './config.js';

import { addToLocalStorage, getFromLocalStorage, updateLocalStorage, removeFromLocalStorage } from './helpers.js';

export const state = {
    exchangeSymbols: [],
    uniquelyAddedSymbols: [],
    watchlist: [],
    pendingAlerts: {},
    triggeredAlerts: {},
    discordWebhookUrl: "",
    sendDiscordAlerts: false,
    notifications: [],
};

export async function fetchAllSymbols() {
    try {
        const response = await fetch(BINANCE_EXCHANGE_URL);
        const data = await response.json();
        const symbols = data.symbols.map(symbol => symbol.symbol);

        // Update State
        state.exchangeSymbols = symbols;
    }
    catch (error) {
        console.error(`Error fetching symbols from binance exchange: ${error}`);
    }
}

export function updateUniqueSymbols() {
    const watchlistSymbols = getFromLocalStorage('watchlist') || [];
    const pendingAlertsSymbols = (getFromLocalStorage('pendingAlerts')?.map(({ symbol }) => symbol)) || [];

    const allSymbols = [...watchlistSymbols, ...pendingAlertsSymbols];
    const allUniqueSymbols = [...(new Set(allSymbols))];

    state.uniquelyAddedSymbols = allUniqueSymbols;
}

function updateState() {
    updateUniqueSymbols();
    state.watchlist = getFromLocalStorage('watchlist') || [];
    state.pendingAlerts = getFromLocalStorage('pendingAlerts') || {};
    state.triggeredAlerts = getFromLocalStorage('triggeredAlerts') || {};
    state.discordWebhookUrl = getFromLocalStorage('discordWebhookUrl') || "";
    state.sendDiscordAlerts = getFromLocalStorage('watchlist') || false;
    state.notifications = getFromLocalStorage('notifications') || [];
}

// Wathclist
export function addToWatchlist(symbol) {
    const initialWatchlist = state.watchlist;
    addToLocalStorage('watchlist', [...initialWatchlist, symbol]);
    updateState();
}

export function removeFromWatchlist(symbol) {
    const modifiedWatchlist = state.watchlist.filter(wSymbol => wSymbol !== symbol);
    updateLocalStorage('watchlist', modifiedWatchlist);
    updateState();
}

class wsConnect {
    _initialSymbols;
    dataHandler;
    notificationHandler;
    ws;

    init(symbolsArray, dataHandler, notificationHandler) {
        if (symbolsArray.length === 0) return;

        this._initialSymbols = symbolsArray;
        this.dataHandler = dataHandler;
        this.notificationHandler = notificationHandler;
        const allStreams = this._initialSymbols.map(symbol => symbol.toLowerCase() + '@ticker').join('/');

        this.ws = new WebSocket(WEBSOCKET_URL + allStreams);

        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }

    onOpen() {
        console.log('WebSocket Connected');
        this.notificationHandler('WebSocket Connected', 'ri-link-m');
    }

    onError(event) {
        console.error('WebSocket Error:', event);
        this.notificationHandler('WebSocket error', 'ri-error-warning-line');
    }

    onClose() {
        console.log('WebSocket Closed');
        this.notificationHandler('WebSocket disonnected', 'ri-link-unlink-m');

        // Reconnect to the WebSocket after 10 seconds
        setTimeout(() => {
            this.init(this._initialSymbols, this.dataHandler);
        }, WEBSOCKET_RECONNECT_SEC);
    }

    onMessage(event) {
        this.dataHandler(JSON.parse(event.data));
    }

    subscribeSymbol(symbol) {
        const symbolObject = {
            id: Date.now(),
            method: "SUBSCRIBE",
            params: [symbol.toLowerCase() + '@ticker']
        }

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(symbolObject));
            this.notificationHandler(`Subscribed: ${symbol}`, 'ri-checkbox-circle-line');
        }
        else {
            // Try again after 2 seconds
            setTimeout(() => {
                this.subscribeSymbol(symbol);

            }, WEBSOCKET_INITIAL_WAIT_SEC);
        }
    }

    unsubscribeSymbol(symbol) {
        const symbolObject = {
            id: Date.now(),
            method: "UNSUBSCRIBE",
            params: [symbol.toLowerCase() + '@ticker']
        }

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(symbolObject));
            this.notificationHandler(`Unsubscribed: ${symbol}`, 'ri-delete-bin-line');
        }
        else {
            // Try again after 2 seconds
            setTimeout(() => {
                this.unsubscribeSymbol(symbol);
            }, WEBSOCKET_INITIAL_WAIT_SEC);
        }
    }
}

export const websocket = new wsConnect();

function init() {
    fetchAllSymbols();
    updateState();
}

init();