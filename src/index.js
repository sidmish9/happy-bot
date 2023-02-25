require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const axios = require('axios');


const client = new Client({

    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],

});

const conversationState = {};

client.once('ready', async () => {
  console.log('Ready!');
  try {
      await client.application.commands.create({
          name: 'ping',
          description: 'Replies with Pong!'
      });
  } catch (error) {
      console.error(error);
  }
});
client.on('messageCreate', async (message) => {
  if (message.author.bot) {
    return;
  }

  const userId = message.author.id;
  let state = conversationState[userId];

  if (!state) {
    state = {
      prompt: '',
      conversation: [],
      isActive: false,
    };
    conversationState[userId] = state;
  }

  if (state.isActive && message.content.toLowerCase() === 'exit') {
    // User wants to exit the conversation
    state.isActive = false;
    state.prompt = '';
    message.reply('Goodbye!');
    return;
  }

  if (state.isActive) {
    // Continue the conversation
    state.conversation.push(message.content);
    const data = {
      "prompt": state.prompt + state.conversation.join('\n'),
      "temperature": 0.1,
      "max_tokens": 150,
      "top_p": 1,
      "frequency_penalty": 0,
      "presence_penalty": 0
    };
    try {
      const response = await axios.post("https://api.openai.com/v1/engines/text-davinci-003/completions", data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });
      const messageResponse = response.data.choices[0].text.trim();
      state.conversation.push(messageResponse);
      message.reply(messageResponse);
    } catch (error) {
      console.error(error);
    }
  }else if (message.mentions.has(client.user)) {
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    const prompt = message.content.replace(mentionRegex, '').trim();

    // Check if there's an active conversation already
    if (state.isActive) {
      state.conversation.push(prompt);
    } else {
      // Start a new conversation
      state.prompt = `${process.env.PROMPT}: ${prompt}\n`;
      state.conversation.push(prompt);

      state.isActive = true;

      // Send the starter prompt to the API along with the first prompt
        const data = {
          "prompt": state.prompt,
          "temperature": 0.1,
          "max_tokens": 150,
          "top_p": 1,
          "frequency_penalty": 0,
          "presence_penalty": 0
        };
      
        try {
          const response = await axios.post("https://api.openai.com/v1/engines/text-davinci-003/completions", data, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            }
          });
          const messageResponse = response.data.choices[0].text.trim();
          state.conversation.push(messageResponse);
          message.reply(messageResponse);
          state.conversation.push(messageResponse);
        } catch (error) {
          console.error(error);
        }
      
    }
  }

  
});



client.login(process.env.BOTOKEN);