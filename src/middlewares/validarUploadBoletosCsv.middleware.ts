import { NextFunction, Response } from 'express';
import { UploadRequest } from '@/modules/boletos/boletos.controller';
import NoFilesReceivedError from '@/errors/NoFilesReceived.error';
import InvalidFormat from '@/errors/InvalidFormat.error';
import fs from 'fs';
import csvParser from 'csv-parser';
import httpStatus from 'http-status';
import { Decimal } from '@prisma/client/runtime';
import InvalidDataError from '@/errors/InvalidDataError';
import ConflitError from '@/errors/Conflit.error';
import uploadBoletoSchema from '@/modules/boletos/schemas/uploadBoleto.schema';

export type DadoUploadBoleto = {
  nome: string;
  unidade: number;
  valor: Decimal;
  linha_digitavel: string;
};

export default async function validarUploadBoletosCsv(
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

  if (file.mimetype !== 'text/csv') {
    return res
      .status(httpStatus.UNSUPPORTED_MEDIA_TYPE)
      .send(InvalidFormat('O arquivo deve ser um CSV.'));
  }

  try {
    const expectedCsvHeader = ['nome', 'unidade', 'valor', 'linha_digitavel'];
    const csvHeader: string[] = [];
    const boletos: DadoUploadBoleto[] = [];
    const validateDataErrors: string[][] = [];
    const readable = fs.createReadStream(file.path);
    const htLinhaDigitavel: { [key: string]: boolean } = {};

    await new Promise<void>((resolve, reject) => {
      readable
        .pipe(csvParser({ separator: ',' }))
        .on('headers', (header) => {
          csvHeader.push(...header);
        })
        .on('data', (data) => {
          if (
            htLinhaDigitavel[data.linha_digitavel] &&
            data.linha_digitavel !== undefined
          ) {
            throw ConflitError(
              `A linha_digitavel ${data.linha_digitavel} está duplicada no documento`
            );
          }

          const { error } = uploadBoletoSchema.validate(data, {
            abortEarly: false,
          });

          if (error) {
            validateDataErrors.push(error.details.map((d) => d.message));
          }

          htLinhaDigitavel[data.linha_digitavel] = true;
          boletos.push({
            ...data,
            unidade: Number(data.unidade),
            valor: Number(data.valor),
          });
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    if (JSON.stringify(expectedCsvHeader) !== JSON.stringify(csvHeader)) {
      throw InvalidFormat(
        `O header esperado: ${expectedCsvHeader}. Não coincide com o header recebido: ${csvHeader}`
      );
    }

    if (validateDataErrors.length > 0) {
      throw InvalidDataError(validateDataErrors);
    }

    req.uploadedData = boletos;
  } catch (error) {
    fs.unlinkSync(req.file.path);

    if (error.name === 'InvalidFormat') {
      return res.status(httpStatus.UNPROCESSABLE_ENTITY).send(error);
    }

    if (error.name === 'ConflitError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }

    if (error.name === 'InvalidDataError') {
      return res.status(httpStatus.BAD_REQUEST).send(error);
    }

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send('Erro interno ao tentar validar o documento');
  }

  next();
}
