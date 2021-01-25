import { Guild, GuildMember, MessageEmbed, MessageEmbedOptions, Role, TextChannel } from 'discord.js';
import { replaceVariables } from '../commands/guild/memberNotification';
import BotClient from '../core/BotClient';
import Event from '../core/Event';
import GuildSavedInfo from '../models/db/GuildSavedInfo';

export default class extends Event {
	constructor(client: BotClient) {
		super(client, 'guildMemberAdd');
	}

	public async execute(member: GuildMember): Promise<void> {
		const guild: Guild = member.guild;
		const save: GuildSavedInfo = await this.client.db.guilds.get(guild.id);
		/* Guild Autorole */
		if (save.autorole.enabled && save.autorole.role) { // Must be enabled and have a Role set
			try { // What can go wrong: Deleted role, Permission issues
				const role: Role | null = await guild.roles.fetch(save.autorole.role || 'incorrect snowflake to trigger error');
				await member.roles.add(role!);
			} catch (err) {
				if (!save.autorole.warned) {
					let manager: GuildMember;
					try { // What can go wrong: Manager has left the server, therefore they can't be fetched, or the bot can't DM them.
						manager = await guild.members.fetch(save.autorole.manager!);
						manager.send(`An error occured when I tried to assign ${member} the autorole in **${guild.name}**! So as not to disturb you, I will not DM you anymore if such an issue occurs again, so you should check what is happening as soon as possible!\n**You can check whether**:\n - I still have the \`Manage Roles\` permission\n - I can manage the autorole, so if it is still under the role granting me the \`Manage Roles\` permission, and if it is not a role generated and managed automatically (booster and bot roles)\n - The auto role still exists and has not been deleted\n\nGood luck!`);
					} catch (err) { /* pass */ }
				}
				/* Warn save */
				save.autorole.warned = false;
				await this.client.db.guilds.set(guild.id, save);
			}
		}
		/* Welcome Message */
		if (save.welcome.enabled) {
			const channel: TextChannel = member.guild.channels.resolve(save.welcome.channel!) as TextChannel;
			if (!channel)
				return;
			let sent: MessageEmbed | string;
			if (save.welcome.type === 'embed')
				sent = new MessageEmbed(replaceVariables(save.welcome.value as Record<string, unknown>, member) as MessageEmbedOptions);
			else
				sent = replaceVariables(save.welcome.value as string, member) as string;
			try {
				channel.send(sent);
			} catch (err) { /* pass */ }
		}
	}
}