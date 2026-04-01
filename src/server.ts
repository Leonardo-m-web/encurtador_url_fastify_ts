import {fastify} from 'fastify'
import { serializerCompiler , validatorCompiler , ZodTypeProvider , jsonSchemaTransform } from 'fastify-type-provider-zod'
import {fastifyCors} from '@fastify/cors'
import {fastifySwagger} from '@fastify/swagger'
import {fastifySwaggerUi} from '@fastify/swagger-ui'
import {routes} from './routes.js'
import {mongodb , redisdb} from './db/bd.js'



const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors , {
    origin: '*'
})

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

app.register(fastifySwaggerUi ,{
    routePrefix: '/docs',
})

try{
    app.register(mongodb)

    app.register(redisdb)

    app.register(routes)


    app.listen({port: Number(process.env.PORT) || 3000 , host: '0.0.0.0'}, () =>{
        console.log('Servidor rodando na porta '+ (Number(process.env.PORT) || 3000))
    })
}catch(err){
    console.error('Erro ao iniciar o servidor:', err)
}
