import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { character, recentMessages } = req.body;

    if (!character || !characters[character]) {
      return res.status(400).json({ error: 'Invalid character' });
    }

    const charData = characters[character];
    const context = recentMessages.map(msg => 
      `${characters[msg.char]?.name || 'Unknown'}: ${msg.text}`
    ).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 150,
      system: charData.systemPrompt,
      messages: [{
        role: 'user',
        content: `Here's the recent conversation:\n\n${context}\n\nRespond as ${charData.name} would naturally respond. Keep it short (1-3 sentences), conversational, and authentic to your character. Don't repeat what others just said.`
      }]
    });

    const responseText = message.content[0].text;

    res.status(200).json({ 
      success: true, 
      character,
      message: responseText 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}