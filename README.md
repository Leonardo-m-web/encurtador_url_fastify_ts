# ENCURTADOR DE URL

## PROJETO

Esse projeto é um código backend de um encurtador de url. Com ele é possivel :

  - Enviar uma URL grande e receber em troca uma URL pequena
  - Ao clicar na URL pequena o usuário será redirecionado para a URL original
  - Observar a quantidade de clicks de uma URL pequena

> Para acessar a documentação das rotas basta instalar as dependencias, iniciar o servidor e acessar a rota /docs

## ESPECIFICAÇÕES 

Esse projeto usa :
 - NODE.js como motor
 - Typescript como linguagem
 - Fastify como framework
 - Zod para validação e serialização dos dados
 - MongoDB como banco de dados principal (mongoose como biblioteca)
 - Redis como cache
 - Swagger para a documentação

Variáveis de ambiente :
 - development= //true para desenvolvimento e false pra produção
 - PORT= //porta do servidor
 - MONGO_URL= //url do mongoDB
 - REDIS_URL= //url do redis
 - HASHIDS_SALT= //salt do hashId (usado pra fazer o id das urls curtas)

