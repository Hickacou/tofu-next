// /!\ This model is still partial /!\

import GuildAutoRoleInfo from '../GuildAutoRoleInfo';
import MemberNotificationInfo from '../MemberNotificationInfo';

interface GuildSavedInfo {
	banned: boolean,
	bye: MemberNotificationInfo,
	prefix?: string,
	autorole: GuildAutoRoleInfo,
	welcome: MemberNotificationInfo,
}
export default GuildSavedInfo;