import { toast, ToastOptions } from 'react-hot-toast';
import { CheckCircle, AlertOctagon, AlertTriangle, Info } from 'lucide-react';

interface CustomToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
}

export const showToast = ({ type, message, action }: CustomToastProps, options?: ToastOptions) => {
  const icons = {
    success: <CheckCircle className="text-green-500" />,
    error: <AlertOctagon className="text-red-500" />,
    warning: <AlertTriangle className="text-orange-500" />,
    info: <Info className="text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-orange-50 border-orange-100',
    info: 'bg-blue-50 border-blue-100',
  };

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden border ${bgColors[type]}`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {icons[type]}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
          </div>
        </div>
        {(action || t.type !== 'loading') && (
          <div className="flex flex-col border-l border-gray-200">
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-tr-lg p-3 flex items-center justify-center text-sm font-bold text-bleu-rca hover:text-bleu-rca/80 hover:bg-gray-50 focus:outline-none"
              >
                {action.label}
              </button>
            )}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none p-3 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 hover:bg-gray-50 focus:outline-none"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    ),
    options
  );
};
