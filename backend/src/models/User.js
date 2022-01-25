import mongoose from 'mongoose'

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  confirmpassword: String,
  city:String,
  state:String,
  politic:String,
  religiosity: String,
  instagramLink: String,
  followers: Number,
  tags: Array,
  whatsapp: String,
  socialMedias: Array,
  myInfluencers: Array
})

export default User