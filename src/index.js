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
client.on('ready', (c) => {
    console.log(`✔ ${c.user.tag} is online `)
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        return;
    }

    // if(message.tag == "Joy#8375" )

    if (message.content == "hello") {
        message.reply("hello"); 
    }
    if (message.mentions.has(client.user)) {
      //  console.log(`Detected query from user: ${message.author.username}`);

      const query = message.content.replace(`<@!${client.user.id}>`, '').trim(); // Remove the bot mention from the query
      // Extract the query from the message
      const data = {
        //"model": "text-davinci-003", 
        "prompt": query,
        "temperature": 0.1,
        "max_tokens": 150,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
      };
      
      axios.post("https://api.openai.com/v1/engines/text-davinci-003/completions", data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        }
      })
        .then(response => {
          const messageResponse = response.data.choices[0].text.trim(); // Extract the response from the API
          message.channel.send(messageResponse); // Send the response to the channel
        })
        .catch(error => {
          console.error(error);
        });
    }
});
client.login(process.env.BOTOKEN);