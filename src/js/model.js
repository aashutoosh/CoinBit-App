import { WEBSOCKET_URL, WEBSOCKET_RECONNECT_SEC, WEBSOCKET_INITIAL_WAIT_SEC } from './config.js';
import { BINANCE_EXCHANGE_URL, DISCORD_FOOTER_TEXT } from './config.js';

import { addToLocalStorage, getFromLocalStorage, updateLocalStorage, removeFromLocalStorage } from './helpers.js';

export const state = {
    exchangeSymbols: [],
    uniquelyAddedSymbols: [],
    watchlist: [],
    pendingAlerts: [],
    triggeredAlerts: [],
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
    state.pendingAlerts = getFromLocalStorage('pendingAlerts') || [];
    state.triggeredAlerts = getFromLocalStorage('triggeredAlerts') || [];
    state.discordWebhookUrl = getFromLocalStorage('discordWebhookUrl') || "";
    state.sendDiscordAlerts = getFromLocalStorage('sendDiscordAlerts') || false;
    state.notifications = getFromLocalStorage('notifications') || [];
}

// Watchlist
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

// Alert Modal
export function addNewAlert(alertObject) {
    const pendingAlerts = state.pendingAlerts;

    if (pendingAlerts.length === 0) {
        addToLocalStorage('pendingAlerts', [alertObject]);
    }
    else {
        updateLocalStorage('pendingAlerts', [...pendingAlerts, alertObject]);
    }

    updateState();
}

export function modifyAlert(alertObject, dataKey) {
    const pendingAlerts = state.pendingAlerts;
    const filteredAlerts = pendingAlerts.filter((alert) => alert.createdon !== dataKey);

    updateLocalStorage('pendingAlerts', [...filteredAlerts, alertObject]);

    updateState();
}

// Alert Section
export function deleteAlert(alertObject, pendingAlertType) {
    const symbol = alertObject.symbol;
    const allAlerts = pendingAlertType ? state.pendingAlerts : state.triggeredAlerts;
    const filteredAlerts = allAlerts.filter((alert) => alert.createdon !== alertObject.createdon);
    const alertType = pendingAlertType ? 'pendingAlerts' : 'triggeredAlerts';
    updateLocalStorage(alertType, filteredAlerts);

    updateState();

    // If symbol is not present in uniqueSymbols array then unsucbscribe it from websocket stream
    if (!state.uniquelyAddedSymbols.includes(symbol)) {
        websocket.unsubscribeSymbol(symbol);
    }
}

// Primary Notification
export function savePrimaryNotification(notfObject) {
    const allNotifications = state.notifications;

    if (allNotifications.length === 0) {
        addToLocalStorage('notifications', [notfObject])
    }
    else {
        updateLocalStorage('notifications', [notfObject, ...allNotifications])
    }

    updateState();
}

export function deletePrimaryNotification(dataKey) {
    const allNotifications = state.notifications;
    const filteredNotf = allNotifications.filter((notf) => notf.key !== dataKey);

    updateLocalStorage('notifications', filteredNotf)

    updateState();
}

export function deleteAllPrimaryNotification() {
    removeFromLocalStorage('notifications');

    updateState();
}

// Settings
export function setDiscordAlerts(value) {
    addToLocalStorage('sendDiscordAlerts', value);

    updateState();
}

export function setWebhookUrl(url) {
    addToLocalStorage('discordWebhookUrl', url);

    updateState();
}

export function sendDiscordAlert(alert, notfCallback) {
    const webhookURL = state.discordWebhookUrl;
    const discordEnabled = state.sendDiscordAlerts;

    if (discordEnabled && typeof (webhookURL) === 'string' && webhookURL !== "") {
        const payload = {
            embeds: [
                {
                    type: "rich",
                    title: alert.title,
                    description: alert.description,
                    color: 0xf0ba09,
                    fields: [
                        {
                            name: "\u200B",
                            value: `${alert.symbol} ${alert.condition} ${alert.price}`
                        }
                    ],
                    footer: {
                        text: DISCORD_FOOTER_TEXT
                    }
                }
            ]
        };

        fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).catch(error => notfCallback(`Error: ${error}`, 'ri-error-warning-line'));
    }
    else {
        notfCallback('Please enter valid discord webhook URL.', 'ri-error-warning-line');
    }
}

// Websocket
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