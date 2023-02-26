import { WEBSOCKET_URL } from './config.js';
import { BINANCE_EXCHANGE_URL } from './config.js';

import { addToLocalStorage, getFromLocalStorage, updateLocalStorage, removeFromLocalStorage } from './helpers.js';

export const state = {
    allFetchedSymbols: [],
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
        state.allFetchedSymbols = symbols;
    }
    catch (error) {
        console.error(`Error fetching symbols from binance exchange: ${error}`);
    }
}

function init() {
    fetchAllSymbols();
}

init();