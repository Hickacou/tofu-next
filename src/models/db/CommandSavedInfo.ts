/** Commands related data to save in database */
interface CommandSavedInfo {
	/** Whether this command is disabled globally */
	disabled: boolean,
	/** An object storing the timestamps of all users' last use of the command, for cooldown */
	lastUse: { [key: string]: number }
	/** The reason why the command has been disabled */
	reason?: string,
	/** An object storing the amount of times all users haved used the command */
	uses: { [key: string]: number },
}
export default CommandSavedInfo;