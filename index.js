const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const AuthRoute = require('./routes/authRoutes')
const UserRoute = require('./routes/userRoutes')
const ProjectRoute = require('./routes/projectRoutes')
const AiRoute = require('./routes/aiRoutes')

dotenv.config();

mongoose.connect(process.env.MONGOURL)
.then(()=>console.log("ProjexHub DB connected"))
.catch((err)=>console.log(err));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use("/",AuthRoute);
app.use("/api/users",UserRoute);
app.use("/api/projects",ProjectRoute);
app.use("/api/ai",AiRoute);

app.listen(process.env.PORT || 1505, () => console.log(`ProjexHub backend is running on port ${process.env.PORT}`))