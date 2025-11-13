/*** IMPORTS ***/
import mongoose from 'mongoose';


/*** SCHEMAS ***/
const Schema = mongoose.Schema
const countrySchema = new Schema({id: Number,name: String,population: String,capital: String,area: String,currency: String},{ versionKey: false })
const tokenSchema = new Schema({ ip: String, id: String, createdAt: Date, all: Number, specific: Number, multiple: Number },{ versionKey: false })


/*** MODELS ***/
const country = mongoose.model('country', countrySchema)
const token = mongoose.model('token', tokenSchema)


/*** EXPORTS ***/
export { country, token }