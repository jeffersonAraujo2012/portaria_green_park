export default function ConflitError(message?: string) {
  return {
    name: 'ConflitError',
    message: message || 'Conflito',
  };
}
