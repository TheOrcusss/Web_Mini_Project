const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb+srv://admin:yCx9PhqFvb9bWX_@cluster0.9fgmtbd.mongodb.net/usersDB?retryWrites=true&w=majority&appName=Cluster0');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://admin:yCx9PhqFvb9bWX_@cluster0.9fgmtbd.mongodb.net/usersDB?retryWrites=true&w=majority&appName=Cluster0'
  }),
}));

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(__dirname + '/public'));
app.use('/', authRoutes);
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: true }));


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
