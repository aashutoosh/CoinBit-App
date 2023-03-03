class AlertModalView {
    _alertmodal = document.querySelector('.alertmodal');
    _alertmodalClose = document.querySelector('.alertmodal__close');
    _alertmodalForm = document.querySelector('.alertmodal__form');
    _alertmodalTitle = document.querySelector('.alertmodal__title');
    _formInputTitle = document.querySelector('.input.title');
    _formInputDescription = document.querySelector('.input.description');
    _formSelectSymbol = document.querySelector('.select.symbol');
    _formSelectCondition = document.querySelector('.select.condition');
    _formInputPrice = document.querySelector('.input.price');
    _alertmodalSubmit = document.querySelector('.alertmodal__form--submit');
    _uniqueSymbols;


    show() {
        this._alertmodal.classList.remove('show');
        this._alertmodal.classList.add('show');
    }

    close() {
        this._alertmodal.classList.remove('show');
        this._alertmodalForm.reset();
    }

    updateData(symbols) {
        this._uniqueSymbols = symbols;
    }

    _generateOptionsMarkup(currentSymbol = '') {
        const markup = this._uniqueSymbols.map(symbol => {
            if (symbol === currentSymbol) return `<option value="${symbol}" selected>${symbol}</option>`;
            else return `<option value="${symbol}">${symbol}</option>`;
        }).join('');

        return markup;
    }

    create(symbol = '') {
        this._alertmodalForm.setAttribute('data-key', '');
        this._alertmodalTitle.textContent = 'Create Alert';
        this._alertmodalSubmit.textContent = 'Create';
        this._formSelectSymbol.innerHTML = this._generateOptionsMarkup(symbol);

        this.show();
    }

    update(alert) {
        this._alertmodalForm.setAttribute('data-key', alert.createdon);
        this._alertmodalTitle.textContent = 'Update Alert';
        this._alertmodalSubmit.textContent = 'Update';
        this._formInputTitle.value = alert.title;
        this._formInputDescription.value = alert.description;
        this._formSelectCondition.value = alert.condition;
        this._formInputPrice.value = alert.price;
        this._formSelectSymbol.innerHTML = this._generateOptionsMarkup(alert.symbol);

        this.show();
    }

    alertModalClose() {
        this._alertmodalClose.addEventListener('click', this.close.bind(this));
    }

    updateModalSymbolPrice(data) {
        if (this._alertmodal.classList.contains('show')) {
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
        this._alertmodalForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(this._alertmodalForm);

            // If Update alert modal is used then data-key attribute will have value
            const dataKey = Number(this._alertmodalForm.getAttribute('data-key'));
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