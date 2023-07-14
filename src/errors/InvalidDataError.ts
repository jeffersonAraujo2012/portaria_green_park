export default function InvalidDataError(details: string[]) {
  return {
    name: 'InvalidDataError',
    message: 'Dados inválidos e/ou incorretos',
    details,
  };
}
