import type {FastifyTypeInstance} from "./types.ts";
import {z} from 'zod'
import Hashids from 'hashids'


const hashids = new Hashids(process.env.HASHIDS_SALT || 'salt' , 6 , 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' )

export async function routes(app: FastifyTypeInstance){

    app.post('/encurtar' , {
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

        const id = hashids.encode(Date.now())

        try{
            const newUrl = new app.mongo({
                _id: id,
                url: url,
                quantidade_clicks: 0
            })

            await newUrl.save()

            return reply.status(201).send({url: `${request.protocol}://${request.hostname}:${request.port}/${id}`})

        }catch(err:any){
            return reply.status(500).send({message: 'Erro interno do servidor' + err.message})
        }
    })

    app.get('/:id' ,{
        schema:{
            tags: ['url'] ,
            description: 'Redireciona para a URL original',
            params: z.object({
                id: z.string('O ID curto deve ser uma string').min(4, 'O ID curto deve ter pelo menos 4 caracteres')
            }),
            response:{
                301: z.describe('Redirecionamento bem-sucedido'),
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

            let urlOriginal:string|null = await app.redis.get(id)

            if(!urlOriginal){
                const result = await app.mongo.findById(id).select('url')
                urlOriginal = result?.url
                
                if(!urlOriginal){
                    return reply.status(404).send({message: 'ID não encontrado'})
                }

                await app.redis.set(id, urlOriginal , {EX: 60 * 60 * 24 })
            }

            await app.mongo.updateOne({_id: id} , {$inc: {quantidade_clicks: 1}})
                
            return reply.redirect(urlOriginal, 301)
        }catch(err:any){
            return reply.status(500).send({message: 'Erro interno do servidor ' + err.message})
        }
    })
}