
import React from 'react';
import Icon from './Icon';

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void; // Usually Delete
  onSwipeRight?: () => void; // Usually Edit/Action
  leftIcon?: string;
  leftColor?: string;
  rightIcon?: string;
  rightColor?: string;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ 
    children, 
    onSwipeLeft, 
    onSwipeRight, 
    leftIcon = 'trash-2', 
    leftColor = 'bg-red-500', 
    rightIcon = 'edit-2', 
    rightColor = 'bg-blue-500' 
}) => {
  return (
    <div className="swipe-container rounded-3xl snap-x snap-mandatory overflow-hidden">
        {/* Right Action (Swiped Right to see this on left side? No, standard is Left=Action1, Right=Action2) */}
        {/* Actually, in snap-x container: 
            [ActionLeft] [Content] [ActionRight] 
            We usually start centered on Content.
        */}
        
        {onSwipeRight && (
            <div 
                className={`swipe-action ${rightColor} text-white font-bold text-xs cursor-pointer`} 
                onClick={onSwipeRight}
            >
                <div className="flex flex-col items-center gap-1">
                    <Icon name={rightIcon} size={20} />
                </div>
            </div>
        )}

        <div className="swipe-item w-full shrink-0">
            {children}
        </div>

        {onSwipeLeft && (
            <div 
                className={`swipe-action ${leftColor} text-white font-bold text-xs cursor-pointer`} 
                onClick={onSwipeLeft}
            >
                <div className="flex flex-col items-center gap-1">
                    <Icon name={leftIcon} size={20} />
                </div>
            </div>
        )}
    </div>
  );
};

export default SwipeableRow;
