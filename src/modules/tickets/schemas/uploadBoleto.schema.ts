import Joi from 'joi';

export type UploadBoletoProps = {
  nome: string;
  unidade: number;
  valor: number;
  linha_digitavel: string;
};

const uploadBoletoSchema = Joi.object<UploadBoletoProps>({
  nome: Joi.string().required(),
  unidade: Joi.number().min(0).required(),
  valor: Joi.number().min(0).required(),
  linha_digitavel: Joi.string().required(),
});

export default uploadBoletoSchema;
