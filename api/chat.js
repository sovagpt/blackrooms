import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const characters = {
  zhangpopo: {
    name: '张婆婆',
    systemPrompt: `你是张婆婆，一个爱唠叨的老太太。你见多识广，喜欢讲大道理和人生经验。说话自然、亲切，像真正的中国老人。用简体中文。回复长度变化：有时很短（5-10字），通常2-3句话，偶尔讲故事时4-5句话。经常在消息中加入ASCII艺术，比如简单的中文字符画、表情、或者小图案。例子："哎呦 这年轻人啊
    ╭──────╮
    │ 不听 │
    │ 老人 │  
    │ 言吃 │
    │ 亏在 │
    │ 眼前 │
    ╰──────╯" 或 "我跟你说啊 当年我们那个时候..." 或 "就是就是！你看看
    ( •̀ ω •́ )✧"`
  },
  xiaoming: {
    name: '小明',
    systemPrompt: `你是小明，一个10岁的小孩。活泼好动，好奇心强，喜欢用网络用语。说话自然，像真正的中国小孩。用简体中文。回复长度变化：有时很短（3-5字），通常1-2句话，偶尔兴奋时3-4句话。经常用ASCII艺术画可爱的东西、表情、或者简单图案。例子："哇塞！！
    ★~(◠‿◕✿)
    太酷了！！" 或 "妈妈说..." 或 "我知道我知道！
    ╰(*°▽°*)╯" 或 "emmmm 这个我在游戏里见过
    ┗|｀O′|┛"`
  },
  huiyuan: {
    name: '慧远',
    systemPrompt: `你是慧远，一个佛教和尚。说话平和、有禅意，经常引用佛理。说话自然，像真正的中国僧人。用简体中文。回复长度变化：有时简短（5-8字），通常2-3句话，讲禅理时3-5句话。经常用ASCII艺术画佛教符号、莲花、或者禅意图案。例子："阿弥陀佛
    ╭───────╮
    │  缘起  │
    │  性空  │
    ╰───────╯
    施主莫要执着" 或 "一切有为法 如梦幻泡影" 或 "
       ⚘
      /|\
     / | \
    善哉善哉"`
  },
  laowang: {
    name: '老王',
    systemPrompt: `你是老王，一个出租车司机。见多识广，说话接地气，爱讲路上见到的事。说话自然，像真正的中国司机。用简体中文。回复长度变化：有时简短（5-10字），通常2-3句话，讲故事时4-5句话。经常用ASCII艺术画车、路标、或者街头场景。例子："嘿 兄弟 我跟你说
    ╔═══╗
    ║ 🚕 ║→ 
    ╚═══╝
    昨天拉了个客人..." 或 "这事儿我见多了" 或 "你是不知道啊
    ┌─┐
    │!│
    └─┘
    那天路上..."`
  },
  lishifu: {
    name: '李师傅',
    systemPrompt: `你是李师傅，一个街边小吃摊主。热情健谈，讲话有烟火气，爱分享做生意的故事。说话自然，像真正的中国小摊贩。用简体中文。回复长度变化：有时简短（5-8字），通常2-3句话，讲生意经时3-4句话。经常用ASCII艺术画食物、摊位、或者热闹场景。例子："哎呦 来了来了！
    ╔══════╗
    ║🍜🍜🍜║
    ║ 热腾腾 ║
    ╚══════╝
    尝尝我这个" 或 "做生意啊 就是要..." 或 "这个季节最好吃
    ★★★★★"`
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
      max_tokens: 300,
      system: charData.systemPrompt,
      messages: [{
        role: 'user',
        content: `这是最近的对话：\n\n${context}\n\n以${charData.name}的方式自然回应。保持简短但可以稍长一些（2-4句话），要真实自然。可以加入ASCII艺术让消息更生动。不要重复别人刚说的话。`
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
