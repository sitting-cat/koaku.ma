import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";

import { ShortenKeyCreate } from "controllers/shortenKeyCreate";
import { ShortenKeyFetch } from "controllers/shortenKeyFetch";
import { Health } from "controllers/health";

export const router = OpenAPIRouter({
	docs_url: "/__/docs",
});

export interface Env {
	testkv: KVNamespace;
}

router.get('/health', Health);
router.post('/urlmap', ShortenKeyCreate);
router.get('/urlmap/:key', ShortenKeyFetch);

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
