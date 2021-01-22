// /!\ This model is still partial /!\

import GuildAutoRoleInfo from '../GuildAutoRoleInfo';
import MemberNotificationInfo from '../MemberNotificationInfo';

interface GuildSavedInfo {
	banned: boolean,
	prefix?: string,
	autorole: GuildAutoRoleInfo,
	welcome: MemberNotificationInfo,
}
export default GuildSavedInfo;