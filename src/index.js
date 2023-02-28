require('dotenv').config();
const { Client, IntentsBitField, ChannelType } = require('discord.js');
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

  if (state.isActive) {
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
  }

  
  else if (message.content.endsWith('.start') && message.mentions.has(client.user)) {
    try {
      const channel = message.channel;
      const threadManager = channel.threads;
      const options = {
        name: 'Private thread',
        type: ChannelType.PrivateThread
      };
      const thread = await threadManager.create({
        autoArchiveDuration: 60,
        name: `${message.author.username} Conversation`,
        type: ChannelType.PrivateThread,
        invitable: false, 
        reason: 'One-on-one conversation with the bot'
      });
  
      await thread.members.add(message.author.id); 
      await thread.members.add(client.user.id); 
  
      const prompt = 'You are now in a one-on-one conversation with the bot. Type `exit` to end the conversation.\n';
      thread.send(prompt);
  
      state.conversation.push(process.env.PRIVATE_PROMPT);
  
      const filter = (response) => response.author.id === message.author.id && response.content.toLowerCase() === 'exit';
  
      const collector = thread.createMessageCollector({ filter, time: 15000 });
      collector.on('collect', async (m) => {
        await thread.delete();
        state.isActive = false;
        const endPrompt = 'Your one-on-one conversation has ended.\n';
        message.channel.send(endPrompt);
        state.conversation.push(endPrompt);
        collector.stop();
      });
    } catch (error) {
      console.error(error);
    }
  }
  
  
  
  else if (message.mentions.has(client.user)) {
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    const prompt = message.content.replace(mentionRegex, '').trim();

    if(prompt == "exit" || prompt == ".exit"){
      state.isActive = false;
      state.prompt = '';
      message.reply("Goodbye!");  

    }

    if (state.isActive) {
      state.conversation.push(prompt);
    } else {
      state.prompt = `${process.env.PROMPT} ${prompt}\n`;
      state.conversation.push(prompt);

      state.isActive = true;
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