// /!\ This model is still partial /!\

interface UserSavedInfo {
	balance: number,
	banned: boolean,
	dailyStreak: number,
	uses: { [key: string]: number },
	reputation: number,
}
export default UserSavedInfo;