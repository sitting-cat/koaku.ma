import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";

import { ShortenKeyCreate } from "controllers/shortenKeyCreate";
import { OriginUriFetch } from "controllers/originUriFetch";

export const router = OpenAPIRouter({
	docs_url: "/",
});

router.post('/urlmap', ShortenKeyCreate);
router.get('/urlmap/:key', OriginUriFetch);

// 404 for everything else
router.all("*", () =>
	Response.json(
		{
			success: false,
			error: "Route not found",
		},
		{ status: 404 }
	)
);

export default {
	fetch: router.handle,
} satisfies ExportedHandler;
