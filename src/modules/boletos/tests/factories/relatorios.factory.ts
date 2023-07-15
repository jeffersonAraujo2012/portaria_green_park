import { boletos } from "@prisma/client";
import boletosService from "../../boletos.service";
import * as pdfjs from 'pdfjs-dist';

export default async function factoryRelatorio(boletos: boletos[]) {
  const pdfDoc = boletosService.generatePDFBoletos(boletos);
  const base64 = await boletosService.generateBase64PDF(pdfDoc);
  return {
    base64
  }
}

export async function dataFromRelarioBase64(base64: string) {
  const buffer = Buffer.from(base64, 'base64');
  const data = new Uint8Array(buffer);
  const pdf = await pdfjs.getDocument(data).promise;

  const pdfData = [];
  const numPages = pdf.numPages;
  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageContent: any = {};

    let aux = 0;
    content.items.forEach((item, index) => {
      const line = item as { str: string };
      if (line.str === '') {
        aux++;
        return;
      }
      pageContent[index - aux] = line.str;
    });

    pdfData.push(pageContent);
  }

  return pdfData;
}