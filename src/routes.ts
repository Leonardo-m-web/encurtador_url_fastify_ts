import type {FastifyTypeInstance} from "./types.js";
import {z} from 'zod'
import {getClicks, getURL, shortURL} from "./services.js";

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

        try{
            const id:string|null = await shortURL(app, url) //função que retorna o id da url curta

            //retorna a URL curta 
            return reply.status(201).send({url: `${request.protocol}://${request.host}/${id}`})

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
            let urlOriginal:string|null = await getURL(app , id) //função que procura a URL original no bd

            if(!urlOriginal) return reply.status(404).send({message: 'ID não encontrado'})

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
            const result = await getClicks(app, id) //função que retorna a quantidade de cliks

            //verifica se existe
            if(!result.quantidade_clicks){
                return reply.status(404).send({message: 'ID não encontrado'})
            }
            
            return reply.status(200).send({message: 'Quantidade de clicks retornada com sucesso' , clicks: result.quantidade_clicks})
        }catch(err:any){
            reply.status(500).send({message: 'Erro interno do servidor ' + (Boolean(process.env.development) ? err.message : '')})
        }
    })
}