import { getAlumnosCollection, getAsignaturasCollection } from "../config/db";
import { ObjectId } from "mongodb";
import type { AlumnoT, AlumnoPatchT, AsignaturaT, AsignaturaPatchT } from "../models/types";

const checkAlumnosExisten = async (alumnos: ObjectId[]) => {
    const collection = getAlumnosCollection();
    const alumnosQueExisten = await collection.find({_id: {$in: alumnos}}).toArray();

    if (alumnosQueExisten.length !== alumnos.length) {
        throw new Error("Algunos alumnos no existen sorry");
    }
}

const checkAsignaturasExisten = async (asignaturas: ObjectId[]) => {
    const collection = getAsignaturasCollection();
    const asignaturasQueExisten = await collection.find({_id: {$in: asignaturas}}).toArray();

    if (asignaturasQueExisten.length !== asignaturas.length) {
        throw new Error("Algunas asignaturas no existen sorry");
    }
}

export const resolvers = {
    Query: {
        alumnos: async () => {
            const collection = getAlumnosCollection();
            return await collection.find().toArray();
        },

        alumno: async (_: unknown, args: {id: string}) => {
            const collection = getAlumnosCollection();
            const id = new ObjectId(args.id);
            return await collection.findOne({_id: id});
        },

        alumnosPorEdad: async (_: unknown, args: {edad: number}) => {
            const { edad } = args;
            const collection = getAlumnosCollection();
            return await collection.find({edad}).toArray();
        },

        asignaturas: async () => {
            const collection = getAsignaturasCollection();
            return await collection.find().toArray();
        },

        asignatura: async (_: unknown, args: {id: string}) => {
            const collection = getAsignaturasCollection();
            const id = new ObjectId(args.id);
            return await collection.findOne({_id: id});
        },

        asignaturasPorCurso: async (_: unknown, args: {curso: number}) => {
            const { curso } = args;
            const collection = getAsignaturasCollection();
            return await collection.find({curso}).toArray();
        },

        alumnosPorAsignatura: async (_: unknown, args: {asignaturaId: string}) => {
            const collection = getAlumnosCollection();
            const id = new ObjectId(args.asignaturaId);
            return await collection.find({asignaturas: id}).toArray();
        },

        asignaturasPorAlumno: async (_: unknown, args: {alumnoId: string}) => {
            const collection = getAsignaturasCollection();
            const id = new ObjectId(args.alumnoId);
            return await collection.find({alumnos: id}).toArray();
        }
    },

    Mutation: {
        crearAlumno: async (_: unknown, args: {input: AlumnoT}) => {
            const collection = getAlumnosCollection();
            const asignaturasCollection = getAsignaturasCollection();

            const nuevoAlumno: AlumnoT = {
                ...args.input,
                asignaturas: args.input.asignaturas ?
                    args.input.asignaturas.map(id => new ObjectId(id as string)) : []
            }

            await checkAsignaturasExisten(nuevoAlumno.asignaturas as ObjectId[]);

            const insertado = await collection.insertOne(nuevoAlumno);

            await asignaturasCollection.updateMany(
                {_id: {$in: nuevoAlumno.asignaturas as ObjectId[]}},
                {$addToSet: {alumnos: insertado.insertedId}}
            );

            return await collection.findOne({_id: insertado.insertedId});
        },

        actualizarAlumno: async (_: unknown, args: {id: string, input: AlumnoPatchT}) => {
            const collection = getAlumnosCollection();
            const asignaturasCollection = getAsignaturasCollection();
            const id = new ObjectId(args.id);

            const alumno = await collection.findOne({_id: id});

            if (!alumno) {
                throw new Error("El alumno no existe sorry");
            }

            if (args.input.asignaturas) {
                const asignaturas = args.input.asignaturas.map(
                    id => new ObjectId(id as string)
                );

                await checkAsignaturasExisten(asignaturas);

                await asignaturasCollection.updateMany(
                    {alumnos: id},
                    {$pull: {alumnos: id}}
                );

                await asignaturasCollection.updateMany(
                    {_id: {$in: asignaturas}},
                    {$addToSet: {alumnos: id}}
                );
            }

            if (args.input.nombre === null ||
                args.input.edad === null ||
                args.input.email === null) {
                throw new Error("Los campos no pueden ser null espabila");
            }

            const datos = {...args.input};

            if (datos.asignaturas) {
                datos.asignaturas = datos.asignaturas.map(
                    id => new ObjectId(id as string)
                );
            } else {
                delete datos.asignaturas;
            }

            return await collection.findOneAndUpdate(
                {_id: id},
                {$set: datos},
                {returnDocument: "after"}
            );
        },

        eliminarAlumno: async (_: unknown, args: {id: string}) => {
        const collection = getAlumnosCollection();
        const asignaturasCollection = getAsignaturasCollection();
        const id = new ObjectId(args.id);

        const asignaturas = await asignaturasCollection.find({
            alumnos: id
        }).toArray();

        const operaciones: Promise<unknown>[] = [];

        asignaturas.forEach(asignatura => {
            operaciones.push(
                asignaturasCollection.updateOne(
                    {_id: asignatura._id},
                    {$pull: {alumnos: id}}
                )
            );
        });

        await Promise.all(operaciones);

        return await collection.findOneAndDelete({_id: id});
        },

        crearAsignatura: async (_: unknown, args: {input: AsignaturaT}) => {
            const collection = getAsignaturasCollection();
            const alumnosCollection = getAlumnosCollection();

            const nuevaAsignatura: AsignaturaT = {
                ...args.input,
                alumnos: args.input.alumnos ?
                    args.input.alumnos.map(id => new ObjectId(id as string)) : []
            }

            await checkAlumnosExisten(nuevaAsignatura.alumnos as ObjectId[]);

            const insertada = await collection.insertOne(nuevaAsignatura);

            await alumnosCollection.updateMany(
                {_id: {$in: nuevaAsignatura.alumnos as ObjectId[]}},
                {$addToSet: {asignaturas: insertada.insertedId}}
            );

            return await collection.findOne({_id: insertada.insertedId});
        },

        actualizarAsignatura: async (_: unknown, args: {id: string, input: AsignaturaPatchT}) => {
            const collection = getAsignaturasCollection();
            const alumnosCollection = getAlumnosCollection();
            const id = new ObjectId(args.id);

            const asignatura = await collection.findOne({_id: id});

            if (!asignatura) {
                throw new Error("La asignatura no existe espabila");
            }

            if (args.input.nombre === null ||
                args.input.creditos === null ||
                args.input.curso === null) {
                throw new Error("Los campos no pueden ser null espabila");
            }

            if (args.input.alumnos) {
                const alumnos = args.input.alumnos.map(
                    id => new ObjectId(id as string)
                );

                await checkAlumnosExisten(alumnos);

                await alumnosCollection.updateMany(
                    {asignaturas: id},
                    {$pull: {asignaturas: id}}
                );

                await alumnosCollection.updateMany(
                    {_id: {$in: alumnos}},
                    {$addToSet: {asignaturas: id}}
                );
            }

            const datos = {...args.input};

            if (datos.alumnos) {
                datos.alumnos = datos.alumnos.map(
                    id => new ObjectId(id as string)
                );
            } else {
                delete datos.alumnos;
            }

            return await collection.findOneAndUpdate(
                {_id: id},
                {$set: datos},
                {returnDocument: "after"}
            );
        },

        eliminarAsignatura: async (_: unknown, args: {id: string}) => {
            const collection = getAsignaturasCollection();
            const alumnosCollection = getAlumnosCollection();
            const id = new ObjectId(args.id);

            await alumnosCollection.updateMany(
                {asignaturas: id},
                {$pull: {asignaturas: id}}
            );

            return await collection.findOneAndDelete({_id: id});
        },

        matricularAlumno: async (_: unknown, args: {alumnoId: string, asignaturaId: string}) => {
            const alumnosCollection = getAlumnosCollection();
            const asignaturasCollection = getAsignaturasCollection();

            const alumnoId = new ObjectId(args.alumnoId);
            const asignaturaId = new ObjectId(args.asignaturaId);

            await checkAlumnosExisten([alumnoId]);
            await checkAsignaturasExisten([asignaturaId]);

            await asignaturasCollection.updateOne(
                {_id: asignaturaId},
                {$addToSet: {alumnos: alumnoId}}
            );

            return await alumnosCollection.findOneAndUpdate(
                {_id: alumnoId},
                {$addToSet: {asignaturas: asignaturaId}},
                {returnDocument: "after"}
            );
        },

        desmatricularAlumno: async (_: unknown, args: {alumnoId: string, asignaturaId: string}) => {
            const alumnosCollection = getAlumnosCollection();
            const asignaturasCollection = getAsignaturasCollection();

            const alumnoId = new ObjectId(args.alumnoId);
            const asignaturaId = new ObjectId(args.asignaturaId);

            await checkAlumnosExisten([alumnoId]);
            await checkAsignaturasExisten([asignaturaId]);

            await asignaturasCollection.updateOne(
                {_id: asignaturaId},
                {$pull: {alumnos: alumnoId}}
            );

            return await alumnosCollection.findOneAndUpdate(
                {_id: alumnoId},
                {$pull: {asignaturas: asignaturaId}},
                {returnDocument: "after"}
            );
        }
    },

    AlumnoT: {
        _id: (parent: AlumnoT) => {
            return parent._id!.toString();
        },

        asignaturas: async (parent: AlumnoT) => {
            const collection = getAsignaturasCollection();

            const asignaturas = await collection.find(
                {_id: {$in: parent.asignaturas as ObjectId[]}}
            ).toArray();

            return asignaturas;
        }
    },

    AsignaturaT: {
        id: (parent: AsignaturaT) => {
            return parent._id!.toString();
        },

        alumnos: async (parent: AsignaturaT) => {
            const collection = getAlumnosCollection();

            const alumnos = await collection.find(
                {_id: {$in: parent.alumnos as ObjectId[]}}
            ).toArray();

            return alumnos;
        }
    }
};