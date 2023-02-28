class HeaderView {
    _navLinks = document.getElementById('nav__links');
    _allNavLinks = document.querySelectorAll('.nav__link');

    activeNavSection() {
        this._navLinks.addEventListener('click', event => {
            // Only perform this when its clicked on a tags
            if (event.target.tagName === 'A') {
                this._allNavLinks.forEach(link => link.classList.remove('active'));
                event.target.parentElement.classList.add('active')

                const clickedLinkText = event.target.textContent.toLowerCase();

                // Removes showSection from all sections
                document.querySelectorAll('section').forEach(section => {
                    section.classList.remove('showSection');
                });

                // Add showSection class to respective section
                document.querySelector(`.${clickedLinkText}`).classList.add('showSection');
            };
        });
    }
}

export default new HeaderView();