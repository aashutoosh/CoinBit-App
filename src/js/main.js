const body = document.querySelector('body');

const searchInput = document.querySelector('.watchlist__search--input');
const watchlistItems = document.querySelector('.watchlist__items');

const searchResults = document.querySelector('.searchresults');

const bellwindow = document.querySelector('.bellwindow');
const bellwindowClearall = document.querySelector('.bellwindow__clearall');
const bellwindowContainer = document.querySelector('.bellwindow__container');
const bellwindowEmpty = document.querySelector('.bellwindow__empty');

const createalert = document.querySelector('.createalert');
const formSubmit = document.querySelector('.createalert__form');
const createalertClose = document.querySelector('.createalert__close');
const createalertOption = document.querySelector('.createalert__form--symbol');

const alertBell = document.querySelector('.nav__notification');
const notificationLight = document.querySelector('.nav__notification--light');


let allSymbols;
let ws;

function addToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key))
}

function updateLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

function removeFromLocalStorage(key) {
    localStorage.removeItem(key)
}

function addCoins(params) {
    if (params) {
        const filteredCoins = allSymbols.filter((symbol) => symbol.indexOf(params.toUpperCase()) !== -1)

        const coinsListHtml = filteredCoins.map(
            (coin) => {
                const initialWatchlist = getFromLocalStorage('watchlist')

                if (initialWatchlist && initialWatchlist.includes(coin)) {
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

    const initialWatchlist = getFromLocalStorage('watchlist');

    if (!initialWatchlist) {
        addToLocalStorage('watchlist', [coin]);
        activateButton();
        watchlistItems.innerHTML = watchlistItem;
    }
    else if (!initialWatchlist.includes(coin)) {
        addToLocalStorage('watchlist', [...initialWatchlist, coin]);
        activateButton();
        watchlistItems.innerHTML += watchlistItem;
    }

    // If websocket is connected then subscribe to stream otherwise initiate connection
    if (ws) subscribeStream(coin);
    else wsConnect([coin]);

    showAlertNotification(`Added: ${coin}`, `${coin} added to watchlist!`, 'ri-checkbox-circle-line');
}

function removeFromWatchlist(coin, element) {
    const initialWatchlist = getFromLocalStorage('watchlist');
    const modifiedWatchlist = initialWatchlist.filter(s => s !== coin);
    updateLocalStorage('watchlist', modifiedWatchlist);

    const listElement = element.target.parentElement.parentElement;
    const parentElement = listElement.parentElement;

    parentElement.removeChild(listElement);

    unsubscribeStream(coin);

    showAlertNotification(`Removed: ${coin}`, `${coin} removed from watchlist!`, 'ri-delete-bin-line');
}

function initializeWatchlist() {
    const initialWatchlist = getFromLocalStorage('watchlist')

    if (!initialWatchlist) {
        watchlistItems.innerHTML = ''
    }
    else if (initialWatchlist.length > 0) {
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
        wsConnect(initialWatchlist);
    }
}

function initializeNotifications() {
    const allNotifications = getFromLocalStorage('notifications')

    if (!allNotifications) {
        bellwindowContainer.innerHTML = '';
        bellwindowEmpty.classList.remove('show');
        bellwindowEmpty.classList.add('show');
    }
    else if (allNotifications.length > 0) {
        const notfItems = allNotifications.map((notf) => {
            return `<li class="notification">
            <span class="notification__time">${notf.time}</span>
            <div class="notification__container">
                <span class="notification__title">${notf.title}</span>
                <span class="notification__desc">${notf.description}</span>
            </div>
        </li>`;
        }).join('')

        bellwindowContainer.innerHTML = notfItems;
        bellwindowEmpty.classList.remove('show');
    }

    // Always scroll to top to show latest notification
    bellwindowContainer.scrollTop = 0;
}

function wsConnect(watchlist) {
    const wsUrl = "wss://stream.binance.com:443/stream?streams=";
    const allStreams = watchlist.map(coin => coin.toLowerCase() + '@ticker').join('/')

    ws = new WebSocket(wsUrl + allStreams);

    ws.onopen = (event) => {
        showAlertNotification('WebSocket Open', 'Binance websocket connection opened!', 'ri-link-m');
    }

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if ('stream' in data) {
            updateWatchlistData(data);
        }
    };

    ws.onerror = (event) => console.error("WebSocket error: ", event)

    ws.onclose = (event) => {
        showAlertNotification('WebSocket Close', 'Binance websocket connection closed!', 'ri-link-unlink-m');

        // Reconnect to the WebSocket after 10 seconds
        setTimeout(function () {
            wsConnect(watchlist);
        }, 10000);
    };
}

function subscribeStream(coin) {
    ws.send(JSON.stringify({
        id: Date.now(),
        method: "SUBSCRIBE",
        params: [coin.toLowerCase() + '@ticker']
    }));
}

function unsubscribeStream(coin) {
    ws.send(JSON.stringify({
        id: Date.now(),
        method: "UNSUBSCRIBE",
        params: [coin.toLowerCase() + '@ticker']
    }));
}

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

function getCurrentTime() {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${period}`;
}

function fillCreateAlertSymbols(coin = '') {
    const initialWatchlist = getFromLocalStorage('watchlist');

    const symbolOptions = initialWatchlist.map(symbol => {
        if (symbol === coin) return `<option value="${symbol}" selected>${symbol}</option>`;
        else return `<option value="${symbol}">${symbol}</option>`;
    }).join('');

    createalertOption.innerHTML = symbolOptions;
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


fetch("https://api.binance.com/api/v3/exchangeInfo")
    .then(response => response.json())
    .then(data => {
        allSymbols = data.symbols.map(symbol => symbol.symbol);
    });

searchInput.addEventListener('input', () => addCoins(searchInput.value));

// Hides search result when clicked outside of search result and search input
document.addEventListener('mousedown', (event) => {
    if (!searchResults.contains(event.target) && !searchInput.contains(event.target)) {
        searchResults.style.display = 'none';
        searchInput.value = ''
        addCoins('')
    }
});

document.addEventListener('click', (event) => {
    if (!bellwindow.contains(event.target) && !alertBell.contains(event.target)) {
        bellwindow.classList.remove('show');
    };
});

// Shows search result again if input is in focus
searchInput.addEventListener('focus', () => searchResults.style.display = 'block');

// Used event delegation here
searchResults.addEventListener('click', (event) => {
    if (event.target.classList.contains('button__item')) {
        const coinName = event.target.parentElement.querySelector('.coinname').textContent;

        addToWatchlist(coinName, event);
    }
});

// Used event delegation here
watchlistItems.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete')) {
        const coinName = event.target.parentElement.parentElement.querySelector('.symbol__name').textContent;

        removeFromWatchlist(coinName, event);
    }

    else if (event.target.classList.contains('createNewAlert')) {
        const coinName = event.target.parentElement.parentElement.querySelector('.symbol__name').textContent;

        // Fill Create alert window with watchlist symbols
        fillCreateAlertSymbols(coinName);

        createalert.classList.remove('show');
        createalert.classList.add('show');
    }
});

createalertClose.addEventListener('click', () => {
    createalert.classList.remove('show');
    formSubmit.reset();
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
});

formSubmit.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(formSubmit);

    const alertObject = {
        createdon: Date.now(),
        title: formData.get('title'),
        description: formData.get('description'),
        symbol: formData.get('symbol'),
        condition: formData.get('condition'),
        price: formData.get('price'),
    };

    const pendingAlerts = getFromLocalStorage('pendingAlerts');

    if (!pendingAlerts) addToLocalStorage('pendingAlerts', [alertObject]);
    else {
        addToLocalStorage('pendingAlerts', [...pendingAlerts, alertObject]);
    }

    // Close create alert window
    createalert.classList.remove('show');
    formSubmit.reset();

    // Update Pending alerts view
});


class Notification {
    constructor({ title, description, icon = 'ri-timer-flash-line' }) {
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.duration = 5000;
        this.container = document.createElement('div');
        this.notfObject = {
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
        if (!allNotifications) {
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