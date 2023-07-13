export default function NotFoundError(message?: string) {
  return {
    name: 'NotFoundError',
    message: message || 'Não encontrado',
  };
}
