import mongoose from 'mongoose'

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  confirmpassword: String,
  city:String,
  politic:String,
  instagramLink: String,
  followers: Number,
  tags: Array,
  whatsapp: String,
  socialMedias: Array
})

export default User