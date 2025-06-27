import React, { forwardRef } from "react";

interface ButtonProps {
  text: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ text, onClick, type, disabled }, ref) => {
    return (
      <button
        ref={ref}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
        onClick={onClick}
        type={type}
        disabled={disabled}
      >
        {text}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
