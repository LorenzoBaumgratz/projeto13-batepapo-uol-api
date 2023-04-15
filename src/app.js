import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"

const app = express()
app.use(express.json())
app.use(cors())
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try {
    await mongoClient.connect()
} catch (err) {
    console.log(err.message)
}
const db = mongoClient.db()

app.post("/participants", async (req, res) => {
    const { name } = req.body
    const schema = joi.object({
        name: joi.string().required()
    })
    const validation = schema.validate(req.body, { abortEarly: false })
    if (validation.error) return res.sendStatus(422)

    const participante =
    {
        name: name,
        lastStatus: Date.now()
    }

    const mensagem =
    {
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss") //ARRUMAR HH:mm:ss
    }
    const result = await db.collection("participants").findOne({ name: name })
    if (result) return res.sendStatus(409)
    try {

        await db.collection("participants").insertOne(participante)
        await db.collection("messages").insertOne(mensagem)

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/participants", async (req, res) => {
    try {
        const result = await db.collection("participants").find().toArray()
        res.send(result)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body
    const { User } = req.header

    const mensagem =
    {
        from: User,
        to: to,
        text: text,
        type: type,
        time: dayjs().format("HH:mm:ss") //ARRUMAR HH:mm:ss
    }
    const existe = await db.collection("participants").findOne({ name: from })
    if (!existe) return res.sendStatus(422)

    const schema = joi.object({
        from: joi.required(),
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private_message").required()
    })
    const validation = schema.validate(mensagem, { abortEarly: false })
    if (validation.error) return res.sendStatus(422)

    try {
        await db.collection("messages").insertOne(mensagem)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

// app.get("/messages",async(req,res)=>{
//     const {User}=req.headers
//     const {limit}=req.query

//     if(limit<=0 || typeof(Number(limit)!=="number")) 
//     const mensagens1=await db.collection("messages").find({})
// })

app.listen(5000)