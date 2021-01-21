import { Snowflake } from 'discord.js';

interface GuildAutoRoleInfo {
	role?: Snowflake,
	enabled: boolean,
	manager?: Snowflake,
	warned: boolean,
}
export default GuildAutoRoleInfo;