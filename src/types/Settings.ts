export interface MyPluginSettings {
	mySetting: string;
	openaiApiKey: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	openaiApiKey: ''
} 