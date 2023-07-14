import fs from 'fs';

export async function deleteTmpFile(filePath: string) {
  let response;

  try {
    fs.unlinkSync(filePath);
    response = 'Arquivo temporário deletado.';
  } catch (error) {
    response = 'Arquivo temporário NÃO deletado.';
  }

  return response;
}
