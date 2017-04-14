'use strict'
require('./variables')
const fs = require('fs'),
TelegramBot = require('node-telegram-bot-api'),
token = require('./token'),
bot = new TelegramBot(token,{polling:true})
var Promise = require('bluebird'),
startedDate = Date.now(),
acme = require('./acme'),
list,
fallbackmessage,
result = 0,
main_id = 0,
maxresults = 0,
page = 0

function arrayCheck (array,id) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][0] == id) {
      return i
    }
  }
}

function inlineMenu () {
  if (free_str !== '') {
    return  {
      force_replies: true,
      inline_keyboard: [
      [{ text: page.toString(), callback_data: 'zero' },
      { text: '<', callback_data: 'back' },
      { text: '>', callback_data: 'next' }],
      [{ text: reg_str, callback_data: 'reg' },
      { text: dist_str, callback_data: 'dist' },],
      [{ text: metro_str, callback_data: 'metro' },
      { text: pharm_str, callback_data: 'pharm' },],
      [{ text: 'Сбросить фильтры', callback_data: 'reset' }]
      ]
    }
  } else {
    return {
      force_replies: true,
      inline_keyboard: [
      [{ text: reg_str, callback_data: 'reg' },
      { text: dist_str, callback_data: 'dist' },],
      [{ text: metro_str, callback_data: 'metro' },
      { text: pharm_str, callback_data: 'pharm' },],
      [{ text: 'Сбросить фильтры', callback_data: 'reset' }]
      ]
    }
  }
}

function searchDrug(msg,page) {
  var options = {
    chat_id: msg.chat.id,
    message_id: main_id,
    reply_markup: inlineMenu()
  }
  return acme({
    page,
    sreg,
    dist,
    metro,
    apt_net,
    free_str
  }).then(data=>{
    list = data.pop(0) + '\n'
    var line = ''
    for (var i = result; i < data[0].length; i++) {
      for (var j = 0; j < data.length; j++) {
        line+=(data[j][i])
        if (j == (data.length-1)) {
          if ((line + list).length > 4096){
            return bot.editMessageText(list, options).catch(e => {return})
          } else {
            list+=line
            line=''
            result=i
          } 
        }
      }
      list+='\n\n'
    }
    result=-1
    return bot.editMessageText(list, options).catch(e => {return})
  }, error => {
    return bot.editMessageText('По вашему запросу ничего не найдено.', options)
  })
}

bot.on('message', function (msg) {
  if(startedDate - msg.date*1000 > 5000) {return}
  if (!msg.text) {
    return 'Я понимаю только текст.'
  } else if (msg.text.slice(0, 1) === '/') {
    if (msg.text === '/start'){
      main_id = msg.message_id+1
      bot.sendMessage(msg.chat.id,'Отправьте сообщение, чтобы начать поиск')
    }

    var cmd = msg.text.slice(1,2),
    id = msg.text.slice(2,6)
    var options = {
      chat_id: msg.chat.id,
      message_id: main_id,
      reply_markup: inlineMenu()
    }
    switch(cmd) {
      case 'r' :
        sreg = (reg_arr[arrayCheck(reg_arr,id)][0])
        reg_str = (reg_arr[arrayCheck(reg_arr,id)][1])
        bot.editMessageText(fallbackmessage,options)
      break
      case 'd' :
        dist = (dist_arr[arrayCheck(dist_arr,id)][0])
        dist_str= (dist_arr[arrayCheck(dist_arr,id)][1])
        bot.editMessageText(fallbackmessage,options)
      break
      case 'm' :
        metro = (metro_arr[arrayCheck(metro_arr,id)][0])
        metro_str = (metro_arr[arrayCheck(metro_arr,id)][1])
        bot.editMessageText(fallbackmessage,options)
      break
      case 'p' :
        apt_net = (pharm_arr[arrayCheck(pharm_arr,id)][0])
        pharm_str = (pharm_arr[arrayCheck(pharm_arr,id)][1])
        bot.editMessageText(fallbackmessage,options)
      break
      case 'default':
        bot.editMessageText('Синтаксическая ошибка', options)
    }
  } else {
    main_id = msg.message_id+1
    free_str = msg.text
    bot.sendMessage(msg.chat.id,'Выполняется поиск...')
    return searchDrug(msg,page)
  }
})

bot.on('callback_query', action => {
  var menu_id = {
    chat_id: action.message.chat.id,
    message_id: action.message.message_id
  }
  var reply_markup = {
    inline_keyboard: [
    [{ text: 'Отмена', callback_data: 'cancel' }]
    ]
  }
  if (action.data == 'cancel') {
    bot.editMessageReplyMarkup(inlineMenu(),menu_id)
    bot.editMessageText(fallbackmessage,menu_id)
  }
  if (action.data == 'zero') {
    if (page = 0) {
      return
    } else {
      page = 0
      result = 0
      var msg = action.message
      return searchDrug(msg,page)
    }
  }
  if (action.data == 'next') {
    if (result < 0){
      page++
      result = 0
    }
    var msg = action.message

    return searchDrug(msg,page)
  }
  if (action.data == 'back') {
    if (page > 0){
      page--
      result = 0
      var msg = action.message
      return searchDrug(msg,page)
    } else {
      return }
  }
  if (action.data == 'reg') {
    list = "Выберите регион:\n"
    reg_arr.forEach(function(e,i,a){
      list+= '/r' + a[i][0] + ' '+ a[i][1] + '\n'
    })
    fallbackmessage = action.message.text
    bot.editMessageReplyMarkup((reply_markup),menu_id)
    bot.editMessageText(list,menu_id)
  }
  if (action.data == 'dist') {
    list = "Выберите район:\n"
    dist_arr.forEach(function(e,i,a){
      list+= '/d' + a[i][0] + ' '+ a[i][1] + '\n'
    })
    fallbackmessage = action.message.text
    bot.editMessageReplyMarkup((reply_markup),menu_id)
    bot.editMessageText(list,menu_id)
  }
  if (action.data == 'metro') {
    list = "Выберите станцию метро:\n"
    metro_arr.forEach(function(e,i,a){
      list+= '/m' + a[i][0] + ' '+ a[i][1] + '\n'
    })
    fallbackmessage = action.message.text
    bot.editMessageReplyMarkup((reply_markup),menu_id)
    bot.editMessageText(list,menu_id)
  }
  if (action.data == 'pharm') {
    list = "Выберите аптеку:\n"
    pharm_arr.forEach(function(e,i,a){
      list+= '/p' + a[i][0] + ' '+ a[i][1] + '\n'
    })
    fallbackmessage = action.message.text
    bot.editMessageReplyMarkup((reply_markup),menu_id)
    bot.editMessageText(list,menu_id)
  }
  if (action.data == 'reset') {
    sreg = 0
    dist = 0
    metro = 0
    apt_net = 0
    reg_str = 'Выбрать регион'
    dist_str = 'Выбрать район'
    metro_str = 'Выбрать метро'
    pharm_str = 'Выбрать аптеку'

    bot.editMessageReplyMarkup(JSON.stringify(inlineMenu()),menu_id)
    .catch(e => {return})
  }
})


console.log('Server launched at', new Date())