import { Message } from 'discord.js';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import { activationSubcommand, channelSubcommand, messageSubcommand, run } from './memberNotification';

export default class extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: 'bye',
			module: 'Guild Management',
			description: 'Say bye to a leaving member with your own custom message/embed.',
			perms: ['MANAGE_MESSAGES'],
			examples: [
				{
					name: 'Bye embed',
					description: 'Set the welcome embed using JSON.',
					snippet: 'welcome embed {"title":"Farewell.","description":"{USER_NAME} has left {SEVER_NAME}."}'
				}
			],
			subcommands: [
				activationSubcommand(client, 'bye'),
				channelSubcommand(client, 'bye'),
				messageSubcommand(client, 'bye')
			]
		});
	}

	public async run(message: Message, args: string[]): Promise<void> {
		if (!(await this.preRun(message, args)))
			return;
		run(this, 'bye')(message);
	}
}