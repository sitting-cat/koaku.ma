import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Str,
} from "@cloudflare/itty-router-openapi";
import { shortenMapModel } from "models/shortenMapModel";
import { ResponseCreator as Res } from "utils/responseCreator";
import { Logger } from "utils/logger";

export class ShortenKeyCreate extends OpenAPIRoute {
    static schema: OpenAPIRouteSchema = {
        tags: ["shortenKey"],
        summary: "Create a new shorten Url key",
        requestBody: {
            url: new Str({ example: "https://example.com" }),
            token: new Str(),
        },
        responses: {
            "200": {
                description: "Returns the created shorten key",
                schema: {
                    success: new Bool({ example: true }),
                    result: {
                        shortenKey: new Str({ example: "SW" }),
                    },
                },
            },
        },
    };

    async handle(
        request: Request,
        env: any,
        context: any,
        data: Record<string, any>
    ): Promise<Response> {
        let originUrl: string = data.body.url;
        let token: string = data.body.token;
        let logger = new Logger(env);

        const requestDataTitle = ["method", "url", "User-Agent", "Referer", "CF-Connecting-IP"];
        const requestArray = [request.method, request.url, request.headers.get("User-Agent"), request.headers.get("Referer"), request.headers.get("CF-Connecting-IP")];
        const datail: { [key: string]: string } = {};
        requestDataTitle.forEach((key, index) => {
            datail[key] = requestArray[index];
        });

        if (Res.checkOrigin(request.headers) === false) {
            const errMsg = `Forbidden: ${request.headers.get("Origin")}`;
            await logger.report("Forbidden", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "checkOrigin", 40, 403], datail);
            return await Res.p(Response.json({ success: false, error: "Forbidden" }, { status: 403 }), request.headers, env, request);
        }

        // reCaptchaのトークンを検証
        if (!token) {
            // tokenが空
            const errMsg = "Missing token";
            await logger.report("Missing token", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "handle", 50, 400], datail);
            return await Res.p(Response.json({ success: false, error: "Missing token" }, { status: 400 }), request.headers, env, request);
        }

        let recaptchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${env.RECAPTCHA_SECRET}&response=${token}`,
        });

        let recaptchaResponseJson = await recaptchaResponse.json() as { success: boolean };
        datail["recaptchaResponse"] = JSON.stringify(recaptchaResponseJson);
        if (!recaptchaResponseJson.success && request.headers.get("Origin") !== "http://127.0.0.1:8787") {
            // reCaptchaの検証に失敗
            const errMsg = `Failed to verify token: ${JSON.stringify(recaptchaResponseJson)}`;
            await logger.report("Failed to verify token", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "handle", 60, 500], datail);
            return await Res.p(Response.json({ success: false, error: "Failed to verify token" }, { status: 500 }), request.headers, env, request);
        } else if (request.headers.get("Origin") === "http://127.0.0.1:8787") {
            await logger.report("reCaptcha bypassed", "reCaptcha bypassed", Logger.WARN, ["shortenKeyCreate.ts", "handle", 60, 200], datail);
        }

        let kv: KVNamespace = env.KOAKUMA;
        // Retrieve the validated request body
        if (!originUrl) {
            // Urlが空
            const errMsg = "Missing url";
            await logger.report("Missing url", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "handle", 70, 400], datail);
            return await Res.p(Response.json({ success: false, error: "Missing url" }, { status: 400 }), request.headers, env, request);
        }
        datail["originUrl"] = originUrl;

        const model: shortenMapModel = new shortenMapModel(kv, originUrl, env);
        if (!model.isOriginalValid()) {
            // Urlが不正
            const errMsg = `Invalid url: ${originUrl}`;
            await logger.report("Invalid url", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "handle", 80, 400], datail);
            return await Res.p(Response.json({ success: false, error: "Invalid url" }, { status: 400 }), request.headers, env, request);
        }
        if (!(await model.isOriginalExist())) {
            // Url先が存在しない
            // NOTE - isOriginalExist()内でエラーを報告しているため、ここではエラーを報告しない
            return await Res.p(Response.json({ success: false, error: "Target page not found" }, { status: 400 }), request.headers, env, request);
        }
        if (!(await model.isSafetyWebsite(env))) {
            // 危険なサイト
            const errMsg = `Unsafe website: ${originUrl}`;
            await logger.report("Unsafe website", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "handle", 100, 400], datail);
            return await Res.p(Response.json({ success: false, error: "Unsafe website" }, { status: 400 }), request.headers, env, request);
        }

        let key: string = await model.generateShortenKey();
        if (!(await model.save())) {
            // 保存に失敗
            const errMsg = `Failed to save: ${key}`;
            await logger.report("Failed to save", errMsg, Logger.ERROR, ["shortenKeyCreate.ts", "handle", 110, 500], datail);
            return await Res.p(Response.json({ success: false, error: "Failed to save" }, { status: 500 }), request.headers, env, request);
        }
        datail["shortenKey"] = key;

        let res = Response.json({
            success: true,
            result: {
                shortenKey: key,
            },
        });
        await logger.report("Success", `Shorten key created`, Logger.INFO, ["shortenKeyCreate.ts", "handle", 120, 200], datail);
        return await Res.p(res, request.headers, env, request);
    }
}
