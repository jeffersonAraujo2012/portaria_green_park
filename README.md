
# Portaria Condomínio Green Park

Em um condomínio de casas do brasil, denominado Condomínio Green Park, são utilizados 2 aplicativos, sendo um para o controle de acesso da portaria e o outro para o gerenciamento das taxas condominiais do financeiro. Após um tempo, o síndico percebeu que as pessoas estavam utilizando mais o aplicativo da Portaria que o aplicativo do Financeiro, por isso ele decidiu que iria exportar os boletos do financeiro e importar no aplicativo da Portaria.

Esse sistema realiza o trabalho de importação em .csv e .pdf dos boletos do sistema financeiro para este.

## Tecnologias

- **NodeJS**
- **Express JS**
- **Prisma ORM**
- **PostgreSQL**
- **Jest**
- **Docker e docker compose**
- **Wait-for-it**



## Estrutura do Projeto
Este projeto buscou, na medida do possível, utilizar uma estrutura em módulos e arquitetura em camadas. Onde cada módulo possui seu próprio:

- **Router:** Para declaração de rotas.
- **Controller:** Para controle de requisições e resposta.
- **Service:** Para regras de negócio e processamento antes da camada final.
- **Repository:** Camada final com finalidade de se comunicar com o banco de dados via um ORM, que neste projeto é o Prisma.

#### A estrutura de básica de pastas ficou da seguinte forma:

Root <br>
├── files <br>
│   └── boletos-salvos<br>
├── prisma<br>
│   ├── migrations<br>
│   ├── schema.prisma<br>
│   └── seed.ts<br>
├── src<br>
│   ├── configs<br>
│   ├── errors<br>
│   ├── middlewares<br>
│   ├── modules<br>
│   │   ├── lotes<br>
│   │   └── tickets<br>
│   │       ├── schemas<br>
│   │       └── tests<br>
│   ├── utils<br>
│   ├── server.ts<br>
│   └── app.ts<br>
├── tmp<br>
├── tsconfig.json<br>
├── jest.config.js<br>
├── package.json<br>
├── package-lock.json<br>
├── docker-compose.yml<br>
├── dockerfile<br>
├── .env.example<br>
├── .env.test<br>
└── wait-for-it.sh<br>

## Variáveis de Ambiente

Observe o arquivo .env.example e crie um .env com dados corretos. Você também precisará ajustar o .env.test se quiser utilizar os testes automatizados.


## Iniciando localmente

### Sem Docker
Se for subir esse projeto sem Docker precisará ter instalado em seu ambiente o **PostgreSQL** e o **Node** na versão 18.15. Lembre-se ainda de ajustar o arquivo .env após a instalação.

#### Procedimentos
Clone o projeto

```bash
  git clone https://github.com/jeffersonAraujo2012/portaria_green_park.git
```

Va para a pasta raiz do projeto

```bash
  cd portaria_green_park
```

Instale as dependências

```bash
  npm install
```

Execute os comandos de configuração do banco de dados

```bash
  npx prisma migrate dev
  npm run seed
```

Inicia o servidor

```bash
  npm run dev
```

### Com Dokcer e Docker Compose
Se tiver o Docker e Docker Compose instalados em sua máquina o procedimento de inicialização é mais simples e não há a necessidade de instalar nada além disso.

#### Procedimentos
Clone o projeto

```bash
  git clone https://github.com/jeffersonAraujo2012/portaria_green_park.git
```

Va para a pasta raiz do projeto

```bash
  cd portaria_green_park
```

Suba os container com o Docker Compose

```bash
  sudo docker compose up -d
```

A partir de aqui haverão dois containeres em execução em sua máquina:

- App
- Postgres

A porta padrão de conexão com container app é 5000. A do postgres é 5433. Se precisar altere no arquivo docker-compose.yml


## Documentação da API

#### Obter boletos

```
  GET /boletos?nome=${nome}&valor_inicial=${valor_inicial}&valor_final=${valor_final}&id_lote=${id_lote}&relatorio=&{relatorio}
```

| Query String | Tipo     | Descrição                |
| :-------- | :------- | :------------------------- |
| `nome` | `string` | **Opicional** Nome ou início do nome do sacado |
| `valor_incial` | `number` | **Opicional** Filtro para buscar todos os boletos a partir deste valor |
| `valor_final` | `number` | **Opicional** Filtro para buscar todos os boletos até este valor |
| `id_lote` | `number` | **Opicional** Filtro para buscar todos os boletos do lote indentificado |
| `relatorio` | `1` | **Opicional** Faz com que seja gerado um relatório em pdf com os filtros especificados. **Deve ser estritamente 1 ou não deve ser enviado.** |

##### **Casos possíveis:**
- Caso alguma query string possua um valor inválido o sistema irá retorna uma resposta com status 400 BAD REQUEST.
- Caso a chamada esteja correta e não possua a query string `relatorio` a aplicação irá retornar um JSON com um array que contém os boletos solicitados.
- Caso a chama esteja correta e possua a query string `relatorio` a aplicação irá retornar um JSON contendo um base64 do pdf com os boletos solicitados.

#### Importar boletos para base de dados

```
  POST /boletos/importar/csv
```

| Paramêtro | Tipo     | Descrição                       |
| :-------- | :------- | :-------------------------------- |
| `csvFile`      | `file .csv` | **Obrigatório**. Arquivo contendo os dados a ser importados |

O arquivo **deve** possuir a extensão csv e estar no seguinte formato:

| nome | unidade | valor | linha_digitavel |
| :-------- | :------- | :------- |  :------- |
| `STRING` | `NUMBER` | `NUMBER` | `STRING`

##### **Casos possíveis:**
- Caso não seja enviado um arquivo o sistema irá retornar com erro 422 UNPROCESSABLE ENTITY.
- Caso a extensão seja diferente de um CSV irá retornar com erro 415 UNSUPPORTED MEDIA TYPE.
- Caso seja enviado um csv com formato incompativel irá retornar 422 UNPROCESSABLE ENTITY.
- Caso o arquivo enviado tenha o formato correto, porém os dados estejam fora de padrão o sistema irá retornar com erro 400 BAD REQUEST.
- Caso haja duas linhas digitáveis iguais ou tais linhas já estejam cadastradas o sistema irá retornar com erro 409 CONFLICT.
- Se algum boleto estiver atrelado a lote inexistente na base de dados o sistema retornará erro 404 NOT FOUND.
- Se tudo estiver correto o sistema retornará código 201 CREATED.

#### Importar arquivos PDF dos boletos

```
  POST /boletos/importar/pdf
```

| Paramêtro | Tipo     | Descrição                       |
| :-------- | :------- | :-------------------------------- |
| `pdfFile`      | `file .pdf` | **Obrigatório**. Arquivo contendo os boletos a ser importados |


## Testes automatizados

Para executar os testes automatizados você terá que configurar seu .env.test. Faça isso de preferência com um banco de dados diferente, pois os testes manipulam o banco enquanto são executados.

Os procedimentos também variam se você está com docker ou não.

### Sem Docker
Rode os comandos de configuração inicial do banco de testes.

```bash
  npm run test:migrate
  npm run test:seed
```

Execute os testes
```bash
  npm run test
```

Vocẽ possivelmente verá uns warnings de uma das bibliotecas da aplicação. Porém nada a se preocupar.

### Com Docker
Com Docker você precisirá acessar o container da aplicação.

```bash
  sudo exec -it app bash
```

Rode os comandos de configuração inicial do banco de testes.

```bash
  npm run test:migrate
  npm run test:seed
```

Execute os testes
```bash
  npm run test
```

Vocẽ possivelmente verá uns warnings de uma das bibliotecas da aplicação. Porém nada a se preocupar.
