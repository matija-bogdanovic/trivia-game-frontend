"use client";

import Image from "next/image";
import React, { useRef, useState } from "react";

interface InputTypes {
  type: string;
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className: string;
  id?: string;
  checked?: boolean;
  name?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const Input: React.FC<InputTypes> = ({
  type,
  value,
  onChange,
  id,
  placeholder,
  checked,
  maxLength,
  name,
  disabled,
  className,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onFocus = () => {
    if (boxRef.current) {
      boxRef.current.style.borderColor = "black";
    }
  };

  const onBlur = () => {
    if (boxRef.current) {
      boxRef.current.style.borderColor = "gray";
    }
  };

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div ref={boxRef} className="relative flex items-center">
      <div className="flex flex-col gap-2">
        {maxLength && (
          <span>
            {value.length}/{maxLength}
          </span>
        )}
        <input
          id={id}
          onFocus={onFocus}
          onBlur={onBlur}
          type={inputType}
          value={value}
          onChange={onChange}
          name={name}
          checked={checked}
          autoComplete="current-password"
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
          disabled={disabled}
        />
      </div>
      {type === "password" && (
        <Image
          onClick={() => setShowPassword(!showPassword)}
          src={showPassword ? "hide_password.svg" : "see_password.svg"}
          width={20}
          height={20}
          alt={"toggle password"}
          className="absolute right-2 cursor-pointer"
        />
      )}
    </div>
  );
};

export default Input;
