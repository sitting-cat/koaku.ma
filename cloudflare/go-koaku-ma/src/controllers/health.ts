import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Str,
} from "@cloudflare/itty-router-openapi";

export class Health extends OpenAPIRoute {
    static schema: OpenAPIRouteSchema = {
        tags: ["general"],
        summary: "Check the health of the service",
        responses: {
            "200": {
                description: "Returns a health check response",
                schema: {
                    success: new Bool({ example: true }),
                    status: new Str({ example: "ok" }),
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
        return Response.json({
            success: true,
        });
    }
}
