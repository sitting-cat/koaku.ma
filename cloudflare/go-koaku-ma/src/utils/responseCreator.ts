import { Logger } from "./logger";

export class ResponseCreator {
    // 許可オリジンリスト
    allowOriginList = [
        null,
        "https://koaku.ma",
        "https://www.koaku.ma",
        "https://koaku-ma.github.io",
    ];
    static p(response: Response, headers: Headers, env: any, req: Request): Response {
        let me = new ResponseCreator();
        if (!me.allowOriginList.includes(headers.get("Origin"))) {
            let logger = new Logger(env);
            const errMsg = `Forbidden: ${headers.get("Origin")}`;
            logger.report(errMsg, req, ["utils/responseCreator.ts", "p", 40, 403]);
            return new Response("Forbidden", { status: 403 });
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