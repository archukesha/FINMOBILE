import React from 'react';
import Advice from './Advice';
import Icon from './Icon';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionLevel: 'FREE' | 'PRO' | 'PREMIUM';
  onGoToSettings: () => void;
}

const AdviceModal: React.FC<AdviceModalProps> = ({ isOpen, onClose, subscriptionLevel, onGoToSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-slate-50 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] pb-8 pt-2 pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 max-h-[85vh] overflow-y-auto shadow-2xl relative">
        <div className="sticky top-0 right-0 flex justify-end p-4 z-20 pointer-events-none">
            <button 
                onClick={onClose} 
                className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 pointer-events-auto hover:bg-slate-100 transition-colors"
            >
                <Icon name="x" size={20} />
            </button>
        </div>
        
        <div className="-mt-12">
            <Advice 
                subscriptionLevel={subscriptionLevel} 
                onGoToSettings={() => {
                    onClose();
                    onGoToSettings();
                }} 
            />
        </div>
      </div>
    </div>
  );
};

export default AdviceModal;