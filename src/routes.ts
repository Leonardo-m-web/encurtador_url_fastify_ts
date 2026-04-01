import type {FastifyTypeInstance} from "./types.ts";
import {z} from 'zod'
import Hashids from 'hashids'
import { REPL_MODE_SLOPPY } from "node:repl";

//configura o hashID (tamanho de 6 caracteres e usando base 62) para os IDs das urls curtas
const hashids = new Hashids(process.env.HASHIDS_SALT || 'salt' , 6 , 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' )

//função das rotas
export async function routes(app: FastifyTypeInstance){

    //rota que recebe a URL grande e salva no bd, retornando a URL curta
    app.post('/encurtar' , {
        //schema de validação e serialização dos dados (usados na documentação tambem)
        schema:{
            tags:['url'],
            description:'Encurta uma URL',
            body: z.object({
                url: z.string('A URL deve ser uma string').regex(/^https?:\/\/[^\s$.?#].[^\s]*$/ , 'A URL deve ser válida')
            }),
            response : {
                201: z.object({
                    url: z.string()
                }).describe('URL encurtada com sucesso'),
                400: z.object({
                    message: z.string() 
                }).describe('Dados inválidos'),
                500: z.object({
                    message: z.string()
                }).describe('Erro interno do servidor')
            }
        }
    } , async (request , reply) =>{

        const {url} = request.body

        //forma o ID com o hashID usando a data atual
        const id = hashids.encode(Date.now())

        try{
            //salva no mongoDB (usando decorate do fastify) as URLs (curta como _id e a original) e a quantidade de clicks (default 0)
            const newUrl = new app.mongo({
                _id: id,
                url: url,
                quantidade_clicks: 0
            })
            await newUrl.save()

            //retorna a URL curta 
            return reply.status(201).send({url: `${request.protocol}://${request.hostname}:${request.port}/${id}`})

        }catch(err:any){
            return reply.status(500).send({message: 'Erro interno do servidor' + (Boolean(process.env.development) ? err.message : '')})
        }
    })

// ---------------------------- //

    //rota que recebe o id da URL curta, procura a URL original no banco de dados (primeiro verifica cache (redis) 
    //e depois busca o mongoDB) e redireciona para a URL original, além de incrementar a quantidade de clicks
    app.get('/:id' ,{
        //schema de validação e serialização dos dados (usados na documentação tambem)
        schema:{
            tags: ['url'] ,
            description: 'Redireciona para a URL original',
            params: z.object({
                id: z.string('O ID curto deve ser uma string').min(4, 'O ID curto deve ter pelo menos 4 caracteres')
            }),
            response:{
                302: z.describe('Redirecionamento bem-sucedido'),
                400: z.object({
                    message: z.string()
                }).describe('ID curto inválido'),
                404: z.object({
                    message: z.string()
                }).describe('ID curto não encontrado'),
                500: z.object({
                    message: z.string()
                }).describe('Erro interno do servidor')
            }
        }
    } , async (request, reply) =>{

        const {id} = request.params 

        try{
            //verifica se a URL original esta armazenada em cache
            let urlOriginal:string|null = await app.redis.get(id)

            //se não estiver no cache, busca no mongoDB e armazena no cache por 24 horas
            if(!urlOriginal){
                const result = await app.mongo.findById(id).select('url') //busca no mongoDB (so a URL)
                urlOriginal = result?.url
                
                if(!urlOriginal){
                    return reply.status(404).send({message: 'ID não encontrado'})
                }

                await app.redis.set(id, urlOriginal , {EX: 60 * 60 * 24 }) //armazena em cache (redis) pro 24h
            }

            //atualiza a quantidade de clicks
            await app.mongo.updateOne({_id: id} , {$inc: {quantidade_clicks: 1}})
            
            //redireciona pra url original
            return reply.redirect(urlOriginal, 302)
        }catch(err:any){
            return reply.status(500).send({message: 'Erro interno do servidor ' + (Boolean(process.env.development) ? err.message : '')})
        }
    })

// ---------------------------- //

    //rota que recebe o id da URL curta e retorna a quantidade de clicks que aquela URL teve
    app.get('/clicks/:id' , {
        //schema de validação e serialização dos dados (usados na documentação tambem)
        schema:{
            tags: ['url' , 'stats'] ,
            description: 'Retrona a quantidade de clicks de uma URL encurtada a partir do seu ID' ,
            params: z.object({
                id: z.string('O ID curto deve ser uma string').min(4, 'O ID curto deve ter pelo menos 4 caracteres')
            }),
            response:{
                200: z.object({
                    message: z.string(),
                    clicks: z.number()
                }).describe('Quantidade de clicks retornada com sucesso'),
                400: z.object({
                    message: z.string()
                }).describe('ID curto inválido'),
                404: z.object({
                    message: z.string()
                }).describe('ID curto não encontrado'),
                500: z.object({
                    message: z.string()
                }).describe('Erro interno do servidor')
            }
        }
    } , async (request , reply) =>{

        const {id} = request.params

        try{
            const result = await app.mongo.findById(id).select('quantidade_clicks') //busca no mongoDB (so a quantidade de clicks)

            //verifica se existe
            if(!result){
                return reply.status(404).send({message: 'ID não encontrado'})
            }
            
            const clicks:number = result?.quantidade_clicks
            
            return reply.status(200).send({message: 'Quantidade de clicks retornada com sucesso' , clicks: clicks})
        }catch(err:any){
            reply.status(500).send({message: 'Erro interno do servidor ' + (Boolean(process.env.development) ? err.message : '')})
        }
    })
}