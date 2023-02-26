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
        const markup = this._genrateMarkup();
        this._searchResults.innerHTML = markup;
        this._searchResults.style.display = 'block';
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

    _clearSearchInput() {
        this._searchInput.value = '';
    }

    _genrateMarkup() {
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