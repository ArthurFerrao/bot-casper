const express = require('express');
const validUrl = require('valid-url');
const request = require('request');
const Noticia = require('../models/noticia.model.js');
const router = express.Router();

const defaultImg = "http://saveabandonedbabies.org/wp-content/uploads/2015/08/default.png";
const defaultUrl = "https://google.com";

// Webhook validation
router.get('/', function(req, res) {
  console.log("ENV: " , process.env.VERIFY_TOKEN);
  
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === "teste") {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});
  
  
// Message processing
router.post('/', function (req, res) {
  console.log("ENV: " , process.env.VERIFY_TOKEN);
  console.log(req.body);
  var data = req.body;

  if (data.object === 'page') {
    
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      entry.messaging.forEach(function(event) {
          if (event.message) {
            if (event.message.quick_reply) {
              getNews(event.message.quick_reply.payload,event.sender.id)
           } else if (event.message) {
            receivedMessage(event);
           }
            
          }else {
            if (event.postback && event.postback.payload) {
              console.log("ENTROU2", event.postback.payload);
              switch(event.postback.payload){
                
                case "clicou_comecar":
                  sendButtonsMessage(event.sender.id);
                  break;
              }
              
            }
          } 
      });
    });
    res.sendStatus(200);
  }
});


function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'oi':
        sendTextMessage(senderID, "Oi");
        break;
      case 'xau':
        sendTextMessage(senderID, "Xau, volte sempre.");
        break;

      default:
        sendTextMessage(senderID, "Ainda não entendo essas mensagens.");
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}
  

function sendTextMessage(recipientId, messageText) {
  
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}
  
  
function callSendAPI(messageData) {
  
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: "EAAHWoBjJpXcBAIvisJtoDxZCOZAvpJrn5goreyKLSuOpxpLglfda6diT1y0oUpJHYT1y0z1aRth0ic1oU5z2NTN0tmnNiSdvL88RovgEzJCs6qWqzegkpbHZAqkWEcDk4V97iJemZC1LD5IhzJhEVpVVG3eY5sq1gZAtqDZAyDTgZDZD" },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Sucesso ao enviar mensagem %s para destinatario %s", 
        messageId, recipientId);
    } else {
      console.error("Erro ao enviar mensagem");
      console.error(response);
      console.error(error);
    }
  });  
}

function sendButtonsMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      text: "Escolha o tipo de noticia que deseja:",
      quick_replies:[
        {
          "content_type":"text",
          "title":"Esportes",
          "payload":"esportes"
        },{
          "content_type":"text",
          "title":"Política",
          "payload":"politica"
        }, {
          "content_type":"text",
          "title":"Entretenimento",
          "payload":"entretenimento"
        }, {
          "content_type":"text",
          "title":"Famosos",
          "payload":"famosos"
        }
    ]
  }
  };  

  callSendAPI(messageData);
}
    

function genericModel(news){
  const genModel = {
      "title": news.titulo,
      "image_url":news.linkImg,
      "subtitle": news.descricao,
      "default_action":{
          "type": "web_url",
          "url": news.link,
          "messenger_extensions": "false",
          "webview_height_ratio":"tall"
      },  
      "buttons": [{
          "type":"web_url",
          "url": news.link,
          "title": "Conferir"
      }]
  };
  return genModel;
}

function genericCarrousel(genModels, id){
  

  const carrousel = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": genModels
        }
      }
    };

    let request_body = {
      "recipient": {
        "id": id
      },
      "message": carrousel
    }
    return request_body;
}


async function getNews(temaTipo, id) {
  const condicao = {tema: new RegExp(temaTipo, "i")};
  let noticias = await Noticia.find(condicao);
  console.log("NOTICIA ", noticias[0]);
  
  noticias = checkUrl(noticias);

  if (noticias.length == 0) {

      
      let quickReply = sendButtonsMessage(id);
      await sendTextMessage(id, "Sinto muito, mas não temos noticias disponiveis sobre esse tópico, por favor selecione uma das outras categorias abaixo para eu te mostrar noticias sobre elas!");
      callSendAPI(quickReply);

       
  } else {
      let genModels = []
  
      noticias.forEach(notice => {
          let model = genericModel(notice);
          genModels.push(model)
      })
  
      const carrousel = genericCarrousel(genModels, id);
  
      callSendAPI(carrousel);
  }

}

function checkUrl(news) {
  let filteredNotices = [];

  news.forEach(notice => {
          if (!validUrl.isUri(notice.link)) {
              notice.link = defaultUrl;
          }
          if (!validUrl.isUri(notice.image)) {
              notice.image = defaultImg;
          }
          
      filteredNotices.push(notice);
  })

  return filteredNotices;
}


module.exports = router;