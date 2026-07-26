'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';

interface InputTypes {
  type: string;
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className: string;
  id?: string;
  checked?: boolean;
  name?: string;
  disabled?: boolean;
  maxLength?: number;
  maxLengthAllowed?: boolean;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Input: React.FC<InputTypes> = ({
  type,
  value,
  onChange,
  onKeyDown,
  onPaste,
  onInput,
  id,
  placeholder,
  checked,
  maxLength,
  maxLengthAllowed,
  name,
  disabled,
  autoFocus,
  inputMode,
  pattern,
  inputRef,
  className,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onFocus = () => {
    if (boxRef.current) {
      boxRef.current.style.borderColor = 'black';
    }
  };

  const onBlur = () => {
    if (boxRef.current) {
      boxRef.current.style.borderColor = 'gray';
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div ref={boxRef} className="relative flex items-center">
      <div className="flex flex-col gap-2">
        {maxLengthAllowed && (
          <span>
            {value.length}/{maxLength}
          </span>
        )}
        <input
          id={id}
          ref={inputRef}
          onFocus={onFocus}
          onBlur={onBlur}
          type={inputType}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onInput={onInput}
          name={name}
          checked={checked}
          autoComplete="current-password"
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode={inputMode}
          pattern={pattern}
        />
      </div>
      {type === 'password' && (
        <Image
          onClick={() => setShowPassword(!showPassword)}
          src={showPassword ? 'hide_password.svg' : 'see_password.svg'}
          width={20}
          height={20}
          alt={'toggle password'}
          className="absolute right-2 cursor-pointer"
        />
      )}
    </div>
  );
};

export default Input;
