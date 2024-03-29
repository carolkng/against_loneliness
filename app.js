'use strict';
//const PAGE_ACCESS_TOKEN = "EAAGpWrXip1kBAKE8ZAin78sLQtVq5FtzrCz1fCyvLpEaPcF3qKTK5EPZCA6PH8g5CdqPvZAtZCbZCDXWHICbimyCf7vgfYl53NeJAc74aqzwrg0ZBPIye1ZAoUnuTVmKj308rv59mNN64xZBDpME0SKCd4mbnAqoZArVDZAV06OCUZBaFy6BXWs6wbV";
const PAGE_ACCESS_TOKEN = "EAACItq5CprYBALoVvrZCwrRe5sdXin6VPo9hxRRPBbcgE0kTYVnFZCZBIOBrolu1NEFpy6GVAz5P0wWS13ZBzk72R5E5LKY8an6BDzfx2XpttlAfLZA7fWTix6tPWULsgFprq3ZCSYbbZCe3O0VwWYZACZAKo4DAJ4S2jIADDZAQT9ZBwZDZD";
const PERSONA_ID = "736072903558118";
const TYPING_OFF_DELAY = 3000
const BETWEEN_MESSAGE_DELAY = 250
// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  nyergh = require('./story'),
  app = express().use(body_parser.json()); // creates express http server

var users = {}

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
  sendSeenTypingIndicators(sender_psid, received_message);
  let responses;
  let hasPersona = false;

  // Checks if the message contains text
  if (received_message.quick_reply) {
    console.log("Received message with quick reply")

    response = nyergh.storyIdToQuickReply(received_message.quick_reply.payload)
  } else if (received_message.text) {
    console.log("received_message.text: " + received_message.text);

    let next_state;
    if (sender_psid in users) {
      next_state = nyergh.nextState(users[sender_psid].state, received_message.text)
    } else {
      next_state = "GAME_INTRO"
      users[sender_psid] = {}
    }

    responses = nyergh.storyIdToReply(next_state)
    // We didn't get a valid state to move to, so we keep the current state.
    if (next_state === users[sender_psid].state) {
      let firstWord = received_message.text.split(" ")[0]
      sendTextMessage(sender_psid, {"text": `I don't know the word "${firstWord}".`})
    }
    users[sender_psid] = { "state": next_state }

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
    // sendTextMessage(sender_psid, response);
  }

  if (received_message.text.includes("persona")) {
    sendTextMessage(sender_psid, responses, TYPING_OFF_DELAY, PERSONA_ID)
  } else {
    sendTextMessage(sender_psid, responses, TYPING_OFF_DELAY, "")
  }
  console.log("sender state: " + users[sender_psid].state)
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
  sendTextMessage(sender_psid, response);
}

function sendSeenTypingIndicators(sender_psid, response) {
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

  sendMessage(mark_read, "Mark message read")
  sendMessage(typing_on, "Set typing on")
  sendMessage(typing_off, "Set typing off", TYPING_OFF_DELAY)
}

function sendTextMessage(sender_psid, responses, delay = 0, persona_id = "") {
  // Construct the message body
  let request_body;
  let count = 0;

  for (let res of responses) {
    if (persona_id === PERSONA_ID) {
      request_body = {
        "recipient": {
          "id": sender_psid
        },
        "message": res,
        "persona_id": PERSONA_ID
      }
    } else {
      request_body = {
        "recipient": {
          "id": sender_psid
        },
        "message": res,
      }
    }
    sendMessage(request_body, `Message sent text: ${res.text}`, delay + count * BETWEEN_MESSAGE_DELAY)
    count++
  }
}

function sendMessage(request_body, action_description, delay = 0) {
  // Send the HTTP request to the Messenger Platform
  setTimeout(() => {
    request({
      "uri": "https://graph.facebook.com/v2.6/me/messages",
      "qs": { "access_token": PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log(`SUCCESS: ${action_description} `)
      } else {
        console.error(`ERROR: ${action_description} ` + err);
      }
    })
  }, delay);
}

function sendTextWithPersona(sender_psid, response, persona_id) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response,
    "persona_id": persona_id
  }

  sendMessage(request_body, `Message sent text: ${response.text} w/ persona ${persona_id}`)
}


