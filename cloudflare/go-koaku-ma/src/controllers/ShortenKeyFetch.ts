import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path,
    Str
} from "@cloudflare/itty-router-openapi";
import { shortenMapModel } from "models/shortenMapModel";
import { HashGenerator } from "utils/hashGenerator";

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
        if (!key) {
            // keyが空
            return Response.json({ success: false, error: "Missing key" }, { status: 400 });
        }
        key = hashGenerator.replaceDifferentCharacter(key);
        const model: shortenMapModel | null = await shortenMapModel.fetchShortenKey(kv, key);
        if (model == null) {
            // keyが存在しない
            return Response.json({ success: false, error: "Not found" }, { status: 404 });
        }

        return Response.json({
            success: true,
            result: {
                originUrl: model.originurl,
            },
        });
    }
}
