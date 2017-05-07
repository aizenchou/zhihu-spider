const request = require('request-promise-native')
// request = request.defaults({'proxy': 'http://127.0.0.1:1080'})// 走本地代理做测试
const cheerio = require('cheerio')
const config = require('../config')
const zhihuRoot = config.zhihu.root
const getQidByUrl = (url) => {
  try {
    const reg = /question\/(\d*)/
    return url.match(reg)[1]
  } catch (err) {
    return false
  }
}
module.exports = {
  failRequest (rs) {
    return {
      success: false,
      status: rs.statusCode,
      msg: rs.message
    }
  },
  async profile (cookie) {
    const options = {
      url: `https://www.zhihu.com/people/xiang-xiang-74-4-96/activities`,
      headers: {
        'Cookie': cookie,
        'Accept-Encoding': 'deflate, sdch, br'
      }
    }
    const rs = await request(options).catch(err => {
      return err
    })
    if (rs.error) {
      return this.failRequest(rs)
    }
    // const $ = cheerio.load(rs)
    // const judge = this.judgeLoad($)
    // if (!judge.success) {
    //   return judge
    // }
    // console.log(rs)
    return {
      success: true,
      data: rs
    }
  },
  judgeLoad ($) {
    if ($('#error').length) {
      return {
        success: false,
        status: 500,
        msg: 'IP被限'
      }
    } else {
      return {
        success: true
      }
    }
  },
  getCaptcha (cb) {
    const time = Date.now()
    const options = {
      encoding: null,
      url: `${zhihuRoot}/captcha.gif?r=${time}&type=login`
    }
    return request(options, (err, res, body) => {
      cb(err, res, body)
    })
  },
  async initLogin () {
    const options = {
      // url: `http://www.baidu.com`
      url: `${zhihuRoot}/#signin`
    }
    let res
    const rs = await request(options).on('response', function (response) {
      res = response
    }).catch(err => {
      return err
    })
    if (rs.error) {
      return this.failRequest(rs)
    }
    const $ = cheerio.load(rs)
    const judge = this.judgeLoad($)
    if (!judge.success) {
      return judge
    }
    return {
      headers: res.headers,
      data: {
        xsrf: $('input[name=_xsrf]').val()
      },
      success: true
    }
  },
  async getData (cookie, qid) {
    const options = {
      url: `${zhihuRoot}/question/${qid}`,
      headers: {
        'Cookie': cookie,
        'Accept-Encoding': 'deflate, sdch, br' // 不允许gzip,开启gzip会开启知乎客户端渲染，导致无法爬取
      }
    }
    const rs = await request(options).catch(err => {
      return err
    })
    if (rs.error) {
      return this.failRequest(rs)
    }
    const $ = cheerio.load(rs)
    const judge = this.judgeLoad($)
    if (!judge.success) {
      return judge
    }
    const NumberBoard = $('.NumberBoard-item .NumberBoard-value')
    return {
      success: true,
      title: $('.QuestionHeader-title').text(),
      data: {
        qid: qid,
        followers: Number($(NumberBoard[0]).text()),
        readers: Number($(NumberBoard[1]).text()),
        answers: Number($('h4.List-headerText span').text().replace(' 个回答', ''))
      }
    }
  },
  async explore (cookie, offset = 0, type = 'day') {
    const params = JSON.stringify({
      offset: offset,
      type: type
    })
    const options = {
      headers: {
        'Cookie': cookie
      },
      url: `${zhihuRoot}/node/ExploreAnswerListV2?params=${params}`
    }
    console.log(options)
    const rs = await request(options).catch(err => {
      return err
    })
    if (rs.error) {
      return this.failRequest(rs)
    }
    const $ = cheerio.load(rs)
    const judge = this.judgeLoad($)
    if (!judge.success) {
      return judge
    }
    const dataArr = []
    const qids = []
    $('.explore-feed.feed-item').each((k, el) => {
      const $el = $(el)
      const titleEl = $el.find('h2 a.question_link')
      const qid = getQidByUrl(titleEl.attr('href'))
      if (!qid) return
      const summary = $el.find('.summary')
      summary.find('img').remove()
      summary.find('.toggle-expand').remove()
      const answer = summary.html()
      const title = titleEl.text()
      qids.push(qid)
      dataArr.push({
        qid: qid,
        title: title,
        aid: $el.find('.zm-item-answer').data('atoken'),
        answer: answer,
        voters: $el.find('.js-voteCount').text(),
        comments: $el.find('.js-toggleCommentBox').text().replace(' 条评论', '')
      })
    })
    return {
      success: true,
      qids: qids,
      questions: dataArr
    }
  }
}
