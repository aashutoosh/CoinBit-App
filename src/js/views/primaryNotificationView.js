import { PRIMARY_NOTIFICATION_SEC } from "../config.js";

class PrimaryNotificationView {
    _primaryElement = document.getElementById('primary__notifications');

    _hide(childNode) {
        childNode.classList.add('hide');

        setTimeout(() => {
            childNode.remove();
        }, 300);
    }

    _generateNotification(title, description, condition, icon) {
        const notification = document.createElement('div');
        notification.innerHTML = `
        <i class="notification__icon ${icon}"></i>
        <div class="notification__text">
            <p class="notification__text--condition">${condition}</p>
            <p class="notification__text--title">${title}</p>
            <p class="notification__text--description">${description}</p>
        </div>
        <i class="notification__close ri-close-line"></i>`;
        notification.classList.add('notification');

        return notification;
    }

    render(title, description, condition, icon) {
        const childNode = this._generateNotification(title, description, condition, icon);
        this._primaryElement.appendChild(childNode);

        setTimeout(() => {
            this._hide(childNode);
        }, PRIMARY_NOTIFICATION_SEC);

        // Small delay so element can be added properly to dom before showing
        setTimeout(() => {
            childNode.classList.add('show');
        }, 100);

        const closeElement = childNode.querySelector('.notification__close');
        closeElement.addEventListener('click', () => {
            this._hide(childNode);
        });
    }
}

export default new PrimaryNotificationView();