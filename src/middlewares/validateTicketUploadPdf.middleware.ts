import { NextFunction, Response } from 'express';
import { UploadRequest } from '@/modules/tickets/tickets.controller';
import NoFilesReceivedError from '@/errors/NoFilesReceived.error';
import InvalidFormatError from '@/errors/InvalidFormat.error';
import fs from 'fs';
import httpStatus from 'http-status';
import * as pdfjs from 'pdfjs-dist';

export default async function validateTicketUploadPdf(
  req: UploadRequest,
  res: Response,
  next: NextFunction
) {
  const file = req.file;

  if (!file) {
    return res
      .status(httpStatus.UNPROCESSABLE_ENTITY)
      .send(NoFilesReceivedError());
  }

  if (file.mimetype !== 'application/pdf') {
    return res
      .status(httpStatus.UNSUPPORTED_MEDIA_TYPE)
      .send(InvalidFormatError('O arquivo deve ser um PDF.'));
  }

  const pdfData = [];
  const data = new Uint8Array(fs.readFileSync(file.path));
  const pdf = await pdfjs.getDocument(data).promise;

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

  req.uploadedData = pdfData;

  next();
}
