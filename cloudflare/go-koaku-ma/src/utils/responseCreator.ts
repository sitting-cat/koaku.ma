import { Logger } from "./logger";

export class ResponseCreator {
    // 許可オリジンリスト
    allowOriginList = [
        null,
        "http://127.0.0.1:8787",
        "https://koaku.ma",
        "https://www.koaku.ma",
        "https://koaku-ma.github.io",
    ];
    reportOriginList = [
        // null,
        "http://127.0.0.1:8787"
    ]
    static async p(response: Response, headers: Headers, env: any, req: Request): Promise<Response> {
        let me = new ResponseCreator();
        let logger = new Logger(env);
        if (!me.allowOriginList.includes(headers.get("Origin"))) {
            const errMsg = `Forbidden: ${headers.get("Origin")}`;
            await logger.report("Forbidden", errMsg, Logger.ERROR, ["responseCreator.ts", "p", 40, 403]);
            return new Response("Forbidden", { status: 403 });
        } else if (me.reportOriginList.includes(headers.get("Origin"))) {
            const errMsg = `Origin check bypassed: ${headers.get("Origin")}`;
            await logger.report("Origin check bypassed", errMsg, Logger.WARN, ["responseCreator.ts", "p", 40, 403]);
        }
        response.headers.set("Access-Control-Allow-Origin", headers.get("Origin"));
        response.headers.set("Access-Control-Allow-Headers", headers.get("Access-Control-Request-Headers"));
        response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
        return response;
    }
    static checkOrigin(headers: Headers): boolean {
        let me = new ResponseCreator();
        return me.allowOriginList.includes(headers.get("Origin"));
    }
}