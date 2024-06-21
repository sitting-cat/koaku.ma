import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Str,
} from "@cloudflare/itty-router-openapi";
import { shortenMapModel } from "models/shortenMapModel";
import { ResponseCreator as Res } from "utils/responseCreator";

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

        // reCaptchaのトークンを検証
        if (!token) {
            // tokenが空
            return Res.p(Response.json({ success: false, error: "Missing token" }, { status: 400 }), request.headers);
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
            return Res.p(Response.json({ success: false, error: "Failed to verify token" }, { status: 500 }), request.headers);
        }

        let kv: KVNamespace = env.KOAKUMA;
        // Retrieve the validated request body
        if (!originUrl) {
            // Urlが空
            return Res.p(Response.json({ success: false, error: "Missing url" }, { status: 400 }), request.headers);
        }

        const model: shortenMapModel = new shortenMapModel(kv, originUrl);
        if (!model.isOriginalValid()) {
            // Urlが不正
            return Res.p(Response.json({ success: false, error: "Invalid url" }, { status: 400 }), request.headers);
        }
        if (!(await model.isOriginalExist())) {
            // Url先が存在しない
            return Res.p(Response.json({ success: false, error: "Target page not found" }, { status: 400 }), request.headers);
        }

        let key: string = await model.generateShortenKey();
        if (!(await model.save())) {
            // 保存に失敗
            return Res.p(Response.json({ success: false, error: "Failed to save" }, { status: 500 }), request.headers);
        }

        let res = Response.json({
            success: true,
            result: {
                shortenKey: key,
            },
        });
        return Res.p(res, request.headers);
    }
}
