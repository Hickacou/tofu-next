import { Message } from 'discord.js';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import { formatNumber } from '../../core/Utils';
import CommandSavedInfo from '../../models/db/CommandSavedInfo';
import UserSavedInfo from '../../models/db/UserSavedInfo';

export default class extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: 'daily',
			cooldown: 86400000, // = 24 hours
			description: 'Gives you ₩100,000 or more everyday. Keep your daily streak up to earn more & more money everyday!\nYou can make a maximum of ₩3,000,000 per day.',
			module: 'Economy'
		});
	}
	/**
	 * Has the same behavior as Command#preRun but returns the CommandSavedInfo before altering it.
	 * If Command#preRun returns `false`, this returns a Promise<undefined>
	 */
	private async _preRun(message: Message): Promise<CommandSavedInfo | undefined> {
		const preSave: CommandSavedInfo = await this.save;
		if (await super.preRun(message))
			return preSave;
	}

	public async run(message: Message): Promise<void> {
		const preSave: CommandSavedInfo | undefined = await this._preRun(message);
		if (!preSave)
			return;
		/* The last use could be undefined, in this case we get 'NaN > Number', which will return false and set the streak to 1. Therefore we can allow this type jamming */
		const preseverved: boolean = this.cooldown * 2 > Date.now() - preSave.lastUse[message.author.id]; // Whether the daily streak has been maintained
		const userSave: UserSavedInfo = await this.client.db.users.get(message.author.id);
		userSave.dailyStreak = preseverved ? userSave.dailyStreak + 1 : 1;
		this.log.info(`Streak for ${this.log.obj(message.author)} : ${userSave.dailyStreak}`);
		const earnings: number = Math.min(100000 * userSave.dailyStreak, 3000000); // Maximum earnings at once: 3,000,000. We take the minimum out of the calculated amount and the max amount.
		userSave.balance += earnings;
		const msg = preseverved
			? `💴 **₩${formatNumber(earnings)}** right to your pocket!\n> **Streak up! \`${userSave.dailyStreak}\`**\n*Cya tomorrow, I hope~*`
			: `> It's been more than 48 hours since your last daily, I'm forced to reset your streak to 1...\n💴 **₩${formatNumber(earnings)}** right to your pocket!\n*Cya tomorrow for real this time!*`;
		message.channel.send(msg);
		this.client.db.users.set(message.author.id, userSave);
	}
}