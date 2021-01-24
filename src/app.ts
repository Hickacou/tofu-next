import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '../.env' });
import BotClient from './core/BotClient';
const client: BotClient = new BotClient({
	admins: process.env.ADMINS?.split(',').filter(id => /(\d){17,19}/.test(id)),
	owner: process.env.OWNER!,
	prefix: process.env.GLOBAL_PREFIX!,
	restTimeOffset: 0,
	token: process.env.DISCORD_TOKEN!,
	test: process.env.TEST === 'true'
});

client.start();