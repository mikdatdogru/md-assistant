import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from '../main';

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('OpenAI API Anahtarı')
			.setDesc('Yapay zeka özelliklerini kullanmak için OpenAI API anahtarınızı girin')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('AI Asistan')
			.setDesc('AI Asistan panelini açmak için butona tıklayın')
			.addButton(button => button
				.setButtonText('Get Started')
				.setCta()
				.onClick(() => {
					this.plugin.activateView();
				}));
	}
} 