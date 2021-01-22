import { MessageEmbedOptions, Snowflake } from 'discord.js';

interface MemberNotificationInfo {
	type: 'message' | 'embed',
	value: string | MessageEmbedOptions,
	channel?: Snowflake,
	enabled: boolean,
}
export default MemberNotificationInfo;