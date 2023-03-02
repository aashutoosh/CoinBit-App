class HeaderView {
    _html = document.querySelector('html');
    _themeIcons = document.querySelector('.nav__theme');
    _moonIcon = document.querySelector('.nav__theme .icon-moon');
    _sunIcon = document.querySelector('.nav__theme .icon-sun');
    _navLinks = document.getElementById('nav__links');
    _linkContainer = document.querySelector('.links__container');
    _allNavLinks = document.querySelectorAll('.nav__link');

    _setDarkMode() {
        this._html.dataset.theme = 'dark';
        this._moonIcon.classList.remove('active');
        this._sunIcon.classList.add('active');
    }

    _setLightMode() {
        this._html.dataset.theme = 'light';
        this._sunIcon.classList.remove('active');
        this._moonIcon.classList.add('active');
    }

    changeTheme(themeType) {
        const currentTheme = this._html.getAttribute('data-theme');
        if (currentTheme !== themeType) {
            if (currentTheme === 'light') {
                this._setDarkMode();
            }
            else if ((currentTheme === 'dark')) {
                this._setLightMode();
            }
        }
    }

    addThemeToggleHandler(handler) {
        this._themeIcons.addEventListener('click', () => {
            if (this._html.getAttribute('data-theme') === 'light') {
                this._setDarkMode();
                handler('dark');
            }
            else if ((this._html.getAttribute('data-theme') === 'dark')) {
                this._setLightMode();
                handler('light');
            }
        });
    }

    activeNavSection() {
        this._linkContainer.addEventListener('click', event => {
            if (event.target.closest('li.nav__link')) {
                this._allNavLinks.forEach(link => link.classList.remove('active'));

                const listElement = event.target.closest('.nav__link');
                listElement.classList.add('active');

                const clickedLinkText = listElement.querySelector('a span').textContent.toLowerCase();
                // Removes showSection from all sections
                document.querySelectorAll('section').forEach(section => {
                    section.classList.remove('showSection');
                });

                // Add showSection class to respective section
                document.querySelector(`.${clickedLinkText}`).classList.add('showSection');
            }
        });
    }
}

export default new HeaderView();