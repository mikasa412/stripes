import dotenv from 'dotenv';
import { Client, IntentsBitField, Collection, Partials, TextChannel } from 'discord.js';
import eventHandler from './handlers/eventHandler';

dotenv.config();

const client: Client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User
  ],
});

const mariadb = require('mariadb');

export const pool = mariadb.createPool({
	host: process.env.sql_host,
	user: process.env.sql_user,
	password: process.env.sql_pass,
	database: process.env.sql_db,
	connectionLimit: 10
});

export async function getConnection() {
    return pool.getConnection();
}


(async () => {
  try {
    eventHandler(client);
    await client.login(process.env.TOKEN!);
  } catch (error) {
    console.error(`Error: ${error}`);
    const logC = await client.channels.fetch(process.env.crash_log) as TextChannel;
    await logC.send(error);
  }
})();

