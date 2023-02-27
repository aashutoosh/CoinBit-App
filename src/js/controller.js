import * as model from './model.js';
import searchResultsView from './views/searchResultsView.js';
import watchlistView from './views/watchlistView.js';

// SearchResults
const showSearchResults = async function () {
    if (model.state.exchangeSymbols.length === 0) await fetchAllSymbols();

    searchResultsView.updateData(model.state.exchangeSymbols, model.state.watchlist);
    searchResultsView.render();
}

const hideSearchResults = function () {
    searchResultsView.render();
}

// Watchlist
const initializeWatchlist = function () {
    watchlistView.updateData(model.state.watchlist);
    watchlistView.render();
}

const addToWatchlist = function (symbol, event) {
    const initialWatchlist = model.state.watchlist;

    if (!initialWatchlist.includes(symbol)) {
        // Order of execution matters here as before adding symbol in state 
        // its important to check if symbol is not present in uniquelyAddedSymbols list 
        // and then subscribe to websocket stream

        // 0. Add to webscoket stream
        websocketSubscribe(symbol);

        // 1. Modify add icon to check
        searchResultsView.modifyAddToCheck(event);

        // 2. Symbol is added in watchlist state
        model.addToWatchlist(symbol);

        // 3. At last added in view
        watchlistView.addToWatchlist(symbol);
    }
}

const removeFromWatchlist = function (symbol) {
    // Order of execution matters here as first symbol needs to be deleted from watchlist state
    // then checked if its still in uniquelyAddedSymbols list
    // if not then unsubscribe from websocket stream and update state.

    // 0. Symbol is removed from watchlist state
    model.removeFromWatchlist(symbol);

    // 1. Remove from websocket stream if not found
    websocketUnsubscribe(symbol)
}

// Websocket
const initializeWebsocket = function (symbolsArray) {
    model.websocket.init(symbolsArray, websocketDataHandler);
}

const websocketDataHandler = function (data) {
    if ('stream' in data) {
        watchlistView.updateWatchlistItemData(data);
        // checkForAlerts(data);
        // updateModalPrice(data)
    }
}

const websocketSubscribe = function (symbol) {
    const uniquelyAddedSymbols = model.state.uniquelyAddedSymbols;

    if (model.websocket.ws) {
        if (!uniquelyAddedSymbols.includes(symbol)) {
            model.websocket.subscribeSymbol(symbol);
            console.log(`Subscribed ${symbol}`);
        }
    }
    else {
        initializeWebsocket([symbol]);
    }
}

const websocketUnsubscribe = function (symbol) {
    const uniquelyAddedSymbols = model.state.uniquelyAddedSymbols;

    if (model.websocket.ws) {
        if (!uniquelyAddedSymbols.includes(symbol)) {
            model.websocket.unsubscribeSymbol(symbol);
            console.log(`Unsubscribed ${symbol}`);
        }
    }
}

const init = function () {
    model.updateUniqueSymbols();
    initializeWatchlist();
    initializeWebsocket(model.state.uniquelyAddedSymbols);

    searchResultsView.addInputChangeHandler(showSearchResults);
    searchResultsView.addSearchResultsHideHandler(hideSearchResults);
    searchResultsView.addSymbolToWatchlisthandler(addToWatchlist);
    watchlistView.addDeleteItemHandler(removeFromWatchlist);
};
init();
