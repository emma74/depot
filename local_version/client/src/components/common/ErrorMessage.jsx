import './ErrorMessage.css';

export default function ErrorMessage({ message }) {
  return (
    <div className="error-message" role="alert">
      {message || 'Something went wrong.'}
    </div>
  );
}
