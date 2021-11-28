const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const fs = require("fs");

const TOKEN = config.get('token')
const bot = new TelegramBot(TOKEN, { polling: true });
// const app = express();

async function getPriceFeed() {
  try {
    const siteUrl = 'https://coinmarketcap.com/';

    const { data } = await axios({
      method: 'GET',
      url: siteUrl,
    });

    const $ = cheerio.load(data);
    const elemSelector = '#__next > div > div.main-content > div.sc-57oli2-0.comDeo.cmc-body-wrapper > div > div:nth-child(1) > div.h7vnx2-1.bFzXgL > table > tbody > tr';

    const keys = [
      'rank',
      'name',
      'price',
      '24h',
      '7d',
      'marketCap',
      'volume',
      'circulatingSupply'
    ];

    const coinArr = [];


    $(elemSelector).each((parentIdx, parentElem) => {
      let keyIdx = 0;
      let coinObj = {};

      if (parentIdx <= 9) {

        $(parentElem).children().each((childIdx, childElem) => {

          let tdValue = $(childElem).text();

          if (keyIdx === 1 || keyIdx === 6) {
            tdValue = $('p:first-child', $(childElem).html()).text()
          }

          if (tdValue) {
            coinObj[keys[keyIdx]] = tdValue;

            keyIdx++
          }
        });

        coinArr.push(coinObj.name, coinObj.price);
      }
    });
    let botMessage = [];
    for (let i = 0; i < coinArr.length; i++) {
      botMessage.push(`${coinArr[i]}: ${coinArr[i + 1]}`);
      i++;
    }
    return botMessage;
  } catch (error) {
    console.log(error)
  }
}

bot.onText(/\/start/, async (message) => {
  const { chat: { id } } = message;
  bot.sendMessage(id, 'Введите команду "/get Имя токена", чтобы узнать цену на текущий момент');
});



bot.onText(/\/get (.+)/, async (message, [source, match]) => {
  const { chat: { id } } = message;
  const priceFeed = await getPriceFeed();
  let returnMsg = priceFeed.filter((el) => el.toLowerCase().includes(match.toLowerCase()));
  if (returnMsg.length === 0) {
    return bot.sendMessage(id, 'Укажите правильное имя токена')
  }
  bot.sendMessage(id, returnMsg.join('\n'));
});



