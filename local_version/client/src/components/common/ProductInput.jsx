import { useEffect, useRef, useState } from 'react';
import { PRODUCTS } from '../../constants/products';
import './ProductInput.css';

// A plain text field for `product` with a themed suggestion dropdown (like a <datalist>,
// but styled with our own CSS variables so it actually respects dark mode everywhere —
// native datalist popups don't reliably pick up `color-scheme` across browsers).
// Typing a value that isn't in PRODUCTS is still accepted; the list is just a shortcut.
export default function ProductInput({ label = 'Product', name, value, onChange, hint, required }) {
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

  const filtered = value
    ? PRODUCTS.filter((product) => product.toLowerCase().includes(value.toLowerCase()))
    : PRODUCTS;

  const selectProduct = (product) => {
    onChange({ target: { name, value: product } });
    setOpen(false);
  };

  return (
    <div className="form-field" ref={containerRef}>
      <label htmlFor={name}>{label}</label>
      <div className="product-input__control">
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
          <ul className="product-input__list" role="listbox">
            {filtered.map((product) => (
              <li
                key={product}
                role="option"
                aria-selected={product === value}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus on the input, don't fire blur
                  selectProduct(product);
                }}
              >
                {product}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <span className="form-field__hint">{hint}</span>}
    </div>
  );
}
