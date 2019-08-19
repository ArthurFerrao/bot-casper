const express = require('express');
const router = express.Router();

// Webhook validation
router.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});
  
  
// Message processing
router.post('/', function (req, res) {
  console.log(req.body);
  var data = req.body;

  if (data.object === 'page') {
    
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      entry.messaging.forEach(function(event) {
          if (event.message) {
            receivedMessage(event);
          }else {
            if (event.postback && event.postback.payload) {
              switch(event.postback.payload){
                case "clicou_comecar":
                  sendButtonsMessage(event.sender.id);
                  break;
                case "clicou_vermelho":
                  sendTextMessage(event.sender.id, "xau, volte sempre.");
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
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
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
        content_type:"text",
        title:"Red",
        payload:"clicou_vermelho",
          image_url:""
      },{
        content_type:"text",
        title:"Green",
        payload:"clicou_verde",
        image_url:""
      },{
        content_type:"text",
        title:"Red",
        payload:"clicou_vermelho",
          image_url:""
      },{
        content_type:"text",
        title:"Green",
        payload:"clicou_verde",
        image_url:""
      },{
        content_type:"text",
        title:"Green",
        payload:"clicou_verde",
        image_url:""
      }
    ]
  }
  };  

  callSendAPI(messageData);
}
    

module.exports = router;