export default function DuplicatedValueError(message?: string) {
  return {
    name: 'DuplicatedValueError',
    message: message || 'Valor duplicado.',
  };
}
