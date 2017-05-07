const spider = require('../service/spider')
const App = require('./app')

class Profile extends App {
  async getInfo (ctx) {
    super.result(ctx, await spider.profile(ctx.authInfo.cookie))
  }
}
module.exports = new Profile()
