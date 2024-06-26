import {
    Bool,
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Str,
} from "@cloudflare/itty-router-openapi";
import { ResponseCreator as Res } from "utils/responseCreator";

export class HandleOptionMethod extends OpenAPIRoute {
    async handle(
        request: Request,
        env: any,
        context: any,
        data: Record<string, any>
    ): Promise<Response> {
        return await Res.p(new Response(), request.headers, env, request);
    }
}
