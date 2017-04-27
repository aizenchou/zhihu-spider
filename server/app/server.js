const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const cors = require('koa2-cors')
const router = require('./router')
const config = require('./config')

const app = new Koa()

// db start
const {host, database, port} = config.db
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.connect(host, database, port)

// 跨域
app.use(cors())

app.use(bodyParser())

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)
