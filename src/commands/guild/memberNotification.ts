import { Collection, GuildMember, Message, MessageEmbed, MessageEmbedOptions, ReactionCollector, TextChannel } from 'discord.js';
import Argument from '../../core/Argument';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import { MenuEmbed } from '../../core/InteractiveEmbed';
import { ErrorResponse } from '../../core/Response';
import Subcommand from '../../core/Subcommand';
import GuildSavedInfo from '../../models/db/GuildSavedInfo';

/* welcome and bye share the exact same behavior. This neutral file prevents us from two almost identical 300 line files */


export const messageVariables: Record<string, string> = {
	'{SERVER_COUNT}': 'The amount of members in the server, including the newcomer.',
	'{SERVER_ICON}': 'The server\'s icon link. Useful for Welcome embeds',
	'{SERVER_ICON_STATIC}': 'The user\'s icon link. If the icon is a gif, the link will still point to a static image.',
	'{SERVER_NAME}': 'The name of the server',
	'{USER_AVATAR}': 'The user\'s avatar link. Useful for Welcome embeds',
	'{USER_AVATAR_STATIC}': 'The user\'s avatar link. If the avatar is a gif, the link will still point to a static image.',
	'{USER_ID}': 'The user\'s Discord ID',
	'{USER_MENTION}': 'A mention to the user',
	'{USER_NAME}': 'The user\'s name',
	'{USER_TAG}': 'The user\'s name including the 4 numbers',
};

/**
 * Replaces Welcome/Bye variables in a JSON or string
 * @param input The input to replace the variables from
 * @param member The member data to use in the variables
 */
export function replaceVariables(input: string | Record<string, unknown>, member: GuildMember): string | Record<string, unknown> {
	let str: string = typeof input === 'object' ? JSON.stringify(input) : input;
	str = str.split('{SERVER_COUNT}').join(member.guild.memberCount.toString());
	str = str.split('{SERVER_ICON}').join(member.guild.iconURL({ dynamic: true, size: 4096 }) || '');
	str = str.split('{SERVER_ICON_STATIC}').join(member.guild.iconURL({ dynamic: false, size: 4096 }) || '');
	str = str.split('{SERVER_NAME}').join(member.guild.name);
	str = str.split('{USER_AVATAR}').join(member.user.displayAvatarURL({ dynamic: true, size: 4096 }));
	str = str.split('{USER_AVATAR_STATIC}').join(member.user.displayAvatarURL({ dynamic: false, size: 4096 }));
	str = str.split('{USER_ID}').join(member.id);
	str = str.split('{USER_MENTION}').join(member.toString());
	str = str.split('{USER_NAME}').join(member.user.username);
	str = str.split('{USER_TAG}').join(member.user.tag);
	return typeof input === 'object' ? JSON.parse(str) : str;
}


export function activationSubcommand(client: BotClient, type: 'welcome' | 'bye'): Subcommand {
	const cap: string = type === 'welcome' ? 'Welcome' : 'Bye';
	return new Subcommand(['enable', 'disable'], [], async function (_context, message, _args, identifier) {
		const save: GuildSavedInfo = await client.db.guilds.get(message.guild!.id);
		const enabled: boolean = identifier === 'enable';
		if (!save[type].channel)
			return void message.channel.send(`❌ Please set a ${cap} channel with \`${save.prefix || client.prefix}${type} channel\` before enabling ${cap}!`);
		if (save[type].enabled === enabled)
			return void message.channel.send(`❌ ${cap} is already ${enabled ? 'enabled' : 'disabled'} in this server!`);
		save[type].enabled = enabled;
		await client.db.guilds.set(message.guild!.id, save);
		message.channel.send(`☑️ Sucessfully **${enabled ? 'enabled' : 'disabled'}** ${cap} Message in this server.`);
	});
}

export function channelSubcommand(client: BotClient, type: 'welcome' | 'bye'): Subcommand {
	const cap: string = type === 'welcome' ? 'Welcome' : 'Bye';
	const channelArg: Argument = new Argument(client, {
		key: 'channel',
		label: `The channel to send the ${cap} messages to.`,
		type: 'textchannel',
		required: true
	});
	return new Subcommand(['set-channel', 'channel'], [channelArg], async function (_context, message, args) {
		/* Channel validity verificator */
		async function valid(channel: TextChannel | null): Promise<boolean> {
			if (!channel) { //Occurs if: Input is neither a channel mention nor id
				message.channel.send('The channel you specified isn\'t a valid channel. It\'s either not a text channel, a channel I can\'t access or just a wrong input.');
				return false;
			}
			/* Required channel perms check */
			const perms = channel.permissionsFor(client.user!);
			if (!perms || !perms.has('SEND_MESSAGES')) {
				message.channel.send('I can\'t send messages in this channel. Please check permissions or specify another one.');
				return false;
			}
			if (!perms.has('EMBED_LINKS')) {
				if (save.welcome.type === 'embed') { // EMBED_LINKS is required if the Welcome message is an embed. To avoid errors, it's prevented
					message.channel.send(`I dont' have the \`Embed Links\` permission in this channel. Please check permissions, specify another channel or use a text ${cap} Message, not embed.`);
					return false;
				}
				/* We still warn about this permission issue even if the Welcome message is only text */
				message.channel.send(`⚠ I don't have the \`Embed Links\` permission in this server. You won't be able to use an embed ${cap} Message unless you change permission/channel.`);
			}
			return true;
		}
		/* Actual subcommand behavior */
		const save: GuildSavedInfo = await client.db.guilds.get(message.guild!.id);
		const arg: string = args[0];
		let channel: TextChannel | null = null;
		if (!arg) { // If no argument is given, the menu opens
			const embed: MessageEmbed = new MessageEmbed()
				.setTitle(`Server ${cap} Message Configuration`)
				.setDescription(`⌨ Please specify the ${cap} channel`)
				.setFooter('Type \'exit\' to close this menu.');
			const msg = await message.channel.send(embed);
			let listening = true;
			let i = 0; // The amount of inputs sent by the user is limited to 5 before the menu closes
			while (listening) {
				const response: Collection<string, Message> | undefined = await msg.channel.awaitMessages(m => m.author.id === message.author.id, { max: 1, time: 15000 });
				if (!response || !response.first()) { //Occurs if: No message was sent in 15 seconds
					msg.delete();
					return void message.channel.send('❌ Menu closed due to inactivity.');
				}
				if (response.first()?.content.toLowerCase() === 'exit') {
					/* We clear out all messages related to this command use */
					message.delete();
					response.first()?.delete();
					return void msg.delete();
				}
				channel = await channelArg.get(response.first()!.content, message.guild!);
				if (await valid(channel))
					listening = false;
				else {
					/* valid() checks validity and sends the response in case of wrong input, therefore we just have to delete the wrong input message here */
					response.first()!.delete();
					if (++i > 4) // Wrong inputs limit is set to 5
						return void message.channel.send('❌ Too many incorrect inputs, menu closed.');
				}
			}
		} else { // In case an argument was given, we don't open a menu and just stop the command if the input is wrong.
			channel = await channelArg.get(arg, message.guild!);
			if (!(await valid(channel)))
				return;
		}
		/* From here, the channel has been set */
		/* Database save */
		save[type].channel = channel!.id;
		await client.db.guilds.set(message.guild!.id, save);
		/* Success response */
		let response = `☑️ Sucessfully set ${channel} as the ${cap} channel!`;
		if (!save[type].enabled)
			response += `\n⚠**${cap} message is currently disabled.** If you want to enable it now, react with ✳. Else, just ignore this message.`;
		const resMsg: Message = await message.channel.send(response);
		/* Activation shortcut */
		if (!save[type].enabled) {
			await resMsg.react('✳');
			const collector: ReactionCollector = resMsg.createReactionCollector((r, u) => u.id === message.author.id && r.emoji.name === '✳', { time: 15000 });
			collector.on('collect', async () => {
				await message.channel.send(`☑️ ${cap} message is now enabled.`);
				save[type].enabled = true;
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

}

export function messageSubcommand(client: BotClient, type: 'welcome' | 'bye'): Subcommand {
	const cap: string = type === 'welcome' ? 'Welcome' : 'Bye';
	const messageArg: Argument = new Argument(client, {
		key: 'message',
		label: `The ${cap} Message text or embed JSON`,
		type: 'json',
		customTypeName: 'JSON or string',
		required: true,
	});
	return new Subcommand(['message', 'embed', 'value'], [messageArg], async (_context, message, _args, identifier) => {
		let content: string = (message.content.split(`${identifier}`)[1] || '').trim(); //We cut out all the command call part, which ends after the subcommand identifier.
		if (!content) { // We open a menu if no argument was given
			const variablesList = `${Object.keys(messageVariables).map(k => `\`${k}\` - ${messageVariables[k]}`).join('\n')}`;
			const embed: MessageEmbed = new MessageEmbed()
				.setTitle(`Server ${cap} Message Configuration`)
				.setDescription(`⌨ Please enter the ${cap} Message.\n\n__Available variables:__\n${variablesList}\nIf you struggle using embeds, you can generate your json [here](https://tofubot.xyz/embed-generator).`)
				.setFooter('Type \'exit\' to close this menu.');
			const msg = await message.channel.send(embed);
			const response: Collection<string, Message> = await msg.channel.awaitMessages(m => m.author.id === message.author.id, { time: 60000, max: 1 });
			if (!response || !response.first())
				return void message.channel.send('❌ Menu closed due to inactivity.');
			content = response.first()!.content;
			if (content.toLowerCase() === 'exit') {
				msg.delete();
				message.delete();
				response.first()!.delete();
				return;
			}
		}
		const save: GuildSavedInfo = await client.db.guilds.get(message.guild!.id);
		if (await messageArg.isValid(content)) {
			const json: Record<string, unknown> = await messageArg.get(content);
			if (identifier === 'message') { // The used identifier tells that the user probably wanted to set a text message, not an embed.
				message.channel.send('⚠ I detected a JSON input, do you want to use an embed Welcome Message? (yes/no)');
				const response: Collection<string, Message> | undefined = await message.channel.awaitMessages(m => m.author.id === message.author.id, { max: 1, time: 15000 });
				if (!response || !response.first()) //Occurs if: No message was sent in 15 seconds
					return void message.channel.send('❌ Menu closed due to inactivity.');
				const res: string = response.first()!.content.toLowerCase();
				if (res === 'no')
					return void message.channel.send('**Sure, the operation has been cancelled.**\n> If you don\'t want this input to be detected as a JSON object, add a \\ at the beginning!');
				else if (res !== 'yes')
					return void message.channel.send('**I\'ll consider this was a no, the operation has been cancelled.**\n> If you don\'t want this input to be detected as a JSON object, add a \\ at the beginning!');
			}
			const embedOptions: MessageEmbedOptions = replaceVariables(json, message.member!) as MessageEmbedOptions;
			try {
				await message.channel.send(`Great, here is an example of what it would look like if you just ${type === 'welcome' ? 'joined' : 'left'} the server:`, { embed: new MessageEmbed(embedOptions) });
			} catch (err) {
				const res: ErrorResponse = new ErrorResponse('An error occured, Discord couldn\'t send the message.', err, 'Discord Error message:');
				return void message.channel.send(res);
			}
			save[type].value = json;
			save[type].type = 'embed';
			await client.db.guilds.set(message.guild!.id, save);
			message.channel.send(`☑️ The new ${cap} Embed has been saved.`);
			return;
		}
		if (identifier === 'embed') {
			try {
				JSON.parse(content);
			} catch (err) {
				message.channel.send(`❌ An error occured, this input isn't a correct JSON object: \`${err.message}\`.\n> Do you want to use this as a text ${cap} Message instead? (yes/no)`);
				const response: Collection<string, Message> | undefined = await message.channel.awaitMessages(m => m.author.id === message.author.id, { max: 1, time: 15000 });
				if (!response || !response.first()) //Occurs if: No message was sent in 15 seconds
					return void message.channel.send('❌ Menu closed due to inactivity.');
				const res: string = response.first()!.content.toLowerCase();
				if (res === 'no')
					return void message.channel.send('**Sure, the operation has been cancelled.**\n> For further help you can read:\n> **Discord.js Guide - Embeds**: https://discordjs.guide/popular-topics/embeds.html\n> **Tofu\'s embed generator**: https://tofubot.xyz/embed-generator');
				else if (res !== 'yes')
					return void message.channel.send('**I\'ll consider this was a no, the operation has been cancelled.**\n> For further help you can read:\n> **Discord.js Guide - Embeds**: https://discordjs.guide/popular-topics/embeds.html\n> **Tofu\'s embed generator**: https://tofubot.xyz/embed-generator');
			}
		}
		try {
			await message.channel.send(`Great, here is an example of what it would look like if you just joined the server:\n${replaceVariables(content, message.member!)}`);
		} catch (err) {
			const res: ErrorResponse = new ErrorResponse('An error occured, Discord couldn\'t send the message.', err, 'Discord Error message:');
			return void message.channel.send(res);
		}
		save[type].value = content;
		save[type].type = 'message';
		await client.db.guilds.set(message.guild!.id, save);
		message.channel.send(`☑️ The new ${cap} Message has been saved.`);
	});
}

export function run(command: Command, type: 'welcome' | 'bye'): (message: Message) => Promise<void> {
	const cap: string = type === 'welcome' ? 'Welcome' : 'Bye';
	return async function (message: Message) {
		const save: GuildSavedInfo = await command.client.db.guilds.get(message.guild!.id);
		const enabled: boolean = save[type].enabled;
		const menu: MenuEmbed = new MenuEmbed([`**Edit the ${cap} Message text or embed**`, `**Set the ${cap} channel**`, `**__${enabled ? 'Disable' : 'Enable'}__ ${cap} Message`], {
			author: {
				name: `Server ${cap} Message Configuration`,
				iconURL: message.guild!.iconURL({ dynamic: true }) || command.client.user!.avatarURL()!,
			},
			description: `${cap} Message is currently **${enabled ? 'enabled' : 'disabled'}`,
		}, { author: undefined, description: '❌ Closed due to inactivity' });

		menu.send(message.channel, message.author);
		menu.on('1️⃣', () => {
			command.sub?.get('value')?.run(command, message, [], 'value');
			menu.collector!.stop('HANDLED');
			menu.collector!.message.delete();
		});
		menu.on('2️⃣', () => {
			command.sub?.get('set-channel')?.run(command, message, [], 'set-channel');
			menu.collector!.stop('HANDLED');
			menu.collector!.message.delete();
		});
		menu.on('3️⃣', () => {
			command.sub?.get('enable')?.run(command, message, [], (enabled ? 'disable' : 'enable'));
			menu.collector!.stop('HANDLED');
			menu.collector!.message.delete();
		});
	};
}
