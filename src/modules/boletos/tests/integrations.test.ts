import app from '@/app';
import prisma from '@/configs/database';
import supertest from 'supertest';
import factoryBoletos from './factories/boletos.factory';
import factoryRelatorio, {
  dataFromRelarioBase64,
} from './factories/relatorios.factory';

const server = supertest(app);

beforeEach(async () => {
  await prisma.boletos.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /boletos', () => {
  it('Ao realizar a chamada sem queries deve receber todos os boletos', async () => {
    const boletos = await factoryBoletos();
    const resultado = await server.get('/boletos');

    expect(resultado.status).toBe(200);
    expect(resultado.body.length).toBe(boletos.length);
    expect(resultado.body).toEqual(expect.arrayContaining(boletos));
  });

  it('GET /boletos?valor_inicial deve receber apenas os boletos correspondentes', async () => {
    await factoryBoletos({ valor: 50.0 });
    await factoryBoletos({ valor: 100.0 });
    await factoryBoletos({ valor: 150.0 });

    const boletosEsperados = await factoryBoletos({ valor: 200.0 });
    const resultado = await server.get('/boletos?valor_inicial=200');

    expect(resultado.status).toBe(200);
    expect(resultado.body.length).toBe(boletosEsperados.length);
    expect(resultado.body).toEqual(expect.arrayContaining(boletosEsperados));
  });

  it('GET /boletos?valor_final deve receber apenas os boletos correspondentes', async () => {
    const b1 = await factoryBoletos({ valor: 50.0 });
    const b2 = await factoryBoletos({ valor: 100.0 });
    await factoryBoletos({ valor: 150.0 });
    await factoryBoletos({ valor: 200.0 });

    const boletosEsperados = [...b1, ...b2];
    const resultado = await server.get('/boletos?valor_final=100');

    expect(resultado.status).toBe(200);
    expect(resultado.body.length).toBe(boletosEsperados.length);
    expect(resultado.body).toEqual(expect.arrayContaining(boletosEsperados));
  });

  it('GET /boletos?valor_inicial=&valor_final deve receber apenas os boletos correspondentes', async () => {
    await factoryBoletos({ valor: 50.0 });
    const b1 = await factoryBoletos({ valor: 100.0 });
    const b2 = await factoryBoletos({ valor: 150.0 });
    await factoryBoletos({ valor: 200.0 });

    const boletosEsperados = [...b1, ...b2];
    const resultado = await server.get(
      '/boletos?valor_inicial=100&valor_final=150'
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.length).toBe(boletosEsperados.length);
    expect(resultado.body).toEqual(expect.arrayContaining(boletosEsperados));
  });

  it('GET /boletos?nome deve receber apenas os boletos correspondentes', async () => {
    const [boletoEsperado] = await factoryBoletos();

    const boletosEsperados = [boletoEsperado];
    const resultado = await server.get(
      `/boletos?nome=${boletoEsperado.nome_sacado}`
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.length).toBe(boletosEsperados.length);
    expect(resultado.body).toEqual(expect.arrayContaining(boletosEsperados));
  });

  it('GET /boletos?id_lote deve receber apenas os boletos correspondentes', async () => {
    const lote = await prisma.lotes.findFirst();
    const [b1] = (await factoryBoletos()).filter(
      (boleto) => boleto.id_lote === lote.id
    );
    const [b2] = (await factoryBoletos()).filter(
      (boleto) => boleto.id_lote === lote.id
    );

    const boletosEsperados = [b1, b2];
    const resultado = await server.get(`/boletos?id_lote=${lote.id}`);

    expect(resultado.status).toBe(200);
    expect(resultado.body.length).toBe(boletosEsperados.length);
    expect(resultado.body).toEqual(expect.arrayContaining(boletosEsperados));
  });

  describe('Quando for solicitado relatorio', () => {
    it('Sem nenhuma query string de filtro, deve retornar o relatorio correto', async () => {
      const boletos: any[] = await factoryBoletos({
        naoFormatarResultado: true,
      });

      const relatorioBase64 = await factoryRelatorio(boletos);
      const relatorioData = await dataFromRelarioBase64(relatorioBase64.base64);

      const resultadoBase64 = await server.get('/boletos?relatorio=1');
      const resultadoData = await dataFromRelarioBase64(
        resultadoBase64.body.base64
      );

      expect(resultadoData).toEqual(relatorioData);
    });

    it('GET /boletos?valor_inicial=&relatorio=1 deve receber o relatorio correto', async () => {
      await factoryBoletos({ valor: 50.0 });
      await factoryBoletos({ valor: 100.0 });
      await factoryBoletos({ valor: 150.0 });

      const boletos: any[] = await factoryBoletos({
        valor: 200.0,
        naoFormatarResultado: true,
      });

      const relatorioBase64 = await factoryRelatorio(boletos);
      const relatorioData = await dataFromRelarioBase64(relatorioBase64.base64);

      const resultadoBase64 = await server.get(
        '/boletos?valor_inicial=200&relatorio=1'
      );
      const resultadoData = await dataFromRelarioBase64(
        resultadoBase64.body.base64
      );

      expect(resultadoData).toEqual(relatorioData);
    });

    it('GET /boletos?valor_final=&relatorio=1 deve receber o relatorio correto', async () => {
      const b1 = await factoryBoletos({
        valor: 50.0,
        naoFormatarResultado: true,
      });
      const b2 = await factoryBoletos({
        valor: 100.0,
        naoFormatarResultado: true,
      });
      await factoryBoletos({ valor: 150.0 });
      await factoryBoletos({ valor: 200.0 });

      const boletos: any[] = [...b1, ...b2];
      const relatorioBase64 = await factoryRelatorio(boletos);
      const relatorioData = await dataFromRelarioBase64(relatorioBase64.base64);

      const resultadoBase64 = await server.get(
        '/boletos?valor_final=100&relatorio=1'
      );
      const resultadoData = await dataFromRelarioBase64(
        resultadoBase64.body.base64
      );

      expect(resultadoData).toEqual(relatorioData);
    });

    it('GET /boletos?valor_inicial=&valor_final=&relatorio=1 deve receber o relatorio correto', async () => {
      await factoryBoletos({ valor: 50.0 });
      const b1 = await factoryBoletos({
        valor: 100.0,
        naoFormatarResultado: true,
      });
      const b2 = await factoryBoletos({
        valor: 150.0,
        naoFormatarResultado: true,
      });
      await factoryBoletos({ valor: 200.0 });

      const boletos: any[] = [...b1, ...b2];
      const relatorioBase64 = await factoryRelatorio(boletos);
      const relatorioData = await dataFromRelarioBase64(relatorioBase64.base64);

      const resultadoBase64 = await server.get(
        '/boletos?valor_inicial=100&valor_final=150&relatorio=1'
      );
      const resultadoData = await dataFromRelarioBase64(
        resultadoBase64.body.base64
      );

      expect(resultadoData).toEqual(relatorioData);
    });

    it('GET /boletos?nome=&relatorio=1 deve receber o relatorio correto', async () => {
      const [boletoEsperado] = await factoryBoletos({
        naoFormatarResultado: true,
      });
      const boletosEsperados = [boletoEsperado];

      const relatorioBase64 = await factoryRelatorio(boletosEsperados);
      const relatorioData = await dataFromRelarioBase64(relatorioBase64.base64);

      const resultadoBase64 = await server.get(
        `/boletos?nome=${boletoEsperado.nome_sacado}&relatorio=1`
      );
      const resultadoData = await dataFromRelarioBase64(
        resultadoBase64.body.base64
      );

      expect(resultadoData).toEqual(relatorioData);
    });

    it('GET /boletos?id_lote=&relatorio=1 deve receber o relatorio correto', async () => {
      const lote = await prisma.lotes.findFirst();

      const [b1] = (await factoryBoletos({naoFormatarResultado: true})).filter(
        (boleto) => boleto.id_lote === lote.id
      );
      const [b2] = (await factoryBoletos({naoFormatarResultado: true})).filter(
        (boleto) => boleto.id_lote === lote.id
      );

      const boletosEsperados = [b1, b2];

      const relatorioBase64 = await factoryRelatorio(boletosEsperados);
      const relatorioData = await dataFromRelarioBase64(relatorioBase64.base64);

      const resultadoBase64 = await server.get(
        `/boletos?id_lote=${lote.id}&relatorio=1`
      );
      const resultadoData = await dataFromRelarioBase64(
        resultadoBase64.body.base64
      );

      expect(resultadoData).toEqual(relatorioData);
    });
  });

  describe('Recebe status 400 com valores de queries incorretos', () => {
    it('Ao enviar um id_lote negativo na query', async () => {
      const resultado = await server.get('/boletos?id_lote=-1');
      expect(resultado.status).toBe(400);
    });
    it('Ao enviar um id_lote igual a 0', async () => {
      const resultado = await server.get('/boletos?id_lote=0');
      expect(resultado.status).toBe(400);
    });
    it('Ao enviar um id_lote vazio ou diferente de um numero', async () => {
      const resultado1 = await server.get('/boletos?id_lote=');
      const resultado2 = await server.get('/boletos?id_lote=STRING');
      expect(resultado1.status).toBe(400);
      expect(resultado2.status).toBe(400);
    });

    it('Ao enviar um valor_inicial negativo na query', async () => {
      const resultado = await server.get('/boletos?valor_inicial=-1');
      expect(resultado.status).toBe(400);
    });
    it('Ao enviar um valor_inicial vazio ou diferente de um numero', async () => {
      const resultado1 = await server.get('/boletos?valor_inicial=');
      const resultado2 = await server.get('/boletos?valor_inicial=STRING');
      expect(resultado1.status).toBe(400);
      expect(resultado2.status).toBe(400);
    });

    it('Ao enviar um valor_final negativo na query', async () => {
      const resultado = await server.get('/boletos?valor_final=-1');
      expect(resultado.status).toBe(400);
    });
    it('Ao enviar um valor_final vazio ou diferente de um numero', async () => {
      const resultado1 = await server.get('/boletos?valor_final=');
      const resultado2 = await server.get('/boletos?valor_final=STRING');
      expect(resultado1.status).toBe(400);
      expect(resultado2.status).toBe(400);
    });

    it('Ao enviar um valor_final menor que valor_inicial', async () => {
      const resultado = await server.get(
        '/boletos?valor_inicial=200&valor_final=50'
      );
      expect(resultado.status).toBe(400);
    });
    it('Ao enviar um relatiorio diferente de 1', async () => {
      const resultado = await server.get('/boletos?relatorio=');
      expect(resultado.status).toBe(400);
    });
  });
});
