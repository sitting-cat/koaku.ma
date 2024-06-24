const axios = require('axios');

export class Logger {
    private readonly GCP_LOGGING_ENDPOINT = "https://clouderrorreporting.googleapis.com"

    private readonly GCP_API_KEY
    private readonly AppricationVersion;

    constructor(env: any) {
        const { id: versionId, tag: versionTag } = env.CF_WORKER_VERSION;
        this.AppricationVersion = versionId + "-" + versionTag;
        this.GCP_API_KEY = env.LOGGING_API_KEY;
    }

    reportError(message: string, req: Request, happen: Array<string>) {
        const path = happen[0];
        const line = happen[1];
        const func = happen[2];
        const args = {
            "serviceContext": {
                "service": "go-koaku-ma",
                "version": this.AppricationVersion,
                "resourceType": "api"
            },
            "message": message,
            "context": {
                "httpRequest": {
                    "method": req.method,
                    "url": req.url,
                    "userAgent": req.headers.get("User-Agent"),
                    "referrer": req.headers.get("Referer"),
                    "responseStatusCode": 500,
                    "remoteIp": req.headers.get("CF-Connecting-IP"),
                },
                // ユーザー名にはIPアドレスを入れる
                "user": req.headers.get("CF-Connecting-IP"),
                "reportLocation": {
                    "filePath": path,
                    "lineNumber": line,
                    "functionName": func
                },
            }
        };
        axios.post(this.GCP_LOGGING_ENDPOINT + "/v1beta1/projects/go-koaku-ma/events:report?key=" + this.GCP_API_KEY, args);
    }
}