import type {FastifyTypeInstance} from "./types.ts";
import {z} from 'zod'

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

    })

    app.get('/:shortId' ,{
        schema:{
            tags: ['url'] ,
            description: 'Redireciona para a URL original',
            params: z.object({
                shortId: z.string('O ID curto deve ser uma string').min(4, 'O ID curto deve ter pelo menos 4 caracteres')
            }),
            response:{
                301: z.describe('Redirecionamento bem-sucedido'),
                400: z.object({
                    message: z.string()
                }).describe('ID curto inválido'),
                500: z.object({
                    message: z.string()
                }).describe('Erro interno do servidor')
            }
        }
    } , async (request, reply) =>{
        
    })
}