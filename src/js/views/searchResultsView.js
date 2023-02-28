class SearchResultsView {
    _allSymbols;
    _watchlistSymbols;
    _searchQuery;
    _searchInput = document.querySelector('.watchlist__search--input');
    _searchResults = document.querySelector('.searchresults');

    updateData(allSymbols, watchlistSymbols) {
        this._allSymbols = allSymbols;
        this._watchlistSymbols = watchlistSymbols;
    }

    render() {
        this._searchQuery = this._searchInput.value.toUpperCase();
        const markup = this._generateMarkup();
        this._searchResults.innerHTML = markup;
        this._searchResults.style.display = 'block';
    }

    modifyAddToCheck(event) {
        // Activate checked green button
        event.target.classList.remove('ri-add-line');
        event.target.classList.add('ri-check-line', 'active');
    }

    addInputChangeHandler(handler) {
        this._searchInput.addEventListener('input', handler);
    }

    addSearchResultsHideHandler(handler) {
        document.addEventListener('mousedown', (event) => {
            if (this._searchResults.contains(event.target)) return;
            else if (this._searchInput.contains(event.target)) return;

            this._searchResults.style.display = 'none';
            this._clearSearchInput();
            handler();
        });
    }

    addSymbolToWatchlisthandler(handler) {
        this._searchResults.addEventListener('click', (event) => {
            if (event.target.classList.contains('button__item')) {
                const coinName = event.target.parentElement.querySelector('.coinname').textContent;

                handler(coinName, event);
            }
        })
    }

    _clearSearchInput() {
        this._searchInput.value = '';
    }

    _generateMarkup() {
        if (!this._searchQuery) return '';
        const filteredSymbols = this._allSymbols.filter((symbol) => symbol.indexOf(this._searchQuery) !== -1);

        const markup = filteredSymbols.map(
            (symbol) => {
                if (this._watchlistSymbols.includes(symbol)) {
                    return `<li class="searchresults__item">
                    <span class="coinname">${symbol}</span>
                    <i class="button__item button__item--green ri-check-line active"></i>
                </li>`
                }
                else {
                    return `<li class="searchresults__item">
                    <span class="coinname">${symbol}</span>
                    <i class="button__item button__item--green ri-add-line"></i>
                </li>`
                }
            }
        ).join('');

        return markup;
    }
}

export default new SearchResultsView();