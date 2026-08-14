import React, { forwardRef } from 'react';

interface ButtonProps {
  text: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  version?: 'primary' | 'secondary';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ text, onClick, type, disabled, version }, ref) => {
    return (
      <button
        ref={ref}
        className={`${version === 'primary' ? 'bg-gold px-8 py-4 text-sm font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none sm:px-10' : 'cursor-pointer border border-white/20 px-4 py-2 text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none'}`}
        onClick={onClick}
        type={type}
        disabled={disabled}
      >
        {text}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
