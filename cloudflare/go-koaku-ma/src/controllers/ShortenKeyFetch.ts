import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path,
    Str
} from "@cloudflare/itty-router-openapi";
import { shortenMapModel } from "models/shortenMapModel";

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
    ) {
        let key = data.params.key;
        // Retrieve the validated request body
        if (!key) {
            // keyが空
            return Response.json({ success: false, error: "Missing key" }, { status: 400 });
        }

        const model = shortenMapModel.fetchShortenKey(key);
        if (!model) {
            // keyが不正
            return Response.json({ success: false, error: "Invalid key" }, { status: 400 });
        }

        return Response.json({
            success: true,
            result: {
                originUrl: model.originurl,
            },
        });
    }
}
