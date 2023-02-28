class AlertSectionView {
    _createAlertButton = document.querySelector('.alerts__create--button');
    _alertsTable = document.querySelector('.alerts__table--tbody');
    _alertsHeading = document.querySelector('.heading__window');
    _alertsPendingTitle = document.querySelector('.alerts__title--pending');
    _alertsTriggeredTitle = document.querySelector('.alerts__title--triggered');
    _allPendingAlerts;
    _allTriggeredAlerts;

    updateData(allPendingAlerts, allTriggeredAlerts) {
        this._allPendingAlerts = allPendingAlerts;
        this._allTriggeredAlerts = allTriggeredAlerts;

    }

    render() {
        const markup = this._generateMarkup();
        this._alertsTable.innerHTML = markup;
    }

    _isPendingAlertType() {
        return this._alertsPendingTitle.classList.contains('active');
    }

    _getAllAlerts(pendingAlertsType) {
        return pendingAlertsType ? this._allPendingAlerts : this._allTriggeredAlerts;
    }

    _generateMarkup() {
        const pendingAlertsType = this._isPendingAlertType();
        const allAlerts = this._getAllAlerts(pendingAlertsType);

        const newRow = (alert) => {
            return `<tr class="row" data-key="${alert.createdon}">
            <td>
                <div class="textContent">
                    <span class="title">${alert.title}</span>
                    <span class="description">${alert.description}</span>
                </div>
            </td>
            <td>
                <div class="control__buttons">
                    ${pendingAlertsType ? `<i class="control__buttons--edit ri-pencil-line"></i>` : ''}
                    <i class="control__buttons--delete ri-close-line"></i>
                </div>
            </td>
            <td>${alert.symbol}</td>
            <td><span>${alert.condition}</span></td>
            <td>${alert.price}</td>
        </tr>`
        }

        const markup = allAlerts.reverse().map(alert => newRow(alert)).join('');
        return markup
    }

    switchTableTypeHandler(handler) {
        this._alertsHeading.addEventListener('click', event => {
            const targetClassList = event.target.classList

            if (targetClassList.contains('alerts__title--pending') && !targetClassList.contains('active')) {
                this._alertsTriggeredTitle.classList.remove('active')
                this._alertsPendingTitle.classList.add('active');
            }
            else if (targetClassList.contains('alerts__title--triggered') && !targetClassList.contains('active')) {
                this._alertsPendingTitle.classList.remove('active');
                this._alertsTriggeredTitle.classList.add('active');
            }

            handler();
        });
    }

    addButtonHandler(handler) {
        this._alertsTable.addEventListener('click', event => {
            const editElement = event.target.classList.contains('control__buttons--edit');
            const deleteElement = event.target.classList.contains('control__buttons--delete');
            const rowElement = event.target.closest('.row');
            const dataKey = Number(rowElement.getAttribute('data-key'));

            const pendingAlertsType = this._isPendingAlertType();
            const allAlerts = this._getAllAlerts(pendingAlertsType);

            const filteredAlerts = allAlerts.filter((alert) => alert.createdon === dataKey);
            const filteredAlertObject = filteredAlerts[0];

            // If type is pending then only can edit alert
            if (editElement && pendingAlertsType) {
                handler('edit', pendingAlertsType, filteredAlertObject);
            }
            else if (deleteElement) {
                handler('delete', pendingAlertsType, filteredAlertObject);
            }
        })
    }

    addCreateAlertButtonHandler(handler) {
        this._createAlertButton.addEventListener('click', handler)
    }
}

export default new AlertSectionView();