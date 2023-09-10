const {default:mongosee} = require('mongoose')
const dbConnect =  ()=>{
    try {
    const conn = mongosee.connect(process.env.MONGODB_URL);
    console.log('db success')
    } catch (error) {
        console.log('db error')
    }
}
module.exports=dbConnect;