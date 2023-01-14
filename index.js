const express = require('express');
const PORT = process.env.PORT || 4444
const mongoose = require('mongoose')
const app = express();
const authRouter = require('./authRoutes.js')

app.use(express.json());
app.use('/auth', authRouter)

const start = async () => {
    try {
        await mongoose.connect(`mongodb+srv://admin:admin@cluster0.trwdqp9.mongodb.net/?retryWrites=true&w=majority`, console.log('DB is ok'))
        app.listen(PORT, () => console.log(`server runnig on ${PORT}`));
    } catch (error) {
        console.log(error);
    }
}

start()

// перший мій бек-енд прошу оцінити !