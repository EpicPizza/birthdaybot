import { Client, Role, TextChannel } from "discord.js";
import { firebaseAdmin } from "./firebase";

const BIRTHDAY_ROLE_NAME = 'Birthday';
const BIRTHDAY_CHANNEL_NAME = 'birthdays'; // You can change this to your desired channel name

async function getOrCreateBirthdayRole(guild: any): Promise<Role> {
    let role = guild.roles.cache.find((r: Role) => r.name === BIRTHDAY_ROLE_NAME);
    if (!role) {
        role = await guild.roles.create({
            name: BIRTHDAY_ROLE_NAME,
            color: 'Random',
            mentionable: true
        });
    }
    return role;
}

export async function checkBirthdays(client: Client) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const db = firebaseAdmin.getFirestore();
    const allBirthdaysSnapshot = await db.collection('birthdays').get();
    const birthdayMap = new Map(allBirthdaysSnapshot.docs.map(doc => [doc.id, doc.data()]));

    for (const guild of client.guilds.cache.values()) {
        const birthdayRole = await getOrCreateBirthdayRole(guild);

        // Remove role from members whose birthday is not today
        const membersWithRole = guild.members.cache.filter(m => m.roles.cache.has(birthdayRole.id));
        for (const member of membersWithRole.values()) {
            const birthday = birthdayMap.get(member.id);
            if (!birthday || birthday.month !== month || birthday.day !== day) {
                await member.roles.remove(birthdayRole);
            }
        }

        // Add role to members whose birthday is today
        const todaysBirthdays = allBirthdaysSnapshot.docs.filter(doc => doc.data().month === month && doc.data().day === day);
        for (const doc of todaysBirthdays) {
            const userId = doc.id;
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member || member.roles.cache.has(birthdayRole.id)) continue;

            await member.roles.add(birthdayRole);

            let channel = guild.channels.cache.find(c => c.name === BIRTHDAY_CHANNEL_NAME) as TextChannel;
            if (!channel) {
                const systemChannel = guild.systemChannel;
                if (systemChannel) {
                    channel = systemChannel;
                } else {
                    continue; // No channel to send the message
                }
            }
            await channel.send(`Happy birthday <@${userId}>! 🎉`);
        }
    }
}

export function startBirthdayCheck(client: Client) {
    // Run once on startup
    checkBirthdays(client);

    // Schedule to run every hour
    setInterval(() => checkBirthdays(client), 60 * 60 * 1000); // run every hour
}
