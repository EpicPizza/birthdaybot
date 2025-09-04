import { ChatInputCommandInteraction, Interaction, SlashCommandBuilder } from "discord.js";
import { Command } from "commander";
import { Data, ReactionCommand, TextCommand } from "../discord";

export const data: Data[] = [
    {
        type: 'slash',
        name: 'slash-ping',
        command: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!'),
    },
    {
        type: 'text',
        name: 'text-ping',
        command: () => {
            return new Command()
                .name('ping')
                .description('Replies with Pong!');
        },
    },
    {
        type: 'reaction',
        name: 'reaction-ping',
        command: '🏓',
    }
]

export async function execute(interaction: TextCommand | ChatInputCommandInteraction | ReactionCommand) {
    await interaction.reply('Pong!');
}
