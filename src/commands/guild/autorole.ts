import { GuildMember, Message, ReactionCollector, Role } from 'discord.js';
import Argument from '../../core/Argument';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import GuildSavedInfo from '../../models/db/GuildSavedInfo';

export default class extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: 'autorole',
			module: 'Guild Management',
			description: 'Automatically give a role to new members',
			perms: ['MANAGE_ROLES'],
			myPerms: ['MANAGE_ROLES'],
			examples: [
				{
					name: 'Role set',
					description: 'Set the role (here, the Member role). In large servers, you\'d prefer using the role id instead of mentionning the role, which would ping all the members having the role.',
					snippet: 'autorole @Member'
				},
				{
					name: 'Activation / Deactivation',
					description: 'Enable or disable autorole in the server.',
					snippet: 'autorole enable/disable'
				}
			],
			arguments: [
				new Argument(client, {
					key: 'role',
					type: 'role',
					required: false,
					label: 'The role to set as the autorole',
					invalidMessage: 'Please specify a valid role from this server.'
				})
			],
		});
	}

	public async run(message: Message, args: string[]): Promise<void> {
		if (!(await this.preRun(message)))
			return;
		const arg: string | null = args[0] ? args[0].toLowerCase() : null;
		const save: GuildSavedInfo = await this.client.db.guilds.get(message.guild!.id);
		if (arg) {

			/** Activation/Deactivion */
			if (arg === 'enable' || arg === 'disable') {
				const enabled: boolean = arg === 'enable';
				if (enabled && !save.autorole.role) { // Must set the role before enabling autorole
					message.channel.send('❌ Please first set an autorole before enabling it!');
					return;
				}
				save.autorole.enabled = enabled;
				save.autorole.manager = enabled ? message.author.id : undefined;
				save.autorole.warned = false;
				await this.client.db.guilds.set(message.guild!.id, save);
				message.channel.send(`✅ Successfully **${enabled ? 'enabled' : 'disabled'}** autorole in the server!`);
				return;
			}

			/* Role set */
			const role: Role | null = await this.arguments[0].get(arg, message.guild!);
			if (role) {
				const me: GuildMember = message.guild!.me!;
				const highest: Role = me.roles.highest;
				/* Role position check */
				if (role.comparePositionTo(highest) >= 0) {
					message.channel.send(`❌ This role is above or equal to my highest role (@**${highest.name}**). Please specify a lower role or move this role under my highest role.`);
					return;
				}
				/* Automatic role (booster, integration) check */
				if (role.managed) {
					message.channel.send('❌ The bot you specified appears to be either a bot role or the booster role. These roles can\'t be given, please specify another role.');
					return;
				}
				/* Database save */
				save.autorole.role = role.id;
				save.autorole.warned = false;
				save.autorole.manager = message.author.id;
				await this.client.db.guilds.set(message.guild!.id, save);

				/* User response */
				let response = `✅ The new autorole (@**${role.name}**) has successfully been set. If something goes wrong with it, you'll be warned in DMs, so please make sure I can send you DMs!`;
				if (!save.autorole.enabled)
					response += '\n⚠**The autorole is currently disabled.** If you want to enable it now, react with ✳. Else, just ignore this message.';
				const resMsg: Message = await message.channel.send(response);

				/* Activation shortcut collector */
				if (!save.autorole.enabled) {
					await resMsg.react('✳');
					const collector: ReactionCollector = resMsg.createReactionCollector((r, u) => u.id === message.author.id && r.emoji.name === '✳', { time: 15000 });
					collector.on('collect', async () => {
						await message.channel.send('✅ The autorole is now enabled.');
						save.autorole.enabled = true;
						await this.client.db.guilds.set(message.guild!.id, save);
						collector.stop();
					});
					collector.on('end', async () => {
						const split: string[] = resMsg.content.split('\n');
						resMsg.edit(`${split[0]}\n~~${split[1]}~~`); // Strikethrough text
						resMsg.reactions.removeAll();
					});
				}
				return;
			}
		}

		/* Missing / Incorrect argument handle */
		const prefix: string = save.prefix || this.client.prefix;
		const command = `${prefix}autorole`;
		let response = '';
		if (arg)
			response += 'You gave an argument but I\'m sorry, I didn\'t understand it.\n';
		response += `**Managing the autorole is simple:**\n> => **Set the role** \`${command} @role\`\n> => **Enable or disable autorole** \`${command} enable/disable\`\nMore help with \`${prefix}help autorole\``;
		await message.channel.send(response);
	}
}