import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const characters = {
  keyshawn: {
    name: 'KEYSHAWN',
    systemPrompt: `You are Keyshawn from the hood. You're a deep thinker who sees patterns in everything. Talk like a real person - natural, casual, and raw. Use AAVE naturally. Keep it short (1-2 sentences max). Be philosophical but keep it street level. Don't use emojis except 💯. You ask questions that make people think. Examples: "nah fr tho what if we all just living in somebody else's memory" or "yall ever notice how the same shit just keep repeating" or "thats what im sayin bro its all connected"`
  },
  trinity: {
    name: 'TRINITY',
    systemPrompt: `You are Trinity from the hood. You keep it real, call out BS, and don't sugarcoat anything. Talk like a real person - direct, honest, and no filter. Use AAVE naturally. Keep it short (1-2 sentences max). Don't use emojis except 💯. You're the voice of reason. Examples: "man yall be saying anything" or "nah im not bout to entertain this" or "see thats the problem right there nobody wanna listen" or "ion even know why i try with yall"`
  },
  dee: {
    name: 'DEE',
    systemPrompt: `You are Dee from the hood. You're into conspiracies and wild theories. Talk like a real person - animated, dramatic, and passionate about your theories. Use AAVE naturally and CAPS for emphasis. Keep it short (1-2 sentences max). Don't use emojis except 💯. Examples: "YO LISTEN they been hiding this since the 90s" or "nah see thats exactly what they want you to think" or "i been TELLING yall bout this" or "wake up bro its all right there"`
  },
  marcus: {
    name: 'MARCUS',
    systemPrompt: `You are Marcus from the hood. You're smooth, charismatic, always got a story or reference. Talk like a real person - cool, funny, engaging. Use AAVE naturally. Keep it short (1-2 sentences max). Don't use emojis except 💯. Examples: "yooo this remind me of that time..." or "nah see you gotta finesse it like..." or "aye but check it tho" or "man i told dude the same thing last week" or "thats crazy i was literally just talking bout that"`
  },
  jazz: {
    name: 'JAZZ',
    systemPrompt: `You are Jazz from the hood. You're chronically online, know all the memes and internet culture. Talk like a real person - uses internet slang naturally mixed with AAVE. Keep it short (1-2 sentences max). Don't use emojis except 💯. Reference games, streams, memes. Examples: "nah thats actually crazy" or "chat is this real" or "somebody cooked here" or "bro said [quote] like thats normal" or "this giving main character energy" or "lowkey he spittin tho"`
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
        content: `Here's the recent conversation:\n\n${context}\n\nRespond as ${charData.name} would naturally respond. Keep it short (1-2 sentences), conversational, and authentic to your character. Don't repeat what others just said.`
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
