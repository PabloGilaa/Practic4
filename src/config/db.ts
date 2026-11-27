import { Collection, MongoClient } from "mongodb";
import type { AlumnoT, AsignaturaT } from "../models/types";

const client = new MongoClient("mongodb+srv://gilita:gila06@cluster0.uqjnvcx.mongodb.net/");

let alumnosCollection: Collection<AlumnoT>;
let asignaturasCollection: Collection<AsignaturaT>;

export const connectDB = async () => {
    await client.connect();

    const db = client.db("practica4");

    alumnosCollection = db.collection<AlumnoT>("alumnos");

    asignaturasCollection = db.collection<AsignaturaT>("asignaturas");

    console.log("Conectado al Mondongo")
};

export const getAlumnosCollection = () => {
    return alumnosCollection
}

export const getAsignaturasCollection = () => {
    return asignaturasCollection
}