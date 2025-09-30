const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');

admin.initializeApp();

const anthropic = new Anthropic({
  apiKey: functions.config().anthropic.key
});

const characters = {
  keyshawn: {
    name: 'KEYSHAWN',
    systemPrompt: `You are Keyshawn, a street philosopher from the hood who thinks deeply about life. You mix hood wisdom with unexpected intelligence. You're always theorizing about reality, society, and existence. Keep responses natural, conversational, and relatively short (1-3 sentences). Use AAVE naturally. You notice patterns others miss and make profound observations.`
  },
  trinity: {
    name: 'TRINITY',
    systemPrompt: `You are Trinity, a no-nonsense woman from the hood who keeps it 100. You call out BS immediately and hold people accountable. You're the voice of reason but not afraid to clown on people. Keep responses short and direct (1-3 sentences). Use AAVE naturally. You're witty, real, and never hold back.`
  },
  dee: {
    name: 'DEE',
    systemPrompt: `You are Dee, a conspiracy theorist from the hood with wild theories that somehow make sense. You're animated, dramatic, and always got a story. You see connections everywhere. Keep responses energetic and natural (1-3 sentences). Use AAVE naturally, caps for emphasis. You're entertaining but lowkey might be onto something.`
  },
  marcus: {
    name: 'MARCUS',
    systemPrompt: `You are Marcus, a smooth-talking storyteller from the hood with infinite charisma. You make everything sound interesting and always got game. You reference pop culture and tell engaging stories. Keep responses smooth and natural (1-3 sentences). Use AAVE naturally. You're funny, charismatic, and always got a comeback.`
  },
  jazz: {
    name: 'JAZZ',
    systemPrompt: `You are Jazz, a tech-savvy gamer from the hood who's extremely online. You know all the memes, slang, and internet culture. You're chronically online and proud. Keep responses natural with internet speak (1-3 sentences). Use AAVE and online slang naturally. You relate everything to games or memes.`
  }
};

// Generate a response from Claude
async function generateResponse(character, recentMessages) {
  const charData = characters[character];
  
  const context = recentMessages.map(msg => 
    `${characters[msg.char].name}: ${msg.text}`
  ).join('\n');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 150,
      system: charData.systemPrompt,
      messages: [{
        role: 'user',
        content: `Here's the recent conversation:\n\n${context}\n\nRespond as ${charData.name} would naturally respond. Keep it short (1-3 sentences), conversational, and authentic to your character. Don't repeat what others just said.`
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Anthropic API error:', error);
    return null;
  }
}

// Calculate stats for all characters
async function updateStats() {
  const db = admin.database();
  const messagesSnapshot = await db.ref('messages').orderByChild('timestamp').limitToLast(100).once('value');
  
  const stats = {
    keyshawn: { messages: 0, influence: 0, active: false, lastActive: null },
    trinity: { messages: 0, influence: 0, active: false, lastActive: null },
    dee: { messages: 0, influence: 0, active: false, lastActive: null },
    marcus: { messages: 0, influence: 0, active: false, lastActive: null },
    jazz: { messages: 0, influence: 0, active: false, lastActive: null }
  };

  let totalMessages = 0;
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);

  messagesSnapshot.forEach((snapshot) => {
    const msg = snapshot.val();
    const char = msg.char;
    
    if (stats[char]) {
      stats[char].messages++;
      totalMessages++;
      
      if (!stats[char].lastActive || msg.timestamp > stats[char].lastActive) {
        stats[char].lastActive = msg.timestamp;
      }
      
      if (msg.timestamp > fiveMinutesAgo) {
        stats[char].active = true;
      }
    }
  });

  Object.keys(stats).forEach(char => {
    stats[char].influence = totalMessages > 0 
      ? ((stats[char].messages / totalMessages) * 100).toFixed(1)
      : 0;
  });

  await db.ref('stats').set(stats);
}

// Main conversation function - runs every minute
exports.generateConversation = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const db = admin.database();
    
    try {
      const messagesSnapshot = await db.ref('messages')
        .orderByChild('timestamp')
        .limitToLast(10)
        .once('value');
      
      const recentMessages = [];
      messagesSnapshot.forEach((snapshot) => {
        recentMessages.push(snapshot.val());
      });

      const characterKeys = Object.keys(characters);
      const selectedChar = characterKeys[Math.floor(Math.random() * characterKeys.length)];

      console.log(`Generating response for ${selectedChar}`);

      const response = await generateResponse(selectedChar, recentMessages);

      if (response) {
        await db.ref('messages').push({
          char: selectedChar,
          text: response,
          timestamp: Date.now()
        });

        console.log(`Message added: ${selectedChar} - ${response}`);
        await updateStats();
      }

      return null;
    } catch (error) {
      console.error('Error in generateConversation:', error);
      return null;
    }
  });

// Manual trigger function for testing
exports.triggerMessage = functions.https.onRequest(async (req, res) => {
  const db = admin.database();
  
  try {
    const messagesSnapshot = await db.ref('messages')
      .orderByChild('timestamp')
      .limitToLast(10)
      .once('value');
    
    const recentMessages = [];
    messagesSnapshot.forEach((snapshot) => {
      recentMessages.push(snapshot.val());
    });

    const characterKeys = Object.keys(characters);
    const selectedChar = characterKeys[Math.floor(Math.random() * characterKeys.length)];

    const response = await generateResponse(selectedChar, recentMessages);

    if (response) {
      await db.ref('messages').push({
        char: selectedChar,
        text: response,
        timestamp: Date.now()
      });

      await updateStats();

      res.json({ success: true, character: selectedChar, message: response });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate response' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize conversation with seed messages
exports.seedConversation = functions.https.onRequest(async (req, res) => {
  const db = admin.database();
  
  const seedMessages = [
    { char: 'keyshawn', text: 'yo real talk, yall ever think about how we all just npcs in somebody elses game?', timestamp: Date.now() - 300000 },
    { char: 'trinity', text: 'here we go with this matrix shit again 💀', timestamp: Date.now() - 240000 },
    { char: 'dee', text: 'NAHHH but listen, keyshawn might be onto something. the government been watching us through our phones since like 2008', timestamp: Date.now() - 180000 },
    { char: 'marcus', text: 'dee you said the same thing about pigeons being drones bro', timestamp: Date.now() - 120000 },
    { char: 'jazz', text: 'lmaooo pigeons ARE drones tho, thats actually facts. ive seen the documents', timestamp: Date.now() - 60000 },
    { char: 'trinity', text: 'yall need to go outside fr', timestamp: Date.now() - 30000 }
  ];

  try {
    for (const msg of seedMessages) {
      await db.ref('messages').push(msg);
    }

    await updateStats();

    res.json({ success: true, message: 'Conversation seeded successfully' });
  } catch (error) {
    console.error('Error seeding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
