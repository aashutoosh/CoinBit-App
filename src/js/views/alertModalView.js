class AlertModalView {
    _createalert = document.querySelector('.createalert');
    _createalertClose = document.querySelector('.createalert__close');
    _createalertForm = document.querySelector('.createalert__form');
    _createalertTitle = document.querySelector('.createalert__title');
    _formInputTitle = document.querySelector('.input.title');
    _formInputDescription = document.querySelector('.input.description');
    _formSelectSymbol = document.querySelector('.select.symbol');
    _formSelectCondition = document.querySelector('.select.condition');
    _formInputPrice = document.querySelector('.input.price');
    _createalertSubmit = document.querySelector('.createalert__form--submit');
    _uniqueSymbols;


    show() {
        this._createalert.classList.remove('show');
        this._createalert.classList.add('show');
    }

    close() {
        this._createalert.classList.remove('show');
        this._createalertForm.reset();
    }

    updateData(symbols) {
        this._uniqueSymbols = symbols;
    }

    _genrateOptionsMarkup(currentSymbol = '') {
        const markup = this._uniqueSymbols.map(symbol => {
            if (symbol === currentSymbol) return `<option value="${symbol}" selected>${symbol}</option>`;
            else return `<option value="${symbol}">${symbol}</option>`;
        }).join('');

        return markup;
    }

    create(symbol = '') {
        this._createalertForm.setAttribute('data-key', '');
        this._createalertTitle.textContent = 'Create Alert';
        this._createalertSubmit.textContent = 'Create';
        this._formSelectSymbol.innerHTML = this._genrateOptionsMarkup(symbol);

        this.show();
    }

    update(alert) {
        this._createalertForm.setAttribute('data-key', alert.createdon);
        this._createalertTitle.textContent = 'Update Alert';
        this._createalertSubmit.textContent = 'Update';
        this._formInputTitle.value = alert.title;
        this._formInputDescription.value = alert.description;
        this._formSelectCondition.value = alert.condition;
        this._formInputPrice.value = alert.price;
        this._formSelectSymbol.innerHTML = this._genrateOptionsMarkup(alert.symbol);

        this.show();
    }

    alertModalClose() {
        this._createalertClose.addEventListener('click', this.close.bind(this));
    }

    updateModalSymbolPrice(data) {
        if (this._createalert.classList.contains('show')) {
            const symbol = data.data.s;
            const currentPrice = Number(data.data.c);

            const selectElement = document.getElementById("modalSymbolSelect");
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const selectedOptionValue = selectedOption.value;

            if (selectedOptionValue === symbol) {
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

    addSubmitHandler(handler) {
        this._createalertForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(this._createalertForm);

            // If Update alert modal is used then data-key attribute will have value
            const dataKey = Number(this._createalertForm.getAttribute('data-key'));
            const alertObject = {
                createdon: Date.now(),
                title: formData.get('title'),
                description: formData.get('description'),
                symbol: formData.get('symbol'),
                condition: formData.get('condition'),
                price: formData.get('price'),
            };

            handler(alertObject, dataKey);
        })
    }
}

export default new AlertModalView();