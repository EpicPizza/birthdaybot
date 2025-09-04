import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Data } from "../discord";
import fs from 'node:fs';
import path from 'node:path';

export const data: Data[] = [
    {
        type: 'slash',
        name: 'slash-help',
        command: new SlashCommandBuilder()
            .setName('help')
            .setDescription('Lists all available commands.'),
    },
];

export async function execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle('Help - All Commands')
        .setColor('Green');

    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    let description = '';
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (command.data) {
            const commandData: Data[] = command.data;
            for (const cmd of commandData) {
                if (cmd.type === 'slash') {
                    const slashCommand = cmd.command as SlashCommandBuilder;
                    description += `**/${slashCommand.name}**: ${slashCommand.description}\n`;
                }
            }
        }
    }
    embed.setDescription(description);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
