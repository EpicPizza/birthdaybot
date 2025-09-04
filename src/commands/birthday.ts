import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Data } from "../discord";
import { firebaseAdmin } from "../firebase";

export const data: Data[] = [
    {
        type: 'slash',
        name: 'slash-set_birthday',
        command: new SlashCommandBuilder()
            .setName('set_birthday')
            .setDescription('Sets your birthday.')
            .addIntegerOption(option =>
                option.setName('month')
                    .setDescription('The month of your birthday')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(12))
            .addIntegerOption(option =>
                option.setName('day')
                    .setDescription('The day of your birthday')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(31)),
    },
    {
        type: 'slash',
        name: 'slash-reset_birthday',
        command: new SlashCommandBuilder()
            .setName('reset_birthday')
            .setDescription('Removes your birthday from the list.'),
    },
    {
        type: 'slash',
        name: 'slash-show_birthdate',
        command: new SlashCommandBuilder()
            .setName('show_birthdate')
            .setDescription("Gets your birthday if you already have one set."),
    },
    {
        type: 'slash',
        name: 'slash-next',
        command: new SlashCommandBuilder()
            .setName('next')
            .setDescription("Lists the closest birthdate to the current date."),
    },
    {
        type: 'slash',
        name: 'slash-list',
        command: new SlashCommandBuilder()
            .setName('list')
            .setDescription("Lists all birthday entries."),
    },
];

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand()) return;

    switch (interaction.commandName) {
        case 'set_birthday': {
            const month = interaction.options.getInteger('month');
            const day = interaction.options.getInteger('day');

            if (!month || !day) {
                await interaction.reply({ content: 'You must provide a month and a day.', ephemeral: true });
                return;
            }

            // Validate date
            const date = new Date();
            date.setFullYear(2000, month - 1, day); //use a leap year to validate
            if (date.getMonth() !== month - 1) {
                await interaction.reply({ content: 'Invalid date provided.', ephemeral: true });
                return;
            }

            const db = firebaseAdmin.getFirestore();
            await db.collection('birthdays').doc(interaction.user.id).set({
                month,
                day,
            });

            await interaction.reply({ content: `Your birthday has been set to ${month}/${day}.`, ephemeral: true });
            break;
        }
        case 'reset_birthday': {
            const db = firebaseAdmin.getFirestore();
            await db.collection('birthdays').doc(interaction.user.id).delete();
            await interaction.reply({ content: 'Your birthday has been removed from the list.', ephemeral: true });
            break;
        }
        case 'show_birthdate': {
            const db = firebaseAdmin.getFirestore();
            const doc = await db.collection('birthdays').doc(interaction.user.id).get();

            if (doc.exists) {
                const data = doc.data();
                if (data) {
                    await interaction.reply({ content: `Your birthday is set to ${data.month}/${data.day}.`, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: 'You have not set a birthday yet.', ephemeral: true });
            }
            break;
        }
        case 'next': {
            const db = firebaseAdmin.getFirestore();
            const snapshot = await db.collection('birthdays').get();

            if (snapshot.empty) {
                await interaction.reply({ content: 'No birthdays are set in this server.', ephemeral: true });
                return;
            }

            const now = new Date();
            let nextBirthday: { date: Date, userId: string } | null = null;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const { month, day } = data;
                const userId = doc.id;

                let birthdayThisYear = new Date(now.getFullYear(), month - 1, day);
                if (birthdayThisYear < now) {
                    birthdayThisYear.setFullYear(now.getFullYear() + 1);
                }

                if (!nextBirthday || birthdayThisYear < nextBirthday.date) {
                    nextBirthday = { date: birthdayThisYear, userId: userId };
                }
            }

            if (nextBirthday) {
                const user = await interaction.client.users.fetch(nextBirthday.userId);
                await interaction.reply(`The next birthday is ${user.username}'s on ${nextBirthday.date.getMonth() + 1}/${nextBirthday.date.getDate()}.`);
            } else {
                await interaction.reply({ content: 'Could not determine the next birthday.', ephemeral: true });
            }
            break;
        }
        case 'list': {
            const db = firebaseAdmin.getFirestore();
            const snapshot = await db.collection('birthdays').get();

            if (snapshot.empty) {
                await interaction.reply({ content: 'No birthdays are set in this server.', ephemeral: true });
                return;
            }

            let message = 'Here are all the birthdays:\n';
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const user = await interaction.client.users.fetch(doc.id);
                message += `- ${user.username}: ${data.month}/${data.day}\n`;
            }

            await interaction.reply(message);
            break;
        }
    }
}
