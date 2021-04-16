import { Message } from 'discord.js';
import Argument from '../../core/Argument';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import GuildSavedInfo from '../../models/db/GuildSavedInfo';

export default class extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: 'set-prefix',
			module: 'Guild Management',
			description: 'Sets the prefix of the bot in this server.',
			perms: ['MANAGE_GUILD'],
			arguments: [
				new Argument(client, {
					key: 'prefix',
					required: true,
					type: 'string',
				})
			],
			aliases: ['prefix']
		});
	}

	public async run(message: Message, args: string[], content: string): Promise<void> {
		if (!(await this.preRun(message, args)))
			return;
		const save: GuildSavedInfo = await this.client.db.guilds.get(message.guild!.id);
		const prefix: string = save.prefix || this.client.prefix;
		if (!content) {
			let msg = `**My prefix here is \`${prefix}\`**`;
			if (message.member && message.member.hasPermission('MANAGE_GUILD'))
				msg += `\n> You can change it with \`${prefix}set-prefix <your-prefix>\``;
			message.channel.send(msg);
			return;
		}
		if (prefix === content)
			return void message.channel.send(`**My prefix is already \`${save.prefix}\` on this server.**`);

		save.prefix = content;
		await this.client.db.guilds.set(message.guild!.id, save);
		message.channel.send(`**Sucessfully set \`${save.prefix}\` as the new prefix on this server.**`);
	}
}