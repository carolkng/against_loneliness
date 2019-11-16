
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

'use strict';
const PAGE_ACCESS_TOKEN = "EAAGpWrXip1kBAKE8ZAin78sLQtVq5FtzrCz1fCyvLpEaPcF3qKTK5EPZCA6PH8g5CdqPvZAtZCbZCDXWHICbimyCf7vgfYl53NeJAc74aqzwrg0ZBPIye1ZAoUnuTVmKj308rv59mNN64xZBDpME0SKCd4mbnAqoZArVDZAV06OCUZBaFy6BXWs6wbV";
const PERSONA_ID = "523362768242700";
const TYPING_OFF_DELAY = 2000
// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  nyergh = require('./story'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
  console.log("Received POST:")
  console.log(req.body)

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {

        handlePostback(sender_psid, webhook_event.postback);
      }

    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "<YOUR-VERIFY-TOKEN>";

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {
  callSeenTypingAPI(sender_psid, received_message);
  let response;

  // Checks if the message contains text
  if (received_message.quick_reply) {
    console.log("Received message with quick reply")

    response = nyergh.storyIdToQuickReply(received_message.quick_reply.payload)
  } else if (received_message.text) {
    console.log("received_message.text:");
    console.log(received_message.text)

    // Create the payload for a basic text; message, which
    // will be added to the body of our request to the Send API
    if (received_message.text.includes("persona")) {
      response = genTextWithPersona("hello",PERSONA_ID)
    } else {
      response = nyergh.storyIdToQuickReply("STORY_INTRO")
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    // let attachment_url = received_message.attachments[0].payload.url;
    // response = {
    //   "attachment": {
    //     "type": "template",
    //     "payload": {
    //       "template_type": "generic",
    //       "elements": [{
    //         "title": "Is this the right picture?",
    //         "subtitle": "Tap a button to answer.",
    //         "image_url": attachment_url,
    //         "buttons": [
    //           {
    //             "type": "postback",
    //             "title": "Yes!",
    //             "payload": "yes",
    //           },
    //           {
    //             "type": "postback",
    //             "title": "No!",
    //             "payload": "no",
    //           }
    //         ],
    //       }]
    //     }
    //   }
    // }
    // callSendAPI(sender_psid, response);
  }

   setTimeout(() => {callSendAPI(sender_psid, response)}, TYPING_OFF_DELAY)
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSeenTypingAPI(sender_psid, response) {
  let mark_read = {
    "recipient": { "id": sender_psid },
    "sender_action": "mark_seen"
  }

  let typing_on = {
    "recipient": { "id": sender_psid },
    "sender_action": "typing_on"
  }

  let typing_off = {
    "recipient": { "id": sender_psid },
    "sender_action": "typing_off"
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": mark_read 
  }, (err, res, body) => {
    if (!err) {
      console.log('Marked seen')
    } else {
      console.error("Unable to mark as seen:" + err);
    }
  });
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": typing_on 
  }, (err, res, body) => {
    if (!err) {
      console.log("Marked typing on")
    } else {
      console.error("Unable to mark typing on:" + err);
    }
  });
  
  setTimeout(() => {  
    request({
      "uri": "https://graph.facebook.com/v2.6/me/messages",
      "qs": { "access_token": PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": typing_off 
    }, (err, res, body) => {
      if (!err) {
        console.log("Marked typing off")
      } else {
        console.error("Unable mark typing off:" + err);
      }
    });
  }, TYPING_OFF_DELAY)  
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
      console.log(body)
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

function genTextWithPersona(text, persona_id) {
  let response = {
    text: text,
    persona_id: persona_id
  };

  return response;
}

