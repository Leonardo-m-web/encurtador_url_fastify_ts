import {fastify} from 'fastify'
import { serializerCompiler , validatorCompiler , ZodTypeProvider , jsonSchemaTransform } from 'fastify-type-provider-zod'
import {fastifyCors} from '@fastify/cors'
import {fastifySwagger} from '@fastify/swagger'
import {fastifySwaggerUi} from '@fastify/swagger-ui'


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

app.listen({port: Number(process.env.PORT) || 3000 , host: '0.0.0.0'}, () =>{
    console.log('Servidor rodando na porta '+ (Number(process.env.PORT) || 3000))
})
