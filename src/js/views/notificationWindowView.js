class NotificationWindowView {
    _notificationlist = document.querySelector('.notificationlist');
    _notificationlistClearall = document.querySelector('.notificationlist__clearall');
    _notificationlistContainer = document.querySelector('.notificationlist__container');
    _notificationlistEmpty = document.querySelector('.notificationlist__empty');
    _alertBell = document.querySelector('.nav__notification');
    _notificationLight = document.querySelector('.nav__notification--light');
    _allNotifications;

    updateData(data) {
        this._allNotifications = data;
    }

    _showEmptyText() {
        this._notificationlistEmpty.classList.remove('show');
        this._notificationlistEmpty.classList.add('show');
    }

    _hideEmptyText() {
        this._notificationlistEmpty.classList.remove('show');
    }

    showWindow() {
        this._notificationlist.classList.remove('show');
        this._notificationlist.classList.add('show');
    }

    hideWindow() {
        this._notificationlist.classList.remove('show');
    }

    _clearWindow() {
        this._notificationlistContainer.innerHTML = '';

        // Shows empty text
        this._showEmptyText();
    }

    showNotificationLight() {
        this._notificationLight.classList.remove('active');
        this._notificationLight.classList.add('active');
    }

    hideNotificationLight() {
        this._notificationLight.classList.remove('active');
    }

    _generateMarkup() {
        const markup = this._allNotifications.map((notf) => {
            return `<li class="notification" data-key=${notf.key}>
            <span class="notification__time">${notf.time}</span>
            <div class="notification__container">
                <span class="notification__condition">${notf.condition}</span>
                <span class="notification__title">${notf.title}</span>
                <span class="notification__desc">${notf.description}</span>
            </div>
            <i class="notification__button--close ri-close-line"></i>
        </li>`;
        }).join('');

        return markup;
    }

    render() {
        if (this._allNotifications.length === 0) {
            this._notificationlistContainer.innerHTML = '';
            this._showEmptyText();
        }
        else {
            const markup = this._generateMarkup();
            this._notificationlistContainer.innerHTML = markup;
            this._hideEmptyText();
        }
    }

    addClearWindowHandler(handler) {
        this._notificationlistClearall.addEventListener('click', () => {
            this._clearWindow();

            handler();
        });
    }

    addAlertBellHandler(handler) {
        this._alertBell.addEventListener('click', () => {
            this._notificationlist.classList.toggle('show');
            this.hideNotificationLight();

            handler();

            // Always scroll to top to show latest notification
            this._notificationlistContainer.scrollTop = 0;
        });
    }

    addNotificationRemoveHandler(handler) {
        this._notificationlist.addEventListener('click', event => {
            if (event.target.classList.contains('notification__button--close')) {
                const parentElement = event.target.parentElement;
                const dataKey = Number(parentElement.getAttribute('data-key'));

                handler(dataKey);

                // Due to event bubbling event triggered here moves up to documnent hence closing bell window
                // To prevent this stop event to propagate further
                event.stopPropagation();
            }
        });
    }

    addHideWindowHandler() {
        document.addEventListener('click', (event) => {
            if (!this._alertBell.contains(event.target) && !this._notificationlist.contains(event.target)) {
                this.hideWindow();
            };
        });
    }
}

export default new NotificationWindowView();