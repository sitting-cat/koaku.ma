import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";

import { ShortenKeyCreate } from "controllers/shortenKeyCreate";
import { ShortenKeyFetch } from "controllers/shortenKeyFetch";
import { Health } from "controllers/health";

export const router = OpenAPIRouter({
	docs_url: "/__/docs",
	openapi_url: "/__/openapi",
	redoc_url: "/__/redoc",
});

export interface Env {
	testkv: KVNamespace;
}

// ここでの記述順がドキュメントでの表示順になる

router.get('/health', Health);
router.get('/urlmap/:key', ShortenKeyFetch);
router.post('/urlmap', ShortenKeyCreate);

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
