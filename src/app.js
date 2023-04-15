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
        time: dayjs().format("HH:mm:ss")
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
    const { user } = req.headers

    const mensagem =
    {
        from: user,
        to: to,
        text: text,
        type: type,
        time: dayjs().format("HH:mm:ss")
    }
    const existe = await db.collection("participants").findOne({ name: user })
    if (existe === null) return res.sendStatus(422)

    const schema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private_message").required()
    })
    const validation = schema.validate(req.body, { abortEarly: false })
    if (validation.error) return res.sendStatus(422)

    try {
        await db.collection("messages").insertOne(mensagem)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/messages", async (req, res) => {
    const { user } = req.headers
    const { limit } = req.query
    console.log(parseInt(limit))
    console.log(typeof (parseInt(limit)))
    console.log(limit)

    if (limit) {
        if (limit <= 0 || (isNaN(parseInt(limit)) && !isFinite(limit))) return res.sendStatus(422)
    }
    const mensagens = await db.collection("messages").find({ $or: [{ to: "Todos" }, { to: user }, { from: user }] }).toArray()
    if (!limit) {
        res.send(mensagens)
    } else {
        res.send(mensagens.slice(0, limit))
    }
})

app.post("/status", async (req, res) => {
    const { user } = req.headers
    if (!user) return res.sendStatus(404)

    const verify = await db.collection("participants").find({ name: user })
    if (!verify) return res.sendStatus(404)

    try {
        const aux=await db.collection("participants").findOne({ name: user })
        aux.lastStatus=Date.now()
        console.log(aux)
        console.log(Date.now())
        const result = await db.collection("participants").updateOne({ name: user }, { $set:aux})
        if (result.matchedCount === 0) {
            console.log("aqui")
            return res.sendStatus(404)
        }
        res.sendStatus(200)
    } catch (err) {
        res.sendStatus(404)
    }

})

app.listen(5000)