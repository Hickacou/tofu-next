import { Message } from 'discord.js';
import Argument from '../../core/Argument';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import { SuccessResponse } from '../../core/Response';

export default class extends Command {
	constructor(client: BotClient) {
		super(client, {
			admin: true,
			aliases: ['genable'],
			arguments: [
				new Argument(client, {
					key: 'name',
					label: 'The command to disable name',
					type: 'string',
					required: true,
					invalidMessage: 'Please specify a valid command name.',
					validator: (input) => client.commands.has(input)
				}),
			],
			description: 'Globally enables a command.',
			module: 'Admin',
			name: 'global-enable',
		});
	}

	public async run(message: Message, args: string[]): Promise<void> {
		if (!(await this.preRun(message)))
			return;
		if (!(await this.arguments[0].isValid(args[0]))) {
			message.channel.send(this.arguments[0].invalidMessage);
			return;
		}
		const name: string = args.shift()!.toLowerCase();
		await this.client.db.commands.merge(name, { disabled: false });
		message.channel.send(new SuccessResponse(`The command \`${name}\` has been successfully enabled.`));
	}
}