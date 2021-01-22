import { Message, ReactionCollector, TextChannel } from 'discord.js';
import Argument from '../../core/Argument';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import Subcommand from '../../core/Subcommand';
import GuildSavedInfo from '../../models/db/GuildSavedInfo';


export default class extends Command {
	constructor(client: BotClient) {
		const activationSubCommand = new Subcommand(['enable', 'disable'], [], async function (_context, message, _args, identifier) {
			const save: GuildSavedInfo = await client.db.guilds.get(message.guild!.id);
			const enabled: boolean = identifier === 'enable';
			if (!save.welcome.channel)
				return void message.channel.send(`Please set a welcome channel with \`${save.prefix || client.prefix}welcome channel\` before enabling new members welcoming!`);
			if (save.welcome.enabled === enabled)
				return void message.channel.send(`Welcome is already ${enabled ? 'enabled' : 'disalbed'} in this server!`);
			save.welcome.enabled = enabled;
			await client.db.guilds.set(message.guild!.id, save);
			message.channel.send(`Sucessfully ${enabled ? 'enabled' : 'disabled'} welcome in this server.`);
		});
		const channelArg: Argument = new Argument(client, {
			key: 'channel',
			label: 'The channel to send the welcome messages to.',
			type: 'textchannel',
			required: true
		});
		const channelSubCommand = new Subcommand(['set-channel', 'channel'], [channelArg], async function (_context, message, args) {
			const save: GuildSavedInfo = await client.db.guilds.get(message.guild!.id);
			const arg: string = args[0];
			if (!arg)
				return void message.channel.send('Please specify a channel by mentionning it or giving its id.');
			const channel: TextChannel | null = await channelArg.get(arg, message.guild!);
			if (!channel)
				return void message.channel.send(`The channel you specified (${arg}) isn't a valid channel. It's either not a text channel, a channel I can't access or just a wrong input.`);
			const perms = channel.permissionsFor(client.user!);
			if (!perms || !perms.has('SEND_MESSAGES'))
				return void message.channel.send('I can\'t send messages in this channel. Please check permissions or specify another one.');
			if (!perms.has('EMBED_LINKS')) {
				if (save.welcome.type === 'embed')
					return void message.channel.send('I dont\' have the `Embed Links` permission in this channel. Please check permissions, specify another channel or change welcome type to \'message\'.');
				message.channel.send('⚠ I don\'t have the `Embed Links` permission in this server. You won\'t be able to use welcome embeds unless you change permission/channel.');
			}
			save.welcome.channel = channel.id;
			await client.db.guilds.set(message.guild!.id, save);
			let response = `✅ Sucessfully set ${channel} as the welcome channel!`;
			if (!save.welcome.enabled)
				response += '\n⚠**Welcome message is currently disabled.** If you want to enable it now, react with ✳. Else, just ignore this message.';
			const resMsg: Message = await message.channel.send(response);
			if (!save.welcome.enabled) {
				await resMsg.react('✳');
				const collector: ReactionCollector = resMsg.createReactionCollector((r, u) => u.id === message.author.id && r.emoji.name === '✳', { time: 15000 });
				collector.on('collect', async () => {
					await message.channel.send('✅ Welcome message is now enabled.');
					save.welcome.enabled = true;
					await client.db.guilds.set(message.guild!.id, save);
					collector.stop();
				});
				collector.on('end', async () => {
					const split: string[] = resMsg.content.split('\n');
					resMsg.edit(`${split[0]}\n~~${split[1]}~~`); // Strikethrough text
					resMsg.reactions.removeAll();
				});
			}
		});


		super(client, {
			name: 'welcome',
			module: 'Guild Management',
			description: 'Greet a new member with your own custom message/embed.',
			perms: ['MANAGE_MESSAGES'],
			examples: [
				{
					name: 'Guided setup',
					description: 'Let the bot guide you with setting up the welcome message in your server.',
					snippet: 'welcome setup'
				},
				{
					name: 'Welcome embed',
					description: 'Set the welcome embed using JSON.',
					snippet: 'welcome set-embed {"title":"Welcome!","description":"Welcome to {USER_MENTION} in {SEVER_NAME}!"}'
				},
				{
					name: 'Set the channel',
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
			subcommands: [
				activationSubCommand,
				channelSubCommand
			]
		});
	}

	public async run(message: Message, args: string[]): Promise<void> {
		if (!(await this.preRun(message, args)))
			return;
		message.channel.send('woop gang lol');
	}
}