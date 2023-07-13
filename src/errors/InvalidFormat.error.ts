export default function InvalidFormat(message?: string) {
  return {
    name: 'InvalidFormat',
    message:
      message ||
      'Formato incompatível',
  };
}
