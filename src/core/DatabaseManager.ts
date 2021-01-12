import Keyv from 'keyv';
import CommandSavedInfo from '../models/db/CommandSavedInfo';
import GuildSavedInfo from '../models/db/GuildSavedInfo';
import UserSavedInfo from '../models/db/UserSavedInfo';

class ExtendedKeyv<TValue = any> extends Keyv<TValue> {
	/** The default value to set for an undefiend key */
	public default: TValue;

	/**
	 * @param def The default value to set for an undefiend key
	 * @param opts The Keyv instanciation options
	 */
	constructor(def: TValue, opts?: Keyv.Options<TValue>) {
		super(opts);
		this.default = def;
	}

	/** Returns the value. */
	public async get(key: string): Promise<TValue> {
		const value: TValue = (await super.get(key))!;
		if (typeof value === 'undefined')
			return this.default;
		const missing: string[] = Object.keys(this.default).filter(k => !Object.keys(value).includes(k));
		if (missing.length == 0)
			return value;
		return { ...this.default, ...value };

	}
}

/**  Manages the Keyv connections to database */
export default class DatabaseManager {
	/** Commands related data */
	public commands: ExtendedKeyv<CommandSavedInfo>;
	/** Guilds related data */
	public guilds: ExtendedKeyv<GuildSavedInfo>;
	/** Users related data */
	public users: ExtendedKeyv<UserSavedInfo>;
	constructor(uri?: string) {
		this.commands = new ExtendedKeyv({
			disabled: false,
			lastUse: {},
			uses: { '_TOTAL_': 0 },
		}, params('commands', uri));
		this.guilds = new ExtendedKeyv({
			banned: false
		}, params('users', uri));
		this.users = new ExtendedKeyv({
			balance: 0,
			banned: false,
			uses: { '_TOTAL_': 0 },
			reputation: 0,
		}, params('users', uri));
	}
}

function params(name: string, uri?: string) {
	return {
		uri: uri || 'sqlite://../db.sqlite',
		namespace: name,
	};
}