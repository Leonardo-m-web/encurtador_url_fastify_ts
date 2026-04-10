import {fastify} from 'fastify'
import { serializerCompiler , validatorCompiler , ZodTypeProvider , jsonSchemaTransform } from 'fastify-type-provider-zod'
import {fastifyCors} from '@fastify/cors'
import {fastifySwagger} from '@fastify/swagger'
import {fastifySwaggerUi} from '@fastify/swagger-ui'
import {routes} from './routes.js'
import {mongodb , redisdb} from './db/bd.js'

//inicia uma instancia do fastify e permite que o zod seja usado para a validação e serialização dos dados
export const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

//configura o CORS
app.register(fastifyCors , {
    origin: '*',
    methods: ['GET' , 'POST']
})

//configura o swagger pra documentação
app.register(fastifySwagger , {
    openapi:{
        info:{
            title:'Encurtador de URL API',
            description:'API para encurtar URLs',
            version:'1.0.0'
        }
    },
    transform: jsonSchemaTransform
})

//configura a rota do swagger
app.register(fastifySwaggerUi ,{
    routePrefix: '/docs',
})

try{
    //registra o plugin que inicializa a conexão com o mongoDB
    app.register(mongodb)
    //registra o plugin que inicializa a conexão com o redis 
    app.register(redisdb)
    //registra as rotas usadas
    app.register(routes)

    //inicia o servidor
    app.listen({port: Number(process.env.PORT) || 3000 , host: '0.0.0.0'}, () =>{
        console.log('Servidor rodando na porta '+ (Number(process.env.PORT) || 3000))
    })
}catch(err){
    console.error('Erro ao iniciar o servidor:', err)
}
