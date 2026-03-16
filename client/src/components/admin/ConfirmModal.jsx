import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Delete", 
  confirmColor = "bg-red-500 hover:bg-red-600",
  icon = <FaTrash className="text-red-500 text-xl" />,
  iconBg = "bg-red-500/10"
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
        >
          <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {icon}
          </div>
          <h3 className="text-xl font-serif text-white mb-3">{title}</h3>
          <p className="text-sm text-white/40 mb-8 leading-relaxed">
            {message}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className={`w-full py-4 ${confirmColor} text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg active:scale-[0.98]`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white/5 text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-white/10 transition-all border border-white/5"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
