/*** IMPORTS ***/
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import express from 'express'
import * as func from './functions'


/*** VARIABLES ***/
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASSWORD
const dbName = process.env.DB_NAME
const connectionString = 'mongodb+srv://' + dbUser + ':' + dbPassword + '@programmingprojects.cpk0g.mongodb.net/' + dbName
const app = express()
const router = express.Router()  


/*** ROUTES ***/
router.post('/token', func.tokenCreate)
router.get('/',  func.helpMessage)
router.get('/version', func.versionMessage)
router.get('/help', func.helpMessage)
router.get('/all', func.tokenValidate, func.countryFetchAll)
router.get('/specific', func.tokenValidate, func.countryFetchSpecific)
router.get('/multiple', func.tokenValidate, func.countryFetchMultiple)
router.get('/usage', func.tokenValidate, func.tokenUsage)
router.use(func.errorMessage)


/*** SETTINGS ***/
app.use(bodyParser.json())                                 //set parser
app.use(bodyParser.raw())                                  //set parser
app.use(bodyParser.text())                                 //set parser
app.use(bodyParser.urlencoded({ extended: true }))         //set parser
app.use((req, res, next) => {                              //set cors handling
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})
app.use(router)


/*** CONNECT DATABASE ***/
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connection.on('error', () => { console.error.bind(console, 'DB connection error:') })
mongoose.connection.once('open', () => { console.log('DB connected!') })


/*** START SERVER ***/
if (import.meta.env.PROD) { app.listen(process.env.PORT || 3000) }


/*** EXPORTS ***/
export const viteNodeApp = app;