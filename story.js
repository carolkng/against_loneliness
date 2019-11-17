const Response = require('./response');
const STORY = require('./story_structure.json');

class Story {
  static storyIdToQuickReply(story_id) {
    let node = STORY[story_id];
    let quickReplies = []

    for (let response of node.responses) {
        quickReplies.push({
            title: response.text,
            payload: response.next_id
        })
    }

    return Response.genQuickReply(node.message, quickReplies);
  }

  static storyIdToReply(story_id) {
    let node = STORY[story_id]
    let response = {
        "text": node.message
    }
    return response
  }

  static nextState(currentState, messageText) {
    let node = STORY[currentState]
    for (let response of node.responses) {
        if (response.text.includes(messageText)) {
            return response.next_id
        }
    }
  }
}

module.exports = Story;