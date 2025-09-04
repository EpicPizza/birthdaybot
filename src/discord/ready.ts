import { ActivityType, Client, ClientEvents, Events } from "discord.js";
import { startBirthdayCheck } from "../birthday-checker";
import client from "./client";

export async function clientReadyHandler(...[readyClient]: ClientEvents[Events.ClientReady]) {
    console.log("Bot is ready!");

    readyClient.user?.setActivity({ type: ActivityType.Watching, name: "for commands" });

    setInterval(() => {
        readyClient.user?.setActivity({ type: ActivityType.Watching, name: "for commands" });
    }, 60000);

    startBirthdayCheck(readyClient);
}
