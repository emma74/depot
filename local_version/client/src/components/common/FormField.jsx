import './FormField.css';

// Generic labeled form control. Pass `as="select"` or `as="textarea"` to change the element;
// everything else (type, value, onChange, ...) passes through to the underlying input.
export default function FormField({ label, name, as = 'input', children, error, hint, ...props }) {
  const Element = as;
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <Element id={name} name={name} {...props}>
        {children}
      </Element>
      {hint && !error && <span className="form-field__hint">{hint}</span>}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}
