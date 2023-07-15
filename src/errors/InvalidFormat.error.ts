export default function InvalidFormatError(message?: string) {
  return {
    name: 'InvalidFormatError',
    message:
      message ||
      'Formato incompatível',
  };
}
