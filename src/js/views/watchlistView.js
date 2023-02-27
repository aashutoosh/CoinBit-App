class WatchlistView {
    _watchlistItems = document.querySelector('.watchlist__items');
    _watchlistSymbols;

    updateData(watchlistSymbols) {
        this._watchlistSymbols = watchlistSymbols;
    }

    render() {
        const markup = this._genrateMarkup();
        this._watchlistItems.innerHTML = markup;
    }

    addToWatchlist(symbol) {
        const markup = this._genrateMarkup([symbol]);
        this._watchlistItems.innerHTML += markup;
    }

    updateWatchlistItemData(data) {
        const coin = data.data.s;
        const price = Number(data.data.c);
        const priceChange = Number(data.data.P);

        // Find list item with a matching coin symbol and update its price and price change.
        const listItems = this._watchlistItems.querySelectorAll('li.symbol');
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

    addDeleteItemHandler(handler) {
        // Used event delegation here
        this._watchlistItems.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete')) {
                const listElement = event.target.closest('.watchlist__item')
                const symbol = listElement.querySelector('.symbol__name').textContent;

                // Remove element from DOM
                this._watchlistItems.removeChild(listElement);

                handler(symbol);
            }
        });
    }

    addAlertModalHandler(handler) {
        // Used event delegation here
        this._watchlistItems.addEventListener('click', (event) => {
            if (event.target.classList.contains('createNewAlert')) {
                const symbol = event.target.parentElement.parentElement.querySelector('.symbol__name').textContent;

                handler(symbol);
            }
        });
    }

    _clearSearchInput() {
        this._watchlistItems.value = '';
    }

    _genrateMarkup(symbols = this._watchlistSymbols) {
        if (symbols.length === 0) return ''

        const markup = symbols.map((symbol) => {
            return `<li class="watchlist__item symbol ">
            <span class="symbol__name">${symbol}</span>
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
        }).join('');

        return markup;
    }
}

export default new WatchlistView();