// /!\ This model is still partial /!\

interface UserSavedInfo {
	balance: number,
	banned: boolean,
	uses: { [key: string]: number },
	reputation: number,
}
export default UserSavedInfo;