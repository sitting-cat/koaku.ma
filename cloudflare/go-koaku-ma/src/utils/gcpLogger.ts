const axios = require('axios');

export class GCPLogger {
    private readonly GCP_LOGGING_ENDPOINT = "https://clouderrorreporting.googleapis.com"

    private readonly GCP_API_KEY
    private readonly AppricationVersion;

    constructor(env: any) {
        const { id: versionId, tag: versionTag } = env.CF_WORKER_VERSION;
        this.AppricationVersion = versionId + "-" + versionTag;
        this.GCP_API_KEY = env.LOGGING_API_KEY;
    }

    async report(message: string, happen: Array<string | number>) {
        const path = happen[0];
        const func = happen[1];
        const line = happen[2];
        const code = happen[3];
        const args = {
            "serviceContext": {
                "service": "go-koaku-ma",
                "version": this.AppricationVersion,
                "resourceType": "consumed_api"
            },
            "message": message,
            "context": {
                "httpRequest": {
                    "responseStatusCode": code,
                },
                "reportLocation": {
                    "filePath": path,
                    "lineNumber": line, // 実際の行数じゃなくて発生箇所を区別できればOK
                    "functionName": func
                },
            }
        };
        await axios.post(this.GCP_LOGGING_ENDPOINT + "/v1beta1/projects/go-koaku-ma/events:report?key=" + this.GCP_API_KEY, args);
    }
}