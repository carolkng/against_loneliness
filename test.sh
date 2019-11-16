curl -X POST -H "Content-Type: application/json" -d '{
  "object": "page",
  "messaging_type": "<MESSAGING_TYPE>",
  "recipient": {
    "id": "<PSID>"
  },
  "entry": [{
    "messaging": [{
      "sender": {
        "id": "SENDER_ID"
      },
      "message": {
        "text": "hello, world!"
      }
    }]
  }]
}' "localhost:1337/webhook"
