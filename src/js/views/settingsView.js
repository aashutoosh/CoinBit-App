class SettingsView {
    _discordCheckbox = document.getElementById('discord__checkbox');
    _webhookSettings = document.querySelector('.webhook');
    _saveUrlButton = document.querySelector('.save__url');
    _webhookUrlInput = document.getElementById('webhookURL');
    _webhookUrl;
    _discordChecked;

    updateData(url, discordChecked) {
        this._webhookUrl = url;
        this._discordChecked = discordChecked;
    }

    showWebhookURL() {
        if (this._webhookUrl) {
            this._webhookUrlInput.value = this._webhookUrl;
        }
    }

    updateInitialSettings() {
        this._discordCheckbox.checked = this._discordChecked === true;

        // Dispatch a 'change' event on the checkbox to trigger the event listener
        // small delay is added so its fully loaded in dom
        setTimeout(() => {
            this._discordCheckbox.dispatchEvent(new Event('change'));
        }, 300)
    }

    addDiscordCheckboxHandler(handler) {
        this._discordCheckbox.addEventListener('change', () => {
            if (this._discordCheckbox.checked) {
                this.showWebhookURL();
                this._webhookSettings.classList.add('show');
                handler(true);
            }
            else {
                this._webhookSettings.classList.remove('show');
                handler(false);
            }
        });
    }

    addSaveButtonHandler(handler) {
        this._saveUrlButton.addEventListener('click', () => {
            const savedUrl = handler(this._webhookUrlInput.value);
            if (savedUrl) {
                this.updateData(savedUrl)
                this.showWebhookURL();
            }
        });
    }
}

export default new SettingsView();