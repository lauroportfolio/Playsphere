import mongoose from 'mongoose'

let isConnected = false // variável para checar se o mongoose está conectado

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if(!process.env.MONGODB_URL) return console.log('MONGODB_URL não encontrado');
    if(isConnected) return console.log('Você já está conectado ao MongoDB')

        try {
            await mongoose.connect(process.env.MONGODB_URL);

            isConnected = true;

            console.log('Conectado ao MongoDB');
        } catch (error) {
            console.log(error)
        }
}