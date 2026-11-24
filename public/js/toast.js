// ==========================================================================
// Campus Connect - Reusable Toast Notification System
// ==========================================================================
(function() {
    function getOrCreateContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS = {
        success: 'check-circle-2',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    const TITLES = {
        success: 'Success',
        error: 'Error',
        warning: 'Notice',
        info: 'Information'
    };

    window.showToast = function(message, type = 'info', title = null, duration = 4200) {
        const container = getOrCreateContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconName = ICONS[type] || 'info';
        const displayTitle = title || TITLES[type] || 'Notice';

        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="toast-body">
                <div class="toast-title">${displayTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" type="button" aria-label="Close">
                <i data-lucide="x"></i>
            </button>
            <div class="toast-progress">
                <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
            </div>
        `;

        container.appendChild(toast);

        if (window.lucide) {
            lucide.createIcons({ root: toast });
        }

        const closeBtn = toast.querySelector('.toast-close');
        let removeTimeout = null;

        function dismissToast() {
            if (removeTimeout) clearTimeout(removeTimeout);
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 250);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', dismissToast);
        }
        removeTimeout = setTimeout(dismissToast, duration);
    };
})();
