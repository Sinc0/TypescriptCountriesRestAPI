/*** IMPORTS ***/
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose';
import * as model from './schemas'


/*** VARIABLES ***/
const dbTokens = mongoose.connection.collection('tokens')


/*** FUNCTIONS ***/
export async function versionMessage(req, res) {

    //log
    console.log(req.ip + " requests " + "/version")

    //send response
    res.json({ version: '1.0.1' })
}

export async function errorMessage(req, res) {

    //log
    console.log(req.ip + " requests " + req.originalUrl + " route that does not exist")

    //send response
    res.status(404).json({error: 'route does not exist'})
}

export async function helpMessage(req, res) {
    
    //log
    console.log(req.ip + " requests " + "/help")
    
    //variables
    let endpoints: Array<object> = [
        { id: 1, type: "POST", url: "/token", validation: false },
        { id: 2, type: "GET", url: "/help", validation: false },
        { id: 3, type: "GET", url: "/version", validation: false },
        { id: 4, type: "GET", url: "/all?token={token}", validation: true },
        { id: 5, type: "GET", url: "/specific?token={token}&name={country}", validation: true },
        { id: 6, type: "GET", url: "/multiple?token={token}&name={country1},{country2}", validation: true },
        { id: 7, type: "GET", url: "/usage?token={token}", validation: true },
    ]
    let countries: Array<string> = [
        "Brazil",
        "Denmark", 
        "Finland", 
        "France", 
        "Germany", 
        "Italy", 
        "Mexico", 
        "Spain", 
        "Sweden", 
        "USA"
    ]
    
    //send response
    res.json({
        name: "Countries REST API",
        about: "This is a student project, made to learn about REST APIs",
        version: "1.0.1", 
        contact: "sinco.developer@gmail.com",
        instructions: {step1: "make POST request to /token to obtain token", step2: "make desired requests"}, 
        endpoints: {total: endpoints.length, available: endpoints},
        countries: {total: countries.length, available: countries}, 
    })
}

export async function countryFetchAll(req, res) {

    //log
    console.log(req.ip + " requests " + "/all with correct token " + req.query.token)

    //fetch country data from DB 
    let data: any = await model.country.find({},{'_id': 0}) //get all countries

    //null check data
    if(data.length == 0) { res.status(404).json({ error: '404 countries not found' }); return }

    //send response
    res.json({ type: 'all', total: data.length, countries: data })

    //update DB usage counter
    await dbTokens.updateOne({id: req.query.token}, {$inc: {"all": 1}})
}

export async function countryFetchSpecific(req, res) {

    //log
    console.log(req.ip + " requests " + "/specific&name=" + req.query.name)

    //variables
    let specificCountry: string = req.query.name
    let token: string = req.query.token

    //null check
    if(specificCountry == null || specificCountry == undefined || specificCountry == "") { res.status(404).json({ error: 'country not specified' }); return }

    //handle data
    else {
        
        //case handling
        specificCountry = specificCountry.toString()
        if (specificCountry == "usa") { specificCountry = "USA" }
        else { specificCountry = firstLetterToUppercase(specificCountry)}

        //get country data
        let data: any = await model.country.find({name: specificCountry},{'_id': 0})

        //null check data
        if(data.length == 0) { res.status(404).json({ error: '404 country not found' }); return }

        //check if country is valid
        else if(data.length != 0) {
            
            //send response
            res.json({type: 'specific', country: data})

            //update DB usage counter
            await dbTokens.updateOne({id: token}, {$inc: {"specific": 1}})
        }
        
        //handle unexpected error
        else
        {
            //send response
            res.status(404).json({ error: 'unexpected error encountered please try again later' })
        }
    }
}

export async function countryFetchMultiple(req, res) {

    //log
    console.log(req.ip + " requests " + "/multiple&name=" + req.query.name)

    //variables
    let token: string = req.query.token
    let data: any = ""
    let multipleCountriesParam: string = req.query.name
    let multipleCountriesArray: Array<string> = []
    let multipleCountriesCount: number = 0

    //null check params
    if(multipleCountriesParam == null || multipleCountriesParam == undefined || multipleCountriesParam == "") { 
        res.status(404).json({ error: 'multiple countries not specified' }); return 
    }
    else {
        multipleCountriesArray = multipleCountriesParam.split(",")
        multipleCountriesCount = multipleCountriesParam.split(",").length
    }

    //case handle params
    if(multipleCountriesCount > 1) {

        //clean array
        multipleCountriesArray = multipleCountriesArray.map(value => value.trim()) //remove white space from array values
        multipleCountriesArray = multipleCountriesArray.filter(item => item !== "") //remove empty array values

        //set specific string to uppercase
        for (let i in multipleCountriesArray) {
            if (multipleCountriesArray[i] == "usa") { multipleCountriesArray[i] = "USA" } 
        } 
        
        //set first letter to uppercase
        for (let i in multipleCountriesArray) { 
            if (multipleCountriesArray[i] != "") { multipleCountriesArray[i] = firstLetterToUppercase(multipleCountriesArray[i])}
        }

        //fetch countries data from DB
        data = await model.country.find({ "name" : { $in : multipleCountriesArray } },{'_id': 0})
    }
        
    //check if countries data is invalid
    if(data.length == 0) { res.status(404).json({ error: '404 countries not found' }); return }

    //check if countries data is valid
    else if(data.length != 0) { 

    //send response
    res.json({type: 'multiple', total: data.length, countries: data})

    //update DB usage counter
    await dbTokens.updateOne({id: token}, {$inc: {"multiple": 1}})
    }

    //handle unexpected error
    else { res.status(404).json({ error: 'unexpected error encountered please try again later' })}
}

export async function tokenCreate(req, res) {
    
    //log
    console.log(req.ip + " requests " + "/token")

    //variables
    let clientIp: number = req.ip
    let date: Date = new Date()
    let uuid: string = uuidv4()

    //update DB create token
    new model.token({ ip: clientIp, id: uuid, createdAt: date, all: 0, specific: 0, multiple: 0 }).save()

    //send response
    res.status(201).json({ token: uuid }) 
}

export async function tokenValidate(req, res, next) {

    //variables
    let requestedPath: string = req.route.path
    let clientToken: string = req.query.token
    let clientIp: number = req.ip
    let tokenIsValid: number = 1
    let requestLimitPerHour = 100

    //fetch token data from DB
    let tokenData: any = await model.token.find({id: clientToken})

    //check if token data is invalid
    if(tokenData.length != tokenIsValid) { 
        
        //log
        console.log(clientIp + " requests " + requestedPath + " with invalid token " + clientToken); 
        
        //send response
        res.json({ error: 'token is invalid' }) 
    }

    //check if token data is valid
    else if(tokenData.length == tokenIsValid) {
        
        //set variables
        let tokenRequestCountAll: number = tokenData[0]['all']
        let tokenRequestCountSpecific: number = tokenData[0]['specific']
        let tokenRequestCountMultiple: number = tokenData[0]['multiple']
        let tokenRequestCountTotal = tokenRequestCountAll + tokenRequestCountSpecific + tokenRequestCountMultiple
        
        //check token request limit 
        if(tokenRequestCountTotal > requestLimitPerHour) { res.json({ error: 'request limit of 100 has been reached' }); return }
        
        //token is valid proceed with request
        else { next() }
    }

    //handle unexpected error
    else { res.json({ error: 'unexpected error encountered please try again later' }) }
}

export async function tokenUsage(req, res) {

    //log
    console.log(req.ip + " requests " + "/usage with correct token" + req.query.token)

    //fetch token data from DB
    let tokenData: any = await model.token.find({id: req.query.token},{'_id': 0})

    //check if token data is invalid
    if(tokenData.length == 0) { res.status(404).json({ error: '404 token not found' }); return }

    //check if token data is valid
    else if(tokenData.length != 0) {
        
        //variables
        let tokenId: number
        let tokenCreatedAt: any
        let tokenExpiresAt: any
        let expiresInMinutes: any
        let tokenRequestsAll: number
        let tokenRequestsSpecific: number
        let tokenRequestsMultiple: number
        let tokenRequestsTotal: number
        let cleandTokenData: object

        //set token variables
        tokenData = tokenData[0]
        tokenId = tokenData['id']
        tokenCreatedAt = tokenData['createdAt']
        tokenExpiresAt = new Date(tokenCreatedAt.getTime() + 3600000)
        expiresInMinutes = calculateTokenExpiration(tokenCreatedAt)
        tokenRequestsAll = tokenData['all']
        tokenRequestsSpecific = tokenData['specific']
        tokenRequestsMultiple = tokenData['multiple']
        tokenRequestsTotal = tokenData['all'] + tokenData['specific'] + tokenData['multiple']
        
        //set token requests object
        cleandTokenData = {
            all: tokenRequestsAll,
            specific: tokenRequestsSpecific,
            multiple: tokenRequestsMultiple,
            total: tokenRequestsTotal,
            remaining: 100 - tokenRequestsTotal
        }

        //send response
        res.json({
            type: 'usage', 
            token: tokenId, 
            createdAtDate: tokenCreatedAt, 
            expiresAtDate: tokenExpiresAt, 
            expiresInMinutes: expiresInMinutes, 
            requests: cleandTokenData
        })
    }

    //handle unexpected error
    else { res.status(404).json({ error: 'unexpected error encountered please try again later' })}
}

function firstLetterToUppercase(value) {
    return value[0].toUpperCase() + value.substring(1)
}

function calculateTokenExpiration(value) {

    //variables
    let OneHourInMS: number = 3600000
    let timeExpires: any = value.getTime() + OneHourInMS
    let timeCurrent: any = new Date().getTime()
    let timeDifference: any
    let minutesLeft: number
    let minutesRounded: number

    //calculate token minutes until expiration
    timeDifference = timeExpires - timeCurrent
    minutesLeft = (timeDifference / OneHourInMS * 60)

    //round decimal number
    minutesRounded = Math.round(minutesLeft)

    return minutesRounded
}