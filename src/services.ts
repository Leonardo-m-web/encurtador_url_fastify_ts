import { FastifyInstance } from 'fastify'
import Hashids from 'hashids'

//configura o hashID (tamanho de 6 caracteres e usando base 62) para os IDs das urls curtas
const hashids = new Hashids(process.env.HASHIDS_SALT || 'salt' , 6 , 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' )

//função que recebe uma url longa e retorna o id do registro onde ela foi guardada no bd
export async function shortURL(app: FastifyInstance , url: string): Promise<string|null>{
    //procura a url no mongoDB
    const result = await app.mongo.findOne({url: url} , 'url') //busca no mongoDB (so a URL)        
            
    //se ela não existir cria uma nova
    if(!result?.url ){
        //forma o ID com o hashID usando a data atual
        const id = hashids.encode(Date.now())

        //salva no mongoDB (usando decorate do fastify) as URLs (curta será salva como "_id" e a original como "url") e a quantidade de clicks 
        const newUrl = new app.mongo({
            _id: id,
            url: url,
            quantidade_clicks: 0
        })
        await newUrl.save()

        return id
    }
    return null
}

//função que recebe um id de url curta e retorna a url longa correspondente (ou null se não achar no bd)
export async function getURL(app: FastifyInstance , id: string){
    //verifica se a URL original esta armazenada em cache
    let url:string|null = await app.redis.get(id)

    //se não estiver no cache, busca no mongoDB e armazena no cache por 24 horas
    if(!url){
        const result = await app.mongo.findById(id).select('url data_criacao') //busca no mongoDB (URL e data de criação)
        url = result?.url
    
        if(!url || result.data_criacao < new Date(Date.now() - 30 * 60 * 60 * 24 * 1000)){ //verifica se a URL existe ou se ela é mais antiga que 30d
            if(url) await app.mongo.deleteOne({_id: id}) //se for apenas mais antiga exclui do bd
            return null
        }

        await app.redis.set(id, url , {EX: 60 * 60 * 24 }) //armazena em cache (redis) pro 24h
    }

    //atualiza a quantidade de clicks
    await app.mongo.updateOne({_id: id} , {$inc: {quantidade_clicks: 1}})

    return url
}

//função que retorna a quantidade de clicks de uma url curta
export async function getClicks(app: FastifyInstance , id: string) {
    return await app.mongo.findById(id).select('quantidade_clicks') //busca no mongoDB (so a quantidade de clicks)
}

