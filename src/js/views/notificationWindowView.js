class NotificationWindowView {
    _bellwindow = document.querySelector('.bellwindow');
    _bellwindowClearall = document.querySelector('.bellwindow__clearall');
    _bellwindowContainer = document.querySelector('.bellwindow__container');
    _bellwindowEmpty = document.querySelector('.bellwindow__empty');
    _alertBell = document.querySelector('.nav__notification');
    _notificationLight = document.querySelector('.nav__notification--light');
    _allNotifications;

    updateData(data) {
        this._allNotifications = data;
    }

    _showEmptyText() {
        this._bellwindowEmpty.classList.remove('show');
        this._bellwindowEmpty.classList.add('show');
    }

    _hideEmptyText() {
        this._bellwindowEmpty.classList.remove('show');
    }

    showWindow() {
        this._bellwindow.classList.remove('show');
        this._bellwindow.classList.add('show');
    }

    hideWindow() {
        this._bellwindow.classList.remove('show');
    }

    _clearWindow() {
        this._bellwindowContainer.innerHTML = '';

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
            this._bellwindowContainer.innerHTML = '';
            this._showEmptyText();
        }
        else {
            const markup = this._generateMarkup();
            this._bellwindowContainer.innerHTML = markup;
            this._hideEmptyText();
        }
    }

    addClearWindowHandler(handler) {
        this._bellwindowClearall.addEventListener('click', () => {
            this._clearWindow();

            handler();
        });
    }

    addAlertBellHandler(handler) {
        this._alertBell.addEventListener('click', () => {
            this._bellwindow.classList.toggle('show');
            this.hideNotificationLight();

            handler();

            // Always scroll to top to show latest notification
            this._bellwindowContainer.scrollTop = 0;
        });
    }

    addNotificationRemoveHandler(handler) {
        this._bellwindow.addEventListener('click', event => {
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
            if (!this._alertBell.contains(event.target) && !this._bellwindow.contains(event.target)) {
                this.hideWindow();
            };
        });
    }
}

export default new NotificationWindowView();