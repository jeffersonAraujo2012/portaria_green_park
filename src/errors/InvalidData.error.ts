export default function InvalidDataError(details: string[] | string[][]) {
  return {
    name: 'InvalidDataError',
    message: 'Dados inválidos e/ou incorretos',
    details,
  };
}
