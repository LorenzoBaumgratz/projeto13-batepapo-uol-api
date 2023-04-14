import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"

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
    if (typeof (name) !== "string" || name.length === 0) return res.sendStatus(422)
    const result = await db.collection("participants").findOne({ name: name })
    if (result) return res.sendStatus(409)

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
        time: dayjs //ARRUMAR HH:mm:ss
    }

    try {
        await db.collection("participants").insertOne(participante)
        await db.collection("messages").insertOne(mensagem)

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("participants", async (req, res) => {
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
        time: dayjs //ARRUMAR HH:mm:ss
    }

    try {
        const existe = await db.collection("participants").findOne({ name: from })
        if (typeof (to) !== "string" || typeof (text) !== "string" || to.length !== 0 || text.length !== 0 || type === "message" || type === "private_message" || !existe) {
            return res.sendStatus(422)
        }
        await db.collection("messages").insertOne(mensagem)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})
app.listen(5000)