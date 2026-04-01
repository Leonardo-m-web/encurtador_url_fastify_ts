import {FastifyInstance , RawServerDefault ,RawRequestDefaultExpression ,RawReplyDefaultExpression, FastifyBaseLogger} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import mongoose from 'mongoose'
import { RedisClientType } from 'redis'

//adiciona novas propriedades a interface do fastify (usado so em ts)
declare module 'fastify'{
    export interface FastifyInstance{
        //models do mongo e do redis (para o decorat não dar erro de tipo)
        mongo: mongoose.Model<any>, 
        redis: RedisClientType
    }
}

//tipo customizado para o fastify com o zod como type provider (usado so em ts)
export type FastifyTypeInstance = FastifyInstance<
    RawServerDefault ,
    RawRequestDefaultExpression ,
    RawReplyDefaultExpression, 
    FastifyBaseLogger ,
    ZodTypeProvider   
>