import { Message } from 'discord.js';
import BotClient from '../../core/BotClient';
import Command from '../../core/Command';
import { formatNumber } from '../../core/Utils';

export default class extends Command {
	/**  Bot's little comments on user's balance mapped by the maximum amount corresponding to the comment */
	public wealthComments: Record<any, string>;
	constructor(client: BotClient) {
		super(client, {
			name: 'balance',
			description: 'Tells you ~how much you\'re rich~ how much money is in your wallet.',
			module: 'Economy'
		});

		this.wealthComments = {
			0: 'How the hell do you have this few money?',
			10_000: 'You have no money. Get more please.',
			100_000: 'At least, you can buy some snacks with this.',
			1_000_000: 'Cool wallet, get a nice PC with that',
			10_000_000: 'I\'m seeing small wealth, I like it.',
			100_000_000: 'How rich! You please me.',
			1_000_000_000: 'Billionaire! What a flex, I\'m proud.',
			10_000_000_000: 'Do you spend sometimes?',
			100_000_000_000: 'WOW, that\'s really a lot of money.',
			1_000_000_000_000: 'Ok, you really have too much money go spend some.',
			10_000_000_000_000: 'How many times did you use daily?',
			100_000_000_000_000: 'No comment. This is a lot. Really, a lot.',
			[Infinity]: 'I just don\'t know what to say, you have too much money it\'s not reasonable.'
		};

	}

	public async run(message: Message): Promise<void> {
		if (!(await this.preRun(message)))
			return;
		const { balance }: { balance: number } = await this.client.db.users.get(message.author.id);
		let comment = '';
		Object.keys(this.wealthComments).some(i => {
			const amount: number = parseInt(i); // Object keys are always converted to strings, so we need to reparse the Integer we put in the first place
			if (balance <= amount) {
				comment = this.wealthComments[i];
				return true;
			}
		});

		message.channel.send(`> *${comment}*\n💴 You have **₩${formatNumber(balance)}** in your wallet!`);
	}
}