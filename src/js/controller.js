import * as model from './model.js';
import searchResultsView from './views/searchResultsView.js';

const showSearchResults = async function () {
    if (model.state.allFetchedSymbols.length === 0) await fetchAllSymbols();

    searchResultsView.updateData(model.state.allFetchedSymbols, model.state.watchlist);
    searchResultsView.render();
}

const hideSearchResults = function () {
    searchResultsView.render();
}

const init = function () {
    searchResultsView.addInputChangeHandler(showSearchResults);
    searchResultsView.addSearchResultsHideHandler(hideSearchResults);
};
init();
