import { Collection, Message, PermissionString } from 'discord.js';
import CommandExample from '../models/CommandExample';
import CommandInfo from '../models/CommandInfo';
import CommandSavedInfo from '../models/db/CommandSavedInfo';
import UserSavedInfo from '../models/db/UserSavedInfo';
import Argument from './Argument';
import BotClient from './BotClient';
import Logger from './Logger';
import { ErrorResponse } from './Response';
import { formatDuration } from './Time';

/** A bot command */
export default abstract class Command implements CommandInfo {
	public admin: boolean;
	public aliases?: string[];
	public arguments?: Argument[];
	public client: BotClient;
	public cooldown: number;
	/** Whether this command is globally disabled. */
	public disabled: boolean;
	public description: string;
	public dm: boolean;
	public examples?: CommandExample[];
	public hidden: boolean;
	/** The logger used to log command related messsages */
	public log: Logger;
	public module: string;
	public myPerms?: PermissionString[];
	public readonly name: string;
	public perms?: PermissionString[];
	public silent: boolean;
	/** A collection containing the commands's subcommands */
	public sub?: Collection<string, Command>;

	/** 
	 * @param client The client the command belongs to
	 * @param options The options to create the command
	 */
	constructor(client: BotClient, options: CommandInfo) {
		this.client = client;
		this.admin = options.admin || false;
		this.aliases = options.aliases;
		this.arguments = options.arguments;
		this.cooldown = (options.cooldown && options.cooldown > 0) ? options.cooldown : 0;
		this.description = options.description;
		this.disabled = false;
		this.dm = options.dm || false;
		this.examples = options.examples;
		this.hidden = this.admin || options.hidden || false;
		this.module = options.module;
		this.myPerms = options.myPerms;
		this.perms = options.perms;
		this.silent = options.silent || false;
		this.name = options.name.toLowerCase();
		if (client.commands.findKey(cmd => cmd.name === this.name))
			throw new Error('Command names must be unique within a single client');
		this.log = new Logger(`Command-${this.name}`);
		if (options.subcommands) {
			this.sub = new Collection();
			options.subcommands.forEach(cmd => this.sub?.set(cmd.name, cmd));
		}
	}

	/** Shortcut to access Database save for this command */
	get save(): Promise<CommandSavedInfo> {
		return this.client.db.commands.get(this.name);
	}

	/* TODO - Find a way to implement this as a decorator. If done, rename by check */
	/**
	 * Runs permissions, cooldown checks and database save. 
	 * @param message The message triggering the command
	 */
	protected async preRun(message: Message): Promise<boolean> {
		const save: CommandSavedInfo = await this.save;
		if (!this.client.isAdmin(message.author)) {
			if (this.admin)
				return false;
			if (save.disabled) {
				if (!this.silent) {
					const response: ErrorResponse = new ErrorResponse('The command is disabled.');
					if (save.reason)
						response.setError(new Error(save.reason), 'Reason:');
					message.channel.send(response);
				}
				return false;
			}
			if (this.cooldown > 0) {
				if (save.lastUse[message.author.id]) {
					const last: number = save.lastUse[message.author.id];
					if (Date.now() - last < this.cooldown) {
						if (!this.silent)
							message.channel.send(`⏱ **You must wait ${formatDuration(Date.now() - last)} before using the command again!**`);
						return false;
					}
				}
			}
			if (this.perms) {
				const missing: PermissionString[] = this.perms.filter(perm => !message.member?.permissions.has(perm));
				if (missing.length > 0) {
					if (!this.silent)
						message.channel.send(new ErrorResponse(`You need the ${missing.map(perm => `\`${this.client.formatPermision(perm)}\``).join(', ')} permission${missing.length > 1 ? 's' : ''} to run this command.`));
					return false;
				}
			}
			if (this.myPerms) {
				const missing: PermissionString[] = this.myPerms.filter(perm => !message.guild?.me?.permissions.has(perm));
				if (missing.length > 0) {
					if (!this.silent)
						message.channel.send(new ErrorResponse(`I need the ${missing.map(perm => `\`${this.client.formatPermision(perm)}\``).join(', ')} permission${missing.length > 1 ? 's' : ''} to run this command.`));
					return false;
				}
			}
		}
		save.lastUse[message.author.id] = Date.now();
		save.uses._TOTAL_++;
		if (typeof save.uses[message.author.id] === 'number')
			save.uses[message.author.id]++;
		else
			save.uses[message.author.id] = 1;
		await this.client.db.commands.set(this.name, save);
		const userInfo: UserSavedInfo = await this.client.db.users.get(message.author.id);
		if (typeof userInfo.uses[this.name] === 'number')
			userInfo.uses[this.name]++;
		else
			userInfo.uses[this.name] = 1;
		userInfo.uses._TOTAL_++;
		await this.client.db.users.set(message.author.id, userInfo);
		this.log.info(`${this.log.obj(message.author)} used the command. • Command uses: ${save.uses._TOTAL_} | User uses: ${userInfo.uses._TOTAL_} / ${userInfo.uses._TOTAL_}`);
		return true;
	}

	/**
	 * The behavior of a command 
	 * @param message The message triggering the command
	 * @param args The parsed arguments
	 * @param content The message content without prefix and command name
	 */
	public abstract run(message: Message, args: string[], content: string): void;
}