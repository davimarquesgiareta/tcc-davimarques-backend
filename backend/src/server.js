import express, { response } from "express"
import {tagsArray} from "./utils/tags.js"
import {usuarios} from './testUsuarios.js'
import { tagsResponse } from "./utils/tagsResponse.js"
import cors from "cors"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import User from './models/User.js'
import api from './api.js'

dotenv.config()

const app = express()

app.use(cors());
app.use(express.json())

//FUNCTIONS
function checkToken(request,response,next){
  const authHeader = request.headers['authorization']
  const token = authHeader && authHeader.split(" ")[1]

  if(!token){
    return response.status(401).json({msg:"Access Denied!"})
  }

  try {
    const secret = process.env.SECRET

    jwt.verify(token,secret)

    next()

  } catch (error) {
    response.status(400).json({msg:"Token invalid"})
  }
}

//ROUTES//

//*****INFLUENCERS */

app.get("/influencers", (request, response)=>{

const {
        queryTags, queryReligiosity, queryPoliticPreference, queryBrazilianState,
        queryFollowers
      } = request.body

var  matriz = [[tagsArray[0]],[],[1]]
var pesoTags = 0

//PESO TAGS
for(let i=0; i<usuarios.length; i++){
  for (let j=0; j<usuarios[i].tags.length; j++){
      for(let k=0; k<queryTags.length; k++){
          if (usuarios[i].tags[j] === queryTags[k]){
              pesoTags++
          }
      }
  }   
  matriz[1].push(pesoTags) 
  pesoTags=0 
}
//OUTROS PESOS
const religiosityWeight = 1
const politcPreferenceWeight =1
const queryBrazilianStateWeight = 11
const followersWeight = 1

// Preenchimento dos arrays que usarão pra ordenar
const names = []
const influenzers = []

for (let i=0; i<usuarios.length; i++){
    let othersWeight = 0
    names.push(usuarios[i])
    usuarios[i].politic === queryPoliticPreference ? othersWeight+= politcPreferenceWeight: ""
    usuarios[i].religiosity === queryReligiosity ? othersWeight+= religiosityWeight : ""
    usuarios[i].state === queryBrazilianState ? othersWeight+= queryBrazilianStateWeight : ""
    usuarios[i].followers >= queryFollowers ? othersWeight+= followersWeight : ""
    influenzers.push([matriz[1][i]+othersWeight, i])

    console.log("Usuario "+ usuarios[i].nome + "  Peso Tags: "+ matriz[1][i] + "  Outros Pesos:  " + othersWeight)
    
}

// ORDENDANDO EM ORDEM DECRESCENTE, OU SEJA O MAIS RELEVANETE PRO MENOS RELEVANTE
var influencesSort = []
influencesSort = influenzers.sort( function(x,y){
        return y[0] - x[0]  
    } )

var tam = (influencesSort[0])[0]

var goInflueners = []

  for (let index = 0; index < influencesSort.length; index++) {
    // console.log(names[(influencesSort[index])[1]])
    goInflueners.push(names[(influencesSort[index])[1]])
  }


return response.status(201).json(goInflueners)
  
})

app.get("/influencers/:id",(request, response)=>{

  var {id} = request.params
 
  const chosen = usuarios.find(usuario => usuario.id === parseInt(id) )

  if (!chosen){
    return response.json({error: "User not found"})
  }
 
  return response.status(201).json(chosen)

})

app.post('/auth/login', async(request,response)=>{
  const {email, password} = request.body

  if(!email){
    return response.status(422).json({msg:"Email is required"})
  }

  if(!password){
    return response.status(422).json({msg:"Password is required"})
  }

  const user = await User.findOne({email: email})

  if (!user){
    return response.status(404).json({msg:"User not found"})
  }

  const checkPassword = await bcrypt.compare(password, user.password)

  if(!checkPassword){
    return response.status(422).json({msg:"Password Invalid"})
  }

  try {

    const secret = process.env.SECRET
    const token = jwt.sign({
      id: user._id
    },secret)

    response.status(200).json({msg:"Auth Sucessfull", token})
    
  } catch (error) {
    console.log(error)

    response.status(500).json({
      msg:"Some failed"
    })
  }

})

//***********USER

//CREATE USER
app.post('/auth/register', async(request, response)=>{

  const {
          name, email, password, confirmpassword, city, state, politic, religiosity, instagramLink, followers,
          tags, whatsapp, socialMedias
        } = request.body

  if(!name){
    return response.status(422).json({msg:"Name is required"})
  }

  if(!email){
    return response.status(422).json({msg:"Email is required"})
  }

  if(!password){
    return response.status(422).json({msg:"Password is required"})
  }

  if(password != confirmpassword){
    return response.status(422).json({msg:"Password and Corfirm password doesn't match"})
  }

  const userExists = await User.findOne({email: email})

  if(userExists){
    return response.status(422).json({msg:"Email already using"})
  }

  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password,salt)

  console.log("reliogisade", religiosity)

  const userData ={
    name,
    email,
    password: passwordHash,
    city,
    state,
    politic,
    religiosity,
    instagramLink,
    followers,
    tags,
    whatsapp,
    socialMedias
  }

  console.log('userData', userData)

  const user = new User(
    userData

    // name,
    // email,
    // password: passwordHash,
    // city,
    // politic,
    // religiosity,
    // instagramLink,
    // followers,
    // tags,
    // whatsapp,
    // socialMedias
    
  )

  try {
    await user.save()
     console.log(user)
    response.status(201).json({msg:"Create Sucessfull"})

  } catch (error) {
    console.log(error)
    response.status(500).json({msg:"Some failed"})
  }

})

//GET USER
app.get("/user/:id", checkToken , async (request, response)=>{

  const id = request.params.id

  const user = await User.findById(id, '-password')

  if(!user){
    return response.status(404).json({msg:"User not found"})
  }

  return response.status(200).json({user})

})

//GET ALL USERS
app.get("/users",checkToken, async (request,response)=>{
  
  const users = await User.find({}, '-password')

  // const {
  //   queryTags, queryReligiosity, querypolitic, queryBrazilianState,
  //   queryFollowers
  // } = request.body

  const {
   state, city, politic, followers,tags, religiosity
  } = request.body

var  matriz = [[tagsArray[0]],[],[1]]
var pesoTags = 0

//PESO TAGS
for(let i=0; i<users.length; i++){
for (let j=0; j<users[i].tags.length; j++){
  for(let k=0; k<tags.length; k++){
      if (users[i].tags[j] === tags[k]){
          pesoTags++
      }
  }
}   
matriz[1].push(pesoTags) 
pesoTags=0 
}
//OUTROS PESOS
const religiosityWeight = 1
const politcPreferenceWeight =1
const queryBrazilianStateWeight = 10
const cityWeight =10
const followersWeight = 1

// Preenchimento dos arrays que usarão pra ordenar
const names = []
const influenzers = []

for (let i=0; i<users.length; i++){
let othersWeight = 0
names.push(users[i])
users[i].politic === politic ? othersWeight+= politcPreferenceWeight: ""
users[i].religiosity === religiosity ? othersWeight+= religiosityWeight : ""
users[i].state === state ? othersWeight+= queryBrazilianStateWeight : ""
users[i].city === city ? othersWeight+= cityWeight : ""
users[i].followers >= followers ? othersWeight+= followersWeight : ""
influenzers.push([matriz[1][i]+othersWeight, i])

console.log("Usuario "+ users[i].nome + "  Peso Tags: "+ matriz[1][i] + "  Outros Pesos:  " + othersWeight)
console.log(city)
}

// ORDENDANDO EM ORDEM DECRESCENTE, OU SEJA O MAIS RELEVANETE PRO MENOS RELEVANTE
var influencesSort = []
influencesSort = influenzers.sort( function(x,y){
    return y[0] - x[0]  
} )

var tam = (influencesSort[0])[0]

var goInflueners = []

for (let index = 0; index < influencesSort.length; index++) {
// console.log(names[(influencesSort[index])[1]])
goInflueners.push(names[(influencesSort[index])[1]])
}


return response.status(201).json(goInflueners)
 
})

//UPDATE USER
app.put("/user/:id", checkToken, async (request, response)=>{
  const {id } = request.params
  const {name, email, password} = request.body

  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password,salt)

  const user = await User.updateOne({_id:id}, { $set:{name, email, password:passwordHash}})

  return response.status(200).json({user})
  
})

//DELETE USER
app.delete("/user/:id", checkToken, async (request, response)=>{
  const {id } = request.params
  const user = await User.remove({_id:id})

  return response.status(200).json({user})
  
})

app.post("/followers", async(request, response)=>{

  const  {user}  = request.body
  console.log(user)

const followers = await api
    .get(`/${user}/?__a=1`)
    .then((response) => response.data.graphql.user.edge_followed_by.count)
    .catch((err) => {
      console.error("ops! ocorreu um erro" + err);
    });

    console.log(followers)


  return response.status(200).json({followers:followers})

})

app.post("/tags", async(request, response)=>{
  const  {tag}  = request.body
  console.log(tag)

  var tagResponse = ''

  if (tag === 'business') {
    tagResponse = tagsResponse[0]
  }

  if (tag === "photograph"){
    tagResponse = tagsResponse[1]
  }

  if (tag === "video"){
    tagResponse = tagsResponse[2]
  }

  if (tag === "music"){
    tagResponse = tagsResponse[3]
  }

  if (tag === "education"){
    tagResponse = tagsResponse[4]
  }

  if (tag === 'food'){
    tagResponse = tagsResponse[5]
  }

  if (tag === 'trip'){
    tagResponse = tagsResponse[6]
  }

  if (tag === 'events'){
    tagResponse = tagsResponse[7]
  }

  if (tag === 'games'){
    tagResponse = tagsResponse[8]
  }

  if (tag === 'artist'){
    tagResponse = tagsResponse[9]
  }

  if (tag === 'geek'){
    tagResponse = tagsResponse[10]
  }

  return response.status(200).json(tagResponse)
})

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.bxsvi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`).then(()=>{
  app.listen(3333, ()=> console.log("rodando..."))
})
.catch((err)=>console.log(err))

