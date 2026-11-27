import type { ObjectId } from "mongodb";

export type AlumnoT = {
    _id?: ObjectId,
    nombre: string,
    edad: number,
    email: string,
    asignaturas: AsignaturaT[] | ObjectId[] | string[]
}

export type AlumnoPatchT = {
    nombre?: string,
    edad?: number,
    email?: string,
    asignaturas?: AsignaturaT[] | ObjectId[] | string[]
}

export type AsignaturaT = {
    _id?: ObjectId,
    nombre: string,
    creditos: number,
    curso: number,
    alumnos: AlumnoT[] | ObjectId[] | string[]
}

export type AsignaturaPatchT = {
    nombre?: string,
    creditos?: number,
    curso?: number,
    alumnos?: AlumnoT[] | ObjectId[] | string[]
}