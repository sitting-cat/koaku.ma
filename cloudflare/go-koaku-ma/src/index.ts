import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";

import { ShortenKeyCreate } from "endpoints/shortenKeyCreate";
import { OriginUriFetch } from "endpoints/originUriFetch";

export const router = OpenAPIRouter({
	docs_url: "/",
});

router.post('/shortenkey', ShortenKeyCreate);
router.get('shortenkey/:key', OriginUriFetch);

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
