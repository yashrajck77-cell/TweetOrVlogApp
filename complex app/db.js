const dotenv =require('dotenv')
dotenv.config()
const {MongoClient} = require('mongodb')
async function start(){
const client =new MongoClient(process.env.CONNECTIONSTRING)
   await client.connect()
   module.exports =client
   const app=require('./app')
   app.listen(process.env.PORT)
}
start()