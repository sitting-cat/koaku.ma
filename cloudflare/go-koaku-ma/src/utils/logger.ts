import { GCPLogger } from "./gcpLogger";

const axios = require('axios');

export class Logger {
    private readonly GCPLogger: GCPLogger;
    private readonly Discord_Webhook;
    // private readonly AppricationVersion;
    private readonly Discord_Green = 5763719;
    private readonly Discord_Yellow = 16705372;
    private readonly Discord_Red = 15548997;
    private readonly Discord_Blue = 5793266;
    private readonly Icon_info = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Info_icon_002.svg/240px-Info_icon_002.svg.png";
    private readonly Icon_warn = "https://upload.wikimedia.org/wikipedia/commons/3/3a/Warning-logo.png";
    private readonly Icon_error = "https://upload.wikimedia.org/wikipedia/commons/9/95/Error-Logo.png";
    private readonly Icon_notice = "https://upload.wikimedia.org/wikipedia/commons/c/c3/Check-verde.png";

    public static readonly INFO = 0;
    public static readonly WARN = 1;
    public static readonly ERROR = 2;
    public static readonly NOTICE = 3;

    private readonly Discord_Colors = [this.Discord_Blue, this.Discord_Yellow, this.Discord_Red, this.Discord_Green];
    private readonly Discord_Levels = ["INFO", "WARN", "ERROR", "NOTICE"];
    private readonly Discord_Icons = [this.Icon_info, this.Icon_warn, this.Icon_error, this.Icon_notice];

    constructor(env: any) {
        // const { id: versionId, tag: versionTag } = env.CF_WORKER_VERSION;
        // this.AppricationVersion = versionId + "-" + versionTag;
        this.Discord_Webhook = env.DISCORD_WEBHOOK;
        this.GCPLogger = new GCPLogger(env);
    }

    async report(title: string, message: string, level: number, happen: Array<string | number>, details: { [key: string]: string } = {}) {
        title = title.length > 255 ? title.slice(0, 255) : title;
        message = message.length > 2048 ? message.slice(0, 2048) : message;

        const happenArray = {};
        if (!happen) happen = [];
        if (happen[0]) happenArray["Happen at"] = happen[0];
        if (happen[1]) happenArray["Reported by"] = happen[1];
        if (happen[2]) happenArray["Line"] = happen[2];
        if (happen[3]) happenArray["Response code"] = happen[3];

        // detailsは最大25個まで
        let detailsCount = 0;
        Object.assign(details, happenArray);
        const detailsArray = Object.keys(details).map(key => {
            if (detailsCount >= 25) return;
            detailsCount++;
            if (!key) key = "Unknown";
            if (!details[key]) details[key] = "N/A";
            return {
                "name": key.length > 256 ? key.slice(0, 256) : key,
                "value": details[key].length > 1024 ? details[key].slice(0, 1024) : details[key]
            };
        });

        let args = {
            "embeds": [
                {
                    "title": title,
                    "description": message,
                    "color": this.Discord_Colors[level],
                    "timestamp": new Date().toISOString(),
                    "footer": {
                        "text": "Koaku.ma Server Logger"
                    },
                    "author": {
                        "name": this.Discord_Levels[level],
                        "icon_url": this.Discord_Icons[level]
                    },
                    "fields": detailsArray
                }
            ]
        };

        // 総文字数は5000文字まで
        if (JSON.stringify(args).length > 5000) {
            args.embeds[0].fields = [
                {
                    "name": "Error",
                    "value": "The message is too long to send to Discord. Please check the logs on Google Cloud Platform.",
                }
            ];
            // Title, message, detailsをつなげる
            const gcpmessage = title + " - " + message + " : " + JSON.stringify(details);
            await this.GCPLogger.report(gcpmessage, happen);
        }

        await axios.post(this.Discord_Webhook, args)
            .then(async (response) => {
                if (response.status !== 204 && response.status !== 200) {
                    const errMsg = `Failed to send message to Discord: ${response.status}`;
                    console.log(errMsg);
                    await this.GCPLogger.report(errMsg, happen);
                }
                console.log(`[${this.Discord_Levels[level]}] ${title} - ${message}`);
            })
            .catch(async (error) => {
                // エラーレスポンスを文字列に
                const respData = JSON.stringify(error.response.data.embeds[0]);
                const errMsg = `Failed to send message to Discord: ${error} - ${respData}`;
                console.log(errMsg);
                await this.GCPLogger.report(errMsg, happen);
                await this.report(title, message, level, happen, details);
            });

        return true;
    }
}