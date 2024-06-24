import { count } from "console";

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

    report(message: string, req: Request, happen: Array<string | number>) {
        console.log(message);
        const path = happen[0];
        const func = happen[1];
        const line = happen[2];
        const code = happen[3];
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
                    "responseStatusCode": code,
                    "remoteIp": req.headers.get("CF-Connecting-IP"),
                },
                // ユーザー名にはIPアドレスを入れる
                "user": req.headers.get("CF-Connecting-IP"),
                "reportLocation": {
                    "filePath": path,
                    "lineNumber": line, // 実際の行数じゃなくて発生箇所を区別できればOK
                    "functionName": func
                },
            }
        };
        axios.post(this.GCP_LOGGING_ENDPOINT + "/v1beta1/projects/go-koaku-ma/events:report?key=" + this.GCP_API_KEY, args);
    }
}