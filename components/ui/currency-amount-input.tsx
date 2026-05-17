'use client';

import { useState } from 'react';
import { Input } from './input';

// JPY uses plain integer input without grouping separators (per product requirement)
const NO_GROUP = new Set(['JPY']);

function applyGrouping(digits: string): string {
  if (!digits) return '';
  return new Intl.NumberFormat('en-US').format(parseInt(digits, 10));
}

interface Props {
  currency: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function CurrencyAmountInput({ currency, name, required, disabled, placeholder }: Props) {
  const [display, setDisplay] = useState('');
  const [raw, setRaw] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    setRaw(digits);
    setDisplay(NO_GROUP.has(currency) ? digits : applyGrouping(digits));
  }

  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <Input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
      />
    </>
  );
}
