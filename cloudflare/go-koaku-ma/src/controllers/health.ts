import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Str,
} from "@cloudflare/itty-router-openapi";
import { ResponseCreator as Res } from "utils/responseCreator";

import { SuperSetter } from "../utils/superSetter";

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
        let res = Response.json({
            success: true,
            status: "ok",
        })
        let ss = new SuperSetter();

        let resjson = await ss.superSet(env.KOAKUMA);
        res = Response.json(resjson);
        // return Res.p(res, request.headers);
        return res;
    }
}
