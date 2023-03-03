import * as model from './model.js';
import headerView from './views/headerView.js';
import notificationWindowView from './views/notificationWindowView.js';
import searchResultsView from './views/searchResultsView.js';
import watchlistView from './views/watchlistView.js';
import alertModalView from './views/alertModalView.js';
import alertSectionView from './views/alertSectionView.js';
import primaryNotificationView from './views/primaryNotificationView.js';
import settingsView from './views/settingsView.js';
import { showSecondaryNotification } from './views/secondaryNotificationView.js';
import { getCurrentTime } from './helpers.js';

import { VALID_WEBHOOK_STARTSWITH } from './config.js';


// header
const themeToggle = function (themeType) {
    model.changeTheme(themeType);
}

const initializeTheme = function () {
    const currentTheme = model.state.theme;
    headerView.changeTheme(currentTheme);
}

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

// Alert Modal
const createNewAlertModal = function (symbol = '') {
    alertModalView.updateData(model.state.uniquelyAddedSymbols);
    alertModalView.create(symbol);
}

const editAlertModal = function (alert) {
    alertModalView.updateData(model.state.uniquelyAddedSymbols);
    alertModalView.update(alert);
}

const submitNewAlert = function (alertObject, dataKey) {
    if (!dataKey) {
        // Create alert
        model.addNewAlert(alertObject);
        showSecondaryNotification('Alert Created!', 'ri-checkbox-circle-line');
    }
    else {
        // Modify alert
        model.modifyAlert(alertObject, dataKey);
        showSecondaryNotification('Alert Updated!', 'ri-edit-2-line');
    }

    alertModalView.close();

    updateAlertsView();
}

// Alerts Section
const updateAlertsView = function () {
    alertSectionView.updateData(model.state.pendingAlerts, model.state.triggeredAlerts);
    alertSectionView.render();
}

const alertsAction = function (buttonType, pendingAlertType, alertObj) {
    // If type is pending then only can edit alert
    if (buttonType === 'edit' && pendingAlertType) {
        editAlertModal(alertObj);
    }
    else if (buttonType === 'delete') {
        model.deleteAlert(alertObj, pendingAlertType);
        const alertType = pendingAlertType ? 'Pending' : 'Triggered';
        showSecondaryNotification(`${alertType} alert deleted!`, 'ri-delete-bin-6-line');
    }

    updateAlertsView();
}

// Notification Window
const showNotificationWindow = function () {
    notificationWindowView.updateData(model.state.notifications);
    notificationWindowView.render();
}

const removeNotification = function (dataKey) {
    model.deletePrimaryNotification(dataKey)
    showNotificationWindow();
}

const clearNotificationWindow = function () {
    model.deleteAllPrimaryNotification()
}

const toggleAlertBell = function () {
    notificationWindowView.updateData(model.state.notifications);
    notificationWindowView.render();
}

// Settings
const setDiscordAlerts = function (value) {
    model.setDiscordAlerts(value);
}

const setWebhookUrl = function (webhookUrl) {
    webhookUrl = webhookUrl.trim();

    const isValidWebhookUrl = webhookUrl.startsWith(VALID_WEBHOOK_STARTSWITH);
    if (!isValidWebhookUrl && !(webhookUrl === '')) {
        showSecondaryNotification('Please enter a valid Discord webhook URL.', 'ri-error-warning-line');
        return '';
    }

    model.setWebhookUrl(webhookUrl);

    showSecondaryNotification('Webhook URL saved!', 'ri-checkbox-circle-line');

    return webhookUrl;
}

const updateSettingsData = function () {
    const webhookUrl = model.state.discordWebhookUrl;
    const discordChecked = model.state.sendDiscordAlerts;
    settingsView.updateData(webhookUrl, discordChecked);

    settingsView.updateInitialSettings();
}

const sendDiscordAlert = function (alertObj) {
    model.sendDiscordAlert(alertObj, showSecondaryNotification);
}

// Websocket
const initializeWebsocket = function (symbolsArray) {
    model.websocket.init(symbolsArray, websocketDataHandler, showSecondaryNotification);
}

const websocketDataHandler = function (data) {
    if ('stream' in data) {
        watchlistView.updateWatchlistItemData(data);
        alertModalView.updateModalSymbolPrice(data);
        alertSectionView.updateAlertsLtpData(data);
        checkForAlerts(data);
    }
}

const websocketSubscribe = function (symbol) {
    const uniquelyAddedSymbols = model.state.uniquelyAddedSymbols;

    if (model.websocket.ws) {
        if (!uniquelyAddedSymbols.includes(symbol)) {
            model.websocket.subscribeSymbol(symbol);
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
        }
    }
}

// Primary Notification
const showPrimaryNotification = function (title, description, condition, icon = 'ri-timer-flash-line') {
    primaryNotificationView.render(title, description, condition, icon);

    const notfObject = {
        key: Date.now(),
        time: getCurrentTime(),
        title: title,
        description: description,
        condition: condition,
    };

    // Activate Notification bell
    notificationWindowView.showNotificationLight();

    model.savePrimaryNotification(notfObject);
}

const checkForAlerts = function (data) {
    function conditionMatched(alertObj) {
        const condition = `${alertObj.symbol} ${alertObj.condition} ${alertObj.price}`
        showPrimaryNotification(alertObj.title, alertObj.description, condition, 'ri-notification-4-line');

        // Send to discord
        sendDiscordAlert(alertObj);

        // Remove from pending alerts
        model.removeFromPendingAlerts(alertObj);

        // and move to triggered alerts
        model.addToTriggeredAlerts(alertObj);

        updateAlertsView();
    }

    const symbol = data.data.s;
    const currentPrice = Number(data.data.c);
    const allPendingAlerts = model.state.pendingAlerts;
    const pendingAlerts = allPendingAlerts.filter(alert => alert.symbol === symbol);

    pendingAlerts.forEach(alert => {
        const condition = alert.condition;
        if (condition === '>=' && currentPrice >= alert.price) {
            conditionMatched(alert);
        }
        else if (condition === '<=' && currentPrice <= alert.price) {
            conditionMatched(alert);
        }
        else if (condition === '>' && currentPrice > alert.price) {
            conditionMatched(alert);
        }
        else if (condition === '<' && currentPrice < alert.price) {
            conditionMatched(alert);
        }
        else if (condition === '==' && currentPrice === alert.price) {
            conditionMatched(alert);
        }
    });
}

const init = function () {
    initializeTheme();
    model.updateUniqueSymbols();
    initializeWatchlist();
    updateAlertsView();
    showNotificationWindow();
    initializeWebsocket(model.state.uniquelyAddedSymbols);
    updateSettingsData();

    headerView.activeNavSection();
    headerView.addThemeToggleHandler(themeToggle);

    notificationWindowView.addHideWindowHandler();
    notificationWindowView.addClearWindowHandler(clearNotificationWindow);
    notificationWindowView.addAlertBellHandler(toggleAlertBell);
    notificationWindowView.addNotificationRemoveHandler(removeNotification);

    searchResultsView.addInputChangeHandler(showSearchResults);
    searchResultsView.addSearchResultsHideHandler(hideSearchResults);
    searchResultsView.addSymbolToWatchlisthandler(addToWatchlist);

    watchlistView.addDeleteItemHandler(removeFromWatchlist);
    watchlistView.addAlertModalHandler(createNewAlertModal);

    alertModalView.alertModalClose();
    alertModalView.addSubmitHandler(submitNewAlert);

    alertSectionView.addButtonHandler(alertsAction);
    alertSectionView.switchTableTypeHandler(updateAlertsView);
    alertSectionView.addCreateAlertButtonHandler(createNewAlertModal);

    settingsView.addDiscordCheckboxHandler(setDiscordAlerts);
    settingsView.addSaveButtonHandler(setWebhookUrl);
};

init();