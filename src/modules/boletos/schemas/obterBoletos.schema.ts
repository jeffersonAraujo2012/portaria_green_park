import Joi from 'joi';

export type ObterBoletosProps = {
  nome?: string;
  valor_inicial?: number;
  valor_final?: number;
  id_lote?: number;
  relatorio?: 1;
};

const obterBoletoSchema = Joi.object<ObterBoletosProps>({
  nome: Joi.string(),
  valor_inicial: Joi.number().min(0),
  valor_final: Joi.number().min(Joi.ref('valor_inicial')),
  id_lote: Joi.number().integer().min(1),
  relatorio: Joi.number().valid(1),
});

export default obterBoletoSchema;
