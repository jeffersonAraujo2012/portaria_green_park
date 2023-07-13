export default function NoFilesReceivedError(message?: string) {
  return {
    name: 'NoFilesReceivedError',
    message: message || 'Nenhum Arquivo foi recebido, verifique se você os importou corretamente.',
  }
}