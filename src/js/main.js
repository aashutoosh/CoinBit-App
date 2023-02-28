const body = document.querySelector('body');

const searchInput = document.querySelector('.watchlist__search--input');
const watchlistItems = document.querySelector('.watchlist__items');

const searchResults = document.querySelector('.searchresults');

const bellwindow = document.querySelector('.bellwindow');
const bellwindowClearall = document.querySelector('.bellwindow__clearall');
const bellwindowContainer = document.querySelector('.bellwindow__container');
const bellwindowEmpty = document.querySelector('.bellwindow__empty');

const createalert = document.querySelector('.createalert');
const createalertTitle = document.querySelector('.createalert__title');
const createalertForm = document.querySelector('.createalert__form');
const formInputTitle = document.querySelector('.input.title');
const formInputDescription = document.querySelector('.input.description');
const formSelectSymbol = document.querySelector('.select.symbol');
const formSelectCondition = document.querySelector('.select.condition');
const formInputPrice = document.querySelector('.input.price');
const createalertClose = document.querySelector('.createalert__close');
const createalertSubmit = document.querySelector('.createalert__form--submit');

const navLinks = document.getElementById('nav__links');
const allNavLinks = document.querySelectorAll('.nav__link');
const alertBell = document.querySelector('.nav__notification');
const notificationLight = document.querySelector('.nav__notification--light');

const createAlertButton = document.querySelector('.alerts__create--button');
const alertsTable = document.querySelector('.alerts__table--tbody');
const alertsHeading = document.querySelector('.heading__window');
const alertsPendingTitle = document.querySelector('.alerts__title--pending');
const alertsTriggeredTitle = document.querySelector('.alerts__title--triggered');
const modalPrice = document.querySelector('.createalert__form--fields .symbolprice');

const discordCheckbox = document.getElementById('discord__checkbox');
const webhookSettings = document.querySelector('.webhook');
const saveUrlButton = document.querySelector('.save__url');


let allFetchedSymbols;
let ws;

// done
function addToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

// done
function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key) || "[]")
}

// done
function updateLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

// done
function removeFromLocalStorage(key) {
    localStorage.removeItem(key)
}

// done
function addCoins(params) {
    if (params) {
        const filteredCoins = allFetchedSymbols.filter((symbol) => symbol.indexOf(params.toUpperCase()) !== -1)

        const coinsListHtml = filteredCoins.map(
            (coin) => {
                const initialWatchlist = getFromLocalStorage('watchlist')

                if (initialWatchlist.includes(coin)) {
                    return `<li class="searchresults__item">
                    <span class="coinname">${coin}</span>
                    <i class="button__item button__item--green ri-check-line active"></i>
                </li>`
                }
                else {
                    return `<li class="searchresults__item">
                    <span class="coinname">${coin}</span>
                    <i class="button__item button__item--green ri-add-line"></i>
                </li>`
                }

            }
        ).join('')
        searchResults.innerHTML = coinsListHtml
    }
    else {
        searchResults.innerHTML = ''
    }
}

// done
function addToWatchlist(coin, event) {
    const watchlistItem = `<li class="watchlist__item symbol ">
        <span class="symbol__name">${coin}</span>
        <div class="symbol__price">
            <span class="symbol__price--latest">0.00</span>
            <div>
                <span class="symbol__price--24change">(+0.00%)</span>
                <i class="symbol__price--direction ri-arrow-up-s-fill"></i>
            </div>
        </div>
        <div class="symbol__action">
            <i class="createNewAlert button__item button__item--green ri-alarm-line"></i>
            <i class="delete button__item button__item--red ri-delete-bin-6-line"></i>
        </div>
    </li>`;

    const activateButton = () => {
        event.target.classList.remove('ri-add-line');
        event.target.classList.add('ri-check-line', 'active');
    }

    // If websocket is connected then subscribe to stream otherwise initiate connection
    if (ws) subscribeStream(coin, 'watchlist');
    else wsConnect([coin]);

    const initialWatchlist = getFromLocalStorage('watchlist');

    if (!initialWatchlist.includes(coin)) {
        addToLocalStorage('watchlist', [...initialWatchlist, coin]);
        activateButton();
        watchlistItems.innerHTML += watchlistItem;
    }
}

// done
function removeFromWatchlist(coin, element) {
    const initialWatchlist = getFromLocalStorage('watchlist');
    unsubscribeStream(coin, 'watchlist');

    const modifiedWatchlist = initialWatchlist.filter(s => s !== coin);
    updateLocalStorage('watchlist', modifiedWatchlist);

    const listElement = element.target.parentElement.parentElement;
    const parentElement = listElement.parentElement;

    parentElement.removeChild(listElement);

}

// done
function initializeWatchlist() {
    const initialWatchlist = getFromLocalStorage('watchlist')

    if (initialWatchlist.length === 0) {
        watchlistItems.innerHTML = ''
    }
    else if (initialWatchlist.length) {
        const watchlistItem = initialWatchlist.map((coin) => {
            return `<li class="watchlist__item symbol ">
            <span class="symbol__name">${coin}</span>
            <div class="symbol__price">
                <span class="symbol__price--latest">0.00</span>
                <div>
                    <span class="symbol__price--24change">(+0.00%)</span>
                    <i class="symbol__price--direction ri-arrow-up-s-fill"></i>
                </div>
            </div>
            <div class="symbol__action">
                <i class="createNewAlert button__item button__item--green ri-alarm-line"></i>
                <i class="delete button__item button__item--red ri-delete-bin-6-line"></i>
            </div>
        </li>`
        }).join('')
        watchlistItems.innerHTML = watchlistItem

        // Start websocket connection
        // with all unique symbols i.e watchlist + pending alerts
        const allUniqueSymbols = getAllUniqueSymbols();
        wsConnect(allUniqueSymbols);
    }
}

function initializeNotifications() {
    const allNotifications = getFromLocalStorage('notifications')

    if (allNotifications.length === 0) {
        bellwindowContainer.innerHTML = '';
        bellwindowEmpty.classList.remove('show');
        bellwindowEmpty.classList.add('show');
    }
    else if (allNotifications.length) {
        const notfItems = allNotifications.map((notf) => {
            return `<li class="notification" data-key=${notf.key}>
            <span class="notification__time">${notf.time}</span>
            <div class="notification__container">
                <span class="notification__title">${notf.title}</span>
                <span class="notification__desc">${notf.description}</span>
            </div>
            <i class="notification__button--close ri-close-line"></i>
        </li>`;
        }).join('');

        bellwindowContainer.innerHTML = notfItems;
        bellwindowEmpty.classList.remove('show');
    };
}

// done
function wsConnect(allSymbols) {
    const wsUrl = "wss://stream.binance.com:443/stream?streams=";
    const allStreams = allSymbols.map(coin => coin.toLowerCase() + '@ticker').join('/')

    ws = new WebSocket(wsUrl + allStreams);

    ws.onopen = (event) => {
        showNotification2('WebSocket Connected', 'ri-link-m');
    }

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if ('stream' in data) {
            updateWatchlistData(data);
            checkForAlerts(data);
            updateModalPrice(data)
        }
    };

    ws.onerror = (event) => {
        showNotification2('WebSocket error', 'ri-error-warning-line');
        console.error("WebSocket error: ", event)
    }

    ws.onclose = (event) => {
        showNotification2('WebSocket disonnected', 'ri-link-unlink-m');

        // Reconnect to the WebSocket after 10 seconds
        setTimeout(function () {
            wsConnect(allSymbols);
        }, 10000);
    };
}

// done
function subscribeStream(coin, source) {
    const subscribeCoin = (coin) => {
        ws.send(JSON.stringify({
            id: Date.now(),
            method: "SUBSCRIBE",
            params: [coin.toLowerCase() + '@ticker']
        }));

        showNotification2(`Subscribed: ${coin}`, 'ri-checkbox-circle-line');
    }

    const pendingAlertsSymbols = getFromLocalStorage('pendingAlerts').map(alert => alert.symbol);
    const watchlistSymbols = getFromLocalStorage('watchlist');

    if (source === 'watchlist') {
        if (!pendingAlertsSymbols.includes(coin) && !watchlistSymbols.includes(coin)) {
            subscribeCoin(coin);
        };
    };
}

// done
function unsubscribeStream(coin, source) {
    const unsubscribeCoin = (coin) => {
        ws.send(JSON.stringify({
            id: Date.now(),
            method: "UNSUBSCRIBE",
            params: [coin.toLowerCase() + '@ticker']
        }));

        showNotification2(`Unsubscribed: ${coin}`, 'ri-delete-bin-line');
    }

    const pendingAlertsSymbols = getFromLocalStorage('pendingAlerts').map(alert => alert.symbol);
    const watchlistSymbols = getFromLocalStorage('watchlist');
    const symbCount = pendingAlertsSymbols.filter(symbol => symbol === coin).length;

    if (source === 'watchlist') {
        // If symbol is also not in pendingAlertSymbols then unsubscribe its data
        if (!pendingAlertsSymbols.includes(coin)) {
            unsubscribeCoin(coin);
        }
    }
    else if (source === 'alertsTable') {
        // If symbol is also not in watchlistSymbols and 
        // if it has only one alert in table then unsubscribe its data
        if (!watchlistSymbols.includes(coin) && symbCount == 1) {
            unsubscribeCoin(coin);
        }
    }
}

// done
function updateWatchlistData(data) {
    const coin = data.data.s;
    const price = Number(data.data.c);
    const priceChange = Number(data.data.P);

    // Find the list item with a matching coin symbol and update its price and price change.
    const listItems = watchlistItems.querySelectorAll('li.symbol');
    for (let i = 0; i < listItems.length; i++) {
        const listItem = listItems[i];
        if (listItem.querySelector('span.symbol__name').textContent === coin) {
            const priceElem = listItem.querySelector('.symbol__price--latest');
            const changeElem = listItem.querySelector('.symbol__price--24change');
            const directionElem = listItem.querySelector('.symbol__price--direction');

            const prevPrice = Number(priceElem.textContent)

            // Update the price and price change.
            priceElem.textContent = price;
            changeElem.textContent = `(${priceChange}%)`;

            // Add the green or red class to the price element.
            priceElem.classList.remove('green', 'red');
            if (price > prevPrice) priceElem.classList.add('green');
            else priceElem.classList.add('red');

            // Add the green or red class and arrow class to the direction element.
            directionElem.classList.remove('green', 'red');
            directionElem.classList.remove('ri-arrow-up-s-fill', 'ri-arrow-down-s-fill');
            if (priceChange > 0) {
                changeElem.classList.add('green');
                directionElem.classList.add('ri-arrow-up-s-fill', 'green');
            }
            else {
                changeElem.classList.add('red');
                directionElem.classList.add('ri-arrow-down-s-fill', 'red');
            }

            break;
        }
    }
}

// done
function getCurrentTime() {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${period}`;
}

// done
function fillCreateAlertSymbols(coin = '') {
    const initialWatchlist = getFromLocalStorage('watchlist');

    let symbolOptions = initialWatchlist.map(symbol => {
        if (symbol === coin) return `<option value="${symbol}" selected>${symbol}</option>`;
        else return `<option value="${symbol}">${symbol}</option>`;
    }).join('');

    if (!initialWatchlist.includes(coin) && coin !== '') {
        symbolOptions += `<option value="${coin}" selected>${coin}</option>`
    }

    formSelectSymbol.innerHTML = symbolOptions;
}

function showAlertNotification(title, desc = '', icon = 'ri-timer-flash-line') {
    const notification = new Notification({
        title,
        description: desc,
        icon,
    });

    notification.show();

    notificationLight.classList.remove('active');
    notificationLight.classList.add('active');

    initializeNotifications();
}

// done
function updateAlertsView() {
    const newRow = (alert) => {
        return `<tr data-key="${alert.createdon}">
        <td>
            <div class="textContent">
                <span class="title">${alert.title}</span>
                <span class="description">${alert.description}</span>
            </div>
        </td>
        <td>
            <div class="control__buttons">
                <i class="control__buttons--edit ri-pencil-line"></i>
                <i class="control__buttons--delete ri-close-line"></i>
            </div>
        </td>
        <td>${alert.symbol}</td>
        <td><span>${alert.condition}</span></td>
        <td>${alert.price}</td>
    </tr>`
    }

    const allPendingAlerts = getFromLocalStorage('pendingAlerts');
    const allTriggeredAlerts = getFromLocalStorage('triggeredAlerts');

    if (alertsPendingTitle.classList.contains('active')) {
        if (allPendingAlerts) {
            const alertTableRows = allPendingAlerts.reverse().map(alert => newRow(alert)).join('');
            alertsTable.innerHTML = alertTableRows;
        }
        else {
            alertsTable.innerHTML = '';
        }
    }

    else if (alertsTriggeredTitle.classList.contains('active')) {
        if (allTriggeredAlerts) {
            const alertTableRows = allTriggeredAlerts.reverse().map(alert => newRow(alert)).join('');
            alertsTable.innerHTML = alertTableRows;
        }
        else {
            alertsTable.innerHTML = '';
        }
    }
}

// done
function createAlertModal(coin = '') {
    createalertForm.setAttribute('data-key', '');
    createalertTitle.textContent = 'Create Alert';
    createalertSubmit.textContent = 'Create';

    coin ? fillCreateAlertSymbols(coin) : fillCreateAlertSymbols();
}

// done
function updateAlertModal(alert) {
    createalertForm.setAttribute('data-key', alert.createdon);
    createalertTitle.textContent = 'Update Alert';
    formInputTitle.value = alert.title;
    formInputDescription.value = alert.description;
    fillCreateAlertSymbols(alert.symbol);
    formSelectCondition.value = alert.condition;
    formInputPrice.value = alert.price;
    createalertSubmit.textContent = 'Update';
}

// done
function showAlertModal() {
    createalert.classList.remove('show');
    createalert.classList.add('show');
}

// done
function hideAlertModal() {
    createalert.classList.remove('show');
    createalertForm.reset();
}

// done
function getAllUniqueSymbols() {
    const watchlistSymbols = getFromLocalStorage('watchlist');
    const pendingAlertsSymbols = getFromLocalStorage('pendingAlerts').map(alert => alert.symbol);

    const allSymbols = [...watchlistSymbols, ...pendingAlertsSymbols];
    const allUniqueSymbols = [...(new Set(allSymbols))];

    return allUniqueSymbols;
}

function checkForAlerts(coinData) {
    function conditionMatched(currentAlert) {
        showAlertNotification(currentAlert.title, currentAlert.description, 'ri-notification-4-line');

        // Send to discord
        sendMessage(currentAlert);

        // Remove from pending alerts
        const filteredAlerts = allPendingAlerts.filter(alert => alert.createdon !== currentAlert.createdon);
        updateLocalStorage('pendingAlerts', filteredAlerts);

        // and move to triggered alerts
        const allTriggeredAlerts = getFromLocalStorage('triggeredAlerts');
        if (allTriggeredAlerts.length === 0) {
            addToLocalStorage('triggeredAlerts', [currentAlert]);
        }
        else {
            updateLocalStorage('triggeredAlerts', [currentAlert, ...allTriggeredAlerts]);
        }

        updateAlertsView();
    }

    const coin = coinData.data.s;
    const currentPrice = Number(coinData.data.c);
    const allPendingAlerts = getFromLocalStorage('pendingAlerts');
    const pendingAlerts = allPendingAlerts.filter(alert => alert.symbol === coin);

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

// done
function updateModalPrice(coinData) {
    if (createalert.classList.contains('show')) {
        const coin = coinData.data.s;
        const currentPrice = Number(coinData.data.c);

        const selectElement = document.getElementById("modalSymbolSelect");
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const selectedOptionValue = selectedOption.value;

        if (selectedOptionValue === coin) {
            const modalSymbolPrice = document.getElementById("modalSymbolPrice");
            const prevPrice = Number(modalSymbolPrice.textContent);

            // Update the price.
            modalSymbolPrice.textContent = currentPrice;

            // Add the green or red class to the price element.
            modalSymbolPrice.classList.remove('green', 'red');
            if (currentPrice > prevPrice) modalSymbolPrice.classList.add('green');
            else modalSymbolPrice.classList.add('red');
        }
    }
}

// done
function showNotification2(message, icon = 'ri-notification-4-line') {
    const existingNotification = document.querySelector('#notifications2');

    // If the existing notification is found, just update its content and reset the timeout
    if (existingNotification) {
        existingNotification.querySelector('.message').textContent = message;
        clearTimeout(existingNotification.dataset.timeoutId);
        existingNotification.dataset.timeoutId = setTimeout(() => {
            existingNotification.classList.add('hide');
            setTimeout(() => {
                existingNotification.remove();
            }, 200);
        }, 2000);
    }
    else {
        // If the existing notification is not found, create a new element and add it to the DOM
        const notification = document.createElement('div');
        notification.classList.add('notifications2', 'show');
        notification.id = 'notifications2';
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span class="message">${message}</span>
        `;
        document.body.appendChild(notification);

        notification.dataset.timeoutId = setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 200);
        }, 2000);
    }
}

function checkDiscordAlerts() {
    const savedSetting = localStorage.getItem('sendDiscordAlerts');
    discordCheckbox.checked = savedSetting === "true";

    // Dispatch a 'change' event on the checkbox to trigger the event listener
    discordCheckbox.dispatchEvent(new Event('change'));
}

function saveWebhookUrl() {
    const webhookUrlInput = document.getElementById('webhookURL');
    const webhookUrl = webhookUrlInput.value.trim();

    isValidWebhookUrl = webhookUrl.startsWith('https://discordapp.com/api/webhooks/');
    if (!isValidWebhookUrl && !webhookUrl === '') {
        showNotification2('Please enter a valid Discord webhook URL.', 'ri-error-warning-line');
        return;
    }

    addToLocalStorage('discordWebhookUrl', webhookUrl);
    webhookUrlInput.value = webhookUrl;
    showNotification2('Webhook URL saved!', 'ri-checkbox-circle-line');

    viewWebhookURL();
}

function viewWebhookURL() {
    const webhookUrlInput = document.getElementById('webhookURL');

    // Check if the webhook URL exists in local storage and update the input value
    const savedWebhookUrl = getFromLocalStorage('discordWebhookUrl');
    if (savedWebhookUrl) {
        webhookUrlInput.value = savedWebhookUrl;
    }
}

function sendMessage(alert) {
    const webhookURL = getFromLocalStorage('discordWebhookUrl');
    const discordEnabled = document.getElementById('discord__checkbox')

    if (discordEnabled.checked && typeof (webhookURL) === 'string' && webhookURL !== "") {

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
                        text: `Sent from https://coinbit.pages.dev/`
                    }
                }
            ]
        };

        fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).catch(error => showNotification2(`Error: ${error}`, 'ri-error-warning-line'));
    }
    else {
        showNotification2('Please enter valid discord webhook URL.', 'ri-error-warning-line');
    }
}

// done
fetch("https://api.binance.com/api/v3/exchangeInfo")
    .then(response => response.json())
    .then(data => {
        allFetchedSymbols = data.symbols.map(symbol => symbol.symbol);
    });

// done
searchInput.addEventListener('input', () => addCoins(searchInput.value));

// done
// Hides search result when clicked outside of search result and search input
document.addEventListener('mousedown', (event) => {
    if (!searchResults.contains(event.target) && !searchInput.contains(event.target)) {
        searchResults.style.display = 'none';
        searchInput.value = ''
        addCoins('')
    }
});


document.addEventListener('click', (event) => {
    if (!alertBell.contains(event.target)) {
        bellwindow.classList.remove('show');
    };
});

// done
// Shows search result again if input is in focus
searchInput.addEventListener('focus', () => searchResults.style.display = 'block');

// done
// Used event delegation here
searchResults.addEventListener('click', (event) => {
    if (event.target.classList.contains('button__item')) {
        const coinName = event.target.parentElement.querySelector('.coinname').textContent;

        addToWatchlist(coinName, event);
    }
});

// done
// Used event delegation here
watchlistItems.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete')) {
        const coinName = event.target.parentElement.parentElement.querySelector('.symbol__name').textContent;

        removeFromWatchlist(coinName, event);
    }

    else if (event.target.classList.contains('createNewAlert')) {
        const coinName = event.target.parentElement.parentElement.querySelector('.symbol__name').textContent;

        // Fill Create alert window with watchlist symbols
        createAlertModal(coinName)
        showAlertModal()
    }
});

// done
createalertClose.addEventListener('click', () => {
    hideAlertModal()
});

bellwindowClearall.addEventListener('click', () => {
    bellwindowContainer.innerHTML = '';

    // Shows empty text
    bellwindowEmpty.classList.remove('show');
    bellwindowEmpty.classList.add('show');

    // Clear alerts from local storage
    removeFromLocalStorage('notifications');
});

alertBell.addEventListener('click', () => {
    bellwindow.classList.toggle('show');
    notificationLight.classList.remove('active');

    initializeNotifications();

    // Always scroll to top to show latest notification
    bellwindowContainer.scrollTop = 0;
});

bellwindow.addEventListener('click', event => {
    if (event.target.classList.contains('notification__button--close')) {
        const parentElement = event.target.parentElement;
        const dataKey = Number(parentElement.getAttribute('data-key'));

        const allAlerts = getFromLocalStorage('notifications');
        const filteredAlerts = allAlerts.filter(alert => alert.key !== dataKey);

        updateLocalStorage('notifications', filteredAlerts);

        initializeNotifications();
    }

    // Due to event bubbling event triggered here moves up to documnent hence closing bell window
    // To prevent this stop event to propagate further
    event.stopPropagation();
});

// done
createalertForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(createalertForm);

    // If Update alert modal is used then data-key attribute will have value
    const dataKey = Number(createalertForm.getAttribute('data-key'));

    const alertObject = {
        createdon: Date.now(),
        title: formData.get('title'),
        description: formData.get('description'),
        symbol: formData.get('symbol'),
        condition: formData.get('condition'),
        price: formData.get('price'),
    };
    const pendingAlerts = getFromLocalStorage('pendingAlerts');

    if (!dataKey) {
        if (!pendingAlerts) addToLocalStorage('pendingAlerts', [alertObject]);
        else {
            addToLocalStorage('pendingAlerts', [...pendingAlerts, alertObject]);
            showNotification2('Alert Created!', 'ri-checkbox-circle-line');
        }
    }
    else {
        const filteredAlerts = pendingAlerts.filter((alert) => alert.createdon !== dataKey);
        updateLocalStorage('pendingAlerts', [...filteredAlerts, alertObject]);
        showNotification2('Alert Updated!', 'ri-edit-2-line');
    }

    // Close create alert window
    hideAlertModal()

    // Update Pending alerts view
    updateAlertsView();
});

// done
createAlertButton.addEventListener('click', () => {
    createAlertModal();
    showAlertModal();
})

// done
alertsTable.addEventListener('click', (event) => {
    const editElement = event.target.classList.contains('control__buttons--edit');
    const deleteElement = event.target.classList.contains('control__buttons--delete');
    const rowElement = event.target.parentElement.parentElement.parentElement;
    const dataKey = Number(rowElement.getAttribute('data-key'));

    const typePending = alertsPendingTitle.classList.contains('active');
    const allAlerts = typePending ? getFromLocalStorage('pendingAlerts') : getFromLocalStorage('triggeredAlerts');

    const filteredAlerts = allAlerts.filter((alert) => alert.createdon === dataKey);
    const filteredAlertObject = filteredAlerts[0];


    // If type is pending then only can edit alert
    if (editElement) {
        if (typePending) {
            // Update Alert modal window
            updateAlertModal(filteredAlertObject);
            showAlertModal();
        }
    }
    else if (deleteElement) {
        const filteredAlerts = allAlerts.filter((alert) => alert.createdon !== dataKey);

        if (typePending) {
            unsubscribeStream(filteredAlertObject.symbol, 'alertsTable');

            updateLocalStorage('pendingAlerts', filteredAlerts);
            updateAlertsView();
            showNotification2('Pending alert deleted!', 'ri-delete-bin-6-line');
        }

        else {
            updateLocalStorage('triggeredAlerts', filteredAlerts);
            updateAlertsView();
            showNotification2('Triggered alert deleted!', 'ri-delete-bin-6-line');
        }
    }
})

// done
alertsHeading.addEventListener('click', event => {
    const targetClassList = event.target.classList

    if (targetClassList.contains('alerts__title--pending') && !targetClassList.contains('active')) {
        alertsTriggeredTitle.classList.remove('active')
        alertsPendingTitle.classList.add('active');
        updateAlertsView();
    }
    else if (targetClassList.contains('alerts__title--triggered') && !targetClassList.contains('active')) {
        alertsPendingTitle.classList.remove('active');
        alertsTriggeredTitle.classList.add('active');
        updateAlertsView();
    }
});

navLinks.addEventListener('click', event => {
    // Only perform this when its clicked on a tags
    if (event.target.tagName === 'A') {
        allNavLinks.forEach(link => link.classList.remove('active'));
        event.target.parentElement.classList.add('active')

        const clickedLinkText = event.target.textContent.toLowerCase();

        // Removes showSection from all sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('showSection');
        });

        // Add showSection class to respective section
        document.querySelector(`.${clickedLinkText}`).classList.add('showSection');
    };
});

discordCheckbox.addEventListener('change', () => {
    if (discordCheckbox.checked) {
        viewWebhookURL();
        webhookSettings.classList.add('show');
        addToLocalStorage('sendDiscordAlerts', true);
    }
    else {
        webhookSettings.classList.remove('show');
        addToLocalStorage('sendDiscordAlerts', false);
    }
});

saveUrlButton.addEventListener('click', saveWebhookUrl);


class Notification {
    constructor({ title, description, icon = 'ri-timer-flash-line' }) {
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.duration = 5000;
        this.container = document.createElement('div');
        this.notfObject = {
            key: Date.now(),
            time: getCurrentTime(),
            title: this.title,
            description: this.description,
        };
        this.container.innerHTML = `
        <i class="notification__icon ${icon}"></i>
        <div class="notification__text">
          <p class="notification__text--title">${title}</p>
          <p class="notification__text--description">${description}</p>
        </div>
        <i class="notification__close ri-close-line"></i>
      `;
        this.container.classList.add('notification');
    }

    show() {
        document.getElementById('notifications').appendChild(this.container);

        setTimeout(() => {
            this.hide();
        }, this.duration);

        // Small delay so element can be added properly to dom before showing
        setTimeout(() => {
            this.container.classList.add('show');
        }, 100);

        this.closeElement = this.container.querySelector('.notification__close');
        this.closeElement.addEventListener('click', () => {
            this.hide();
        });

        // Save alerts to local storage
        const allNotifications = getFromLocalStorage('notifications');
        if (allNotifications.length === 0) {
            addToLocalStorage('notifications', [this.notfObject])
        }
        else {
            updateLocalStorage('notifications', [this.notfObject, ...allNotifications])
        }
    }

    hide() {
        this.container.classList.add('hide');

        setTimeout(() => {
            this.container.remove();
        }, 300);
    }
}


initializeWatchlist();
updateAlertsView();
checkDiscordAlerts();