import { Message } from 'discord.js';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import { activationSubcommand, channelSubcommand, messageSubcommand, run } from './memberNotification';

export default class extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: 'welcome',
			module: 'Guild Management',
			description: 'Greet a new member with your own custom message/embed.',
			perms: ['MANAGE_MESSAGES'],
			examples: [
				{
					name: 'Welcome embed',
					description: 'Set the welcome embed using JSON.',
					snippet: 'welcome embed {"title":"Welcome!","description":"Welcome to {USER_MENTION} in {SEVER_NAME}!"}'
				}
			],
			subcommands: [
				activationSubcommand(client, 'welcome'),
				channelSubcommand(client, 'welcome'),
				messageSubcommand(client, 'welcome')
			]
		});
	}

	public async run(message: Message, args: string[]): Promise<void> {
		if (!(await this.preRun(message, args)))
			return;
		run(this, 'welcome')(message);
	}
}