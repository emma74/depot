// An error that maps straight to an HTTP response. Thrown from inside transactions so a
// failed validation rolls the whole edit back and still reaches the client as a 4xx.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function sendError(res, err) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  // Prisma unique-constraint violation (e.g. orderNumber / invoiceNumber already taken)
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'That number is already used by another record' });
  }
  return res.status(500).json({ error: err.message });
}
