const mongoose = require('mongoose');

const connectDB = (link) => {
    return mongoose.connect(link, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('DB connection succesful');
        })
        .catch(err => {
            console.error('Failed to connect DB');
        });
};

module.exports = connectDB;