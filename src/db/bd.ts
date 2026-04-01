import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import mongoose from 'mongoose'
import redis , { RedisClientType } from 'redis'

declare module 'fastify'{
     export interface FastifyInstance{
        mongo: mongoose.Model<any>,
        redis: RedisClientType
    } 
}

export const mongodb = fp(async (app: FastifyInstance) => {
    mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/encurtador_de_url')

    const URL = mongoose.model('URL' , new mongoose.Schema({
        _id: String,
        url: String,
        quantidade_clicks: Number,
        data_criacao: ({type: Date , default: Date.now})
    }) , 'urls')

    app.decorate('mongo' , URL)
})

export const redisdb = fp( async (app: FastifyInstance) => {
    const client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    })

    await client.connect()
    
    app.decorate('redis' , client as RedisClientType)
})

