import React from 'react';

/**
 * Reusable Notification Modal Component
 * @param {boolean} show - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} type - 'success', 'error', or 'warning'
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 */
const NotificationModal = ({ show, onClose, type = 'success', title, message }) => {
    if (!show) return null;

    const config = {
        success: {
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            buttonColor: 'bg-green-600 hover:bg-green-700',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )
        },
        error: {
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonColor: 'bg-red-600 hover:bg-red-700',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )
        },
        warning: {
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        }
    };

    const currentConfig = config[type] || config.success;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
                <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className={`mx-auto w-16 h-16 ${currentConfig.bgColor} rounded-full flex items-center justify-center`}>
                        <div className={currentConfig.iconColor}>
                            {currentConfig.icon}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-zinc-600 whitespace-pre-line text-sm">
                            {message}
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`w-full py-3 text-white font-medium rounded-lg transition-colors ${currentConfig.buttonColor}`}
                    >
                        {type === 'success' ? 'Continue' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
