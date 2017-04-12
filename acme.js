'use strict'
require('./variables')
var Promise = require('bluebird'),
  request = require('request'),
  romanize = require('romanization'),
  cheerio = require('cheerio')

module.exports = opts => {
  opts = opts instanceof Object ? opts : {}
  free_str = opts.free_str
  page = opts.page
  metro = opts.metro
  sreg = opts.sreg
  apt_net = opts.apt_net
  dist = opts.dist

  var name = romanize(free_str),
  url = ('http://www.acmespb.ru/'+'trade/'+romanize(free_str)),
  form = {
    whatever: 'whatever',
    name,
    free_str,
    page,
    metro,
    sreg,
    apt_net,
    dist
  },
  postData = {
    url,
    method: 'post',
    form
  },
  drugName = [],
  drugCountry = [],
  drugPharm = [],
  drugAddress = [],
  drugDate = [],
  drugPrice = []




return new Promise ((resolve, reject) => {
  request(postData, (e, res, body) => {
    if (!e && res.statusCode !== 200) {
      e = new Error('HTTP ' + res.statusCode)
    }
    if (e) {
      return reject(e)
    }

    let $ = cheerio.load(body)

    $('.trow .cell.name').each(function(){
      drugName.push($(this).text().replace(/$/,'\n'))
    })
    $('.trow .cell.country').each(function(){
      drugCountry.push($(this).text())
    })
    $('.trow .cell.pharm').each(function(){
      drugPharm.push($(this).text().replace(/^/,' (').replace(/$/,')'))
    })
    $('.trow .cell.address').each(function(){
      drugAddress.push($(this).text().replace(/[\t\n]/g,''))
    })
    $('.trow .cell.date').each(function(){
      drugDate.push($(this).text().replace(/^/,' (').replace(/$/,')\n'))
    })
    $('.trow .cell.pricefull').each(function(){
      drugPrice.push($(this).text().replace(/$/,'ք '))
    })

    data = [drugName,drugPrice,drugDate,drugAddress,drugPharm]
    data.push($('.red').text())

    if (drugName.length > 0) {
      resolve(data) 
    } else {
      reject(red)
    }
  })
})

}


//  console.log($('#container .trow').eq(1).remove('.tocart').html())
//  console.log($('.trow .cell.name').text())
//  console.log($('.trow .cell.name').text())