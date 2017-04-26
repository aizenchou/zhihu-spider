const service = require('../service/question')
const App = require('./app')
class Question extends App {
  async create (ctx) {
    const { qid, title } = ctx.request.body
    if (!qid && !title) {
      super.error(ctx, '别瞎填')
      return
    }
    ctx.body = await service.add(ctx, qid)
  }
}
module.exports = new Question()
