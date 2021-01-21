// /!\ This model is still partial /!\

import GuildAutoRoleInfo from '../GuildAutoRoleInfo';

interface GuildSavedInfo {
	banned: boolean,
	prefix?: string,
	autorole: GuildAutoRoleInfo
}
export default GuildSavedInfo;