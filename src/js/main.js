const searchInput = document.querySelector('.watchlist__search--input')
const searchResults = document.querySelector('.searchresults')
const watchlistItems = document.querySelector('.watchlist__items')

let allSymbols;

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

function addToWatchlist(coinName, event) {
    const watchlistItem = `<li class="watchlist__item symbol ">
        <span class="symbol__name">${coinName}</span>
        <div class="symbol__price">
            <span class="symbol__price--latest">0.00</span>
            <div>
                <span class="symbol__price--24change">(+0.00%)</span>
                <i class="symbol__price--direction ri-arrow-up-s-fill"></i>
            </div>
        </div>
    </li>`

    const activateButton = () => {
        event.target.classList.remove('ri-add-line');
        event.target.classList.add('ri-check-line', 'active');
    }

    const initialWatchlist = getFromLocalStorage('watchlist')

    if (!initialWatchlist) {
        addToLocalStorage('watchlist', [coinName])
        activateButton()
        watchlistItems.innerHTML = watchlistItem
    }
    else if (!initialWatchlist.includes(coinName)) {
        addToLocalStorage('watchlist', [...initialWatchlist, coinName])
        activateButton()
        watchlistItems.innerHTML += watchlistItem
    }
}

function initializeWatchlist() {
    const initialWatchlist = getFromLocalStorage('watchlist')

    if (!initialWatchlist) {
        watchlistItems.innerHTML = ''
    }
    else {
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
        </li>`
        }).join('')
        watchlistItems.innerHTML = watchlistItem
    }
}


fetch("https://api.binance.com/api/v3/exchangeInfo")
    .then(response => response.json())
    .then(data => {
        allSymbols = data.symbols.map(symbol => symbol.symbol);
    });

searchInput.addEventListener('input', () => addCoins(searchInput.value))

// Hides search result when clicked outside of search result and search input
document.addEventListener('mousedown', (event) => {
    if (!searchResults.contains(event.target) && !searchInput.contains(event.target)) {
        searchResults.style.display = 'none';
    }
});

// Shows search result again if input is in focus
searchInput.addEventListener('focus', () => searchResults.style.display = 'block');

// Used event delegation here
searchResults.addEventListener('click', (event) => {
    if (event.target.classList.contains('button__item')) {
        const coinName = event.target.parentElement.querySelector('.coinname').textContent;

        addToWatchlist(coinName, event)
    }
})

initializeWatchlist()