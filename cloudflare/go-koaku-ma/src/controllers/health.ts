import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Str,
} from "@cloudflare/itty-router-openapi";
import { ResponseCreator as Res } from "utils/responseCreator";
import { Logger } from "utils/logger";

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
    ) {
        let res = Response.json({
            success: true,
            status: "ok",
        });
        let logger = new Logger(env);
        // await logger.report("Health check", "Health check is successful", Logger.INFO, ["Health.ts", "handle", 30, 200]);
        return await Res.p(res, request.headers, env, request);
    }
}
