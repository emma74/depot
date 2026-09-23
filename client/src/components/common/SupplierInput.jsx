import { useEffect, useRef, useState } from 'react';
import './SupplierInput.css';

// A plain text field for a purchase order's supplier, with a themed suggestion dropdown —
// same pattern as ProductInput. Typing a name that doesn't match an existing supplier is
// still accepted; the caller (PurchaseOrderFormPage) resolves it against `suppliers` at
// submit time and sends either the matched id or the new name for the server to create.
export default function SupplierInput({ label = 'Supplier', name, value, onChange, suppliers, hint, required }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const names = (suppliers || []).map((s) => s.name);
  const filtered = value
    ? names.filter((n) => n.toLowerCase().includes(value.toLowerCase()))
    : names;

  const selectSupplier = (supplierName) => {
    onChange({ target: { name, value: supplierName } });
    setOpen(false);
  };

  return (
    <div className="form-field" ref={containerRef}>
      <label htmlFor={name}>{label}</label>
      <div className="supplier-input__control">
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          required={required}
        />
        {open && filtered.length > 0 && (
          <ul className="supplier-input__list" role="listbox">
            {filtered.map((n) => (
              <li
                key={n}
                role="option"
                aria-selected={n === value}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus on the input, don't fire blur
                  selectSupplier(n);
                }}
              >
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <span className="form-field__hint">{hint}</span>}
    </div>
  );
}
