import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path,
    Str
} from "@cloudflare/itty-router-openapi";
import { shortenMapModel } from "models/shortenMapModel";
import { HashGenerator } from "utils/hashGenerator";
import { ResponseCreator as Res } from "utils/responseCreator";
import { Logger } from "utils/logger";

export class ShortenKeyFetch extends OpenAPIRoute {
    static schema: OpenAPIRouteSchema = {
        tags: ["shortenKey"],
        summary: "Get a original url by shorten key",
        parameters: {
            key: Path(new Str({ example: "SW" })),
        },
        responses: {
            "200": {
                description: "Returns a original Url if found",
                schema: {
                    success: new Bool({ example: true }),
                    result: {
                        originUrl: new Str({ example: "https://example.com" }),
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
        let key: string = data.params.key;
        let kv: KVNamespace = env.KOAKUMA;
        let hashGenerator = new HashGenerator();
        let logger = new Logger(env);

        const requestDataTitle = ["method", "url", "User-Agent", "Referer", "CF-Connecting-IP"];
        const requestArray = [request.method, request.url, request.headers.get("User-Agent"), request.headers.get("Referer"), request.headers.get("CF-Connecting-IP")];
        const datail: { [key: string]: string } = {};
        requestDataTitle.forEach((key, index) => {
            datail[key] = requestArray[index];
        });

        if (Res.checkOrigin(request.headers) === false) {
            const errMsg = `Forbidden: ${request.headers.get("Origin")}`;
            logger.report("Forbidden", errMsg, Logger.ERROR, ["shortenKeyFetch.ts", "checkOrigin", 40, 403], datail);
            return Res.p(Response.json({ success: false, error: "Forbidden" }, { status: 403 }), request.headers, env, request);
        }

        if (!key) {
            // keyが空
            const errMsg = "Missing key";
            logger.report("Missing key", errMsg, Logger.ERROR, ["shortenKeyFetch.ts", "handle", 50, 400], datail);
            return Res.p(Response.json({ success: false, error: "Missing key" }, { status: 400 }), request.headers, env, request);
        }
        key = hashGenerator.replaceDifferentCharacter(key);
        const model: shortenMapModel | null = await shortenMapModel.fetchShortenKey(kv, key, env);
        if (model == null) {
            // keyが存在しない
            const errMsg = `Not found: ${key}`;
            logger.report("Not found", errMsg, Logger.ERROR, ["shortenKeyFetch.ts", "handle", 60, 404], datail);
            return Res.p(Response.json({ success: false, error: "Not found" }, { status: 404 }), request.headers, env, request);
        }

        let res = Response.json({
            success: true,
            result: {
                originUrl: model.originurl,
            },
        });
        logger.report("Shorten key fetch", `Fetch origin url by shorten key: ${key}`, Logger.INFO, ["shortenKeyFetch.ts", "handle", 70, 200], datail);
        return Res.p(res, request.headers, env, request);
    }
}
