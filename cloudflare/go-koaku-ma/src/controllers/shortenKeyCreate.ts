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

        if (Res.checkOrigin(request.headers) === false) {
            const errMsg = `Forbidden: ${request.headers.get("Origin")}`;
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "checkOrigin", 40, 403]);
            return Res.p(Response.json({ success: false, error: "Forbidden" }, { status: 403 }), request.headers, env, request);
        }

        // reCaptchaのトークンを検証
        if (!token) {
            // tokenが空
            const errMsg = "Missing token";
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 50, 400]);
            return Res.p(Response.json({ success: false, error: "Missing token" }, { status: 400 }), request.headers, env, request);
        }

        let recaptchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${env.RECAPTCHA_SECRET}&response=${token}`,
        });

        let recaptchaResponseJson = await recaptchaResponse.json() as { success: boolean };
        if (!recaptchaResponseJson.success) {
            // reCaptchaの検証に失敗
            const errMsg = `Failed to verify token: ${JSON.stringify(recaptchaResponseJson)}`;
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 70, 500]);
            return Res.p(Response.json({ success: false, error: "Failed to verify token" }, { status: 500 }), request.headers, env, request);
        }

        let kv: KVNamespace = env.KOAKUMA;
        // Retrieve the validated request body
        if (!originUrl) {
            // Urlが空
            const errMsg = "Missing url";
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 80, 400]);
            return Res.p(Response.json({ success: false, error: "Missing url" }, { status: 400 }), request.headers, env, request);
        }

        const model: shortenMapModel = new shortenMapModel(kv, originUrl);
        if (!model.isOriginalValid()) {
            // Urlが不正
            const errMsg = `Invalid url: ${originUrl}`;
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 90, 400]);
            return Res.p(Response.json({ success: false, error: "Invalid url" }, { status: 400 }), request.headers, env, request);
        }
        if (!(await model.isOriginalExist())) {
            // Url先が存在しない
            const errMsg = `Target page not found: ${originUrl}`;
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 100, 400]);
            return Res.p(Response.json({ success: false, error: "Target page not found" }, { status: 400 }), request.headers, env, request);
        }
        if (!(await model.isSafetyWebsite(env))) {
            // 危険なサイト
            const errMsg = `Unsafe website: ${originUrl}`;
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 105, 400]);
            return Res.p(Response.json({ success: false, error: "Unsafe website" }, { status: 400 }), request.headers, env, request);
        }

        let key: string = await model.generateShortenKey();
        if (!(await model.save())) {
            // 保存に失敗
            const errMsg = `Failed to save: ${key}`;
            logger.report(errMsg, request, ["controllers/shortenKeyCreate.ts", "handle", 110, 500]);
            return Res.p(Response.json({ success: false, error: "Failed to save" }, { status: 500 }), request.headers, env, request);
        }

        let res = Response.json({
            success: true,
            result: {
                shortenKey: key,
            },
        });
        return Res.p(res, request.headers, env, request);
    }
}
