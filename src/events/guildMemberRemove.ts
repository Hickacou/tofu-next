import { Guild, GuildMember, MessageEmbed, MessageEmbedOptions, TextChannel } from 'discord.js';
import { replaceVariables } from '../commands/guild/memberNotification';
import BotClient from '../core/BotClient';
import Event from '../core/Event';
import GuildSavedInfo from '../models/db/GuildSavedInfo';

export default class extends Event {
	constructor(client: BotClient) {
		super(client, 'guildMemberRemove');
	}

	public async execute(member: GuildMember): Promise<void> {
		const guild: Guild = member.guild;
		const save: GuildSavedInfo = await this.client.db.guilds.get(guild.id);
		/* Bye Message */
		if (save.bye.enabled) {
			const channel: TextChannel = member.guild.channels.resolve(save.bye.channel!) as TextChannel;
			if (!channel)
				return;
			let sent: MessageEmbed | string;
			if (save.bye.type === 'embed')
				sent = new MessageEmbed(replaceVariables(save.bye.value as Record<string, unknown>, member) as MessageEmbedOptions);
			else
				sent = replaceVariables(save.bye.value as string, member) as string;
			try {
				channel.send(sent);
			} catch (err) { /* pass */ }
		}
	}
}