import { HashGenerator } from "../utils/hashGenerator";

export class shortenMapModel {
    kv: KVNamespace;
    originurl: string;
    shortenkey!: string;
    hashGenerator = new HashGenerator();

    constructor(kv: KVNamespace, url: string) {
        this.kv = kv;
        this.originurl = url;
    }

    /**
     * 短縮キーからモデルを生成する
     *
     * @param key
     * @returns shortenMapModel|null
     */
    static async fetchShortenKey(kv: KVNamespace, key: string): Promise<shortenMapModel | null> {
        let fetched = await kv.get(key);
        if (fetched == null) {
            return null;
        }
        let fetchedModel = new shortenMapModel(kv, fetched);
        fetchedModel.shortenkey = key;
        return fetchedModel;
    }

    /**
     * オリジナルのURLがURLとして有効かどうかを判定する
     *
     * @returns boolean
     */
    isOriginalValid(): boolean {
        const urlRegex = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return urlRegex.test(this.originurl);
    }

    /**
     * オリジナルのURLが指す先が存在するかどうかを判定する
     *
     * @returns Promise<boolean>
     */
    async isOriginalExist(): Promise<boolean> {
        let responses = await fetch(this.originurl);
        // 400番台はfalse、それ以外はtrue
        return responses.status < 400 || 500 <= responses.status;
    }

    async isSafetyWebsite(env: any): Promise<boolean> {
        const GCP_Web_Risk_Endpoint = "https://webrisk.googleapis.com";
        const GCP_WR_PATH = "/v1/uris:search";
        const GCP_WR_THREAT_TYPES_PARAM = "threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAGE";
        // 今のところロギングと共通のAPIキーを使う
        const GCP_WR_API_KEY = env.LOGGING_API_KEY;

        // URLエンコードしないとクエリが正しく送信されない
        const target = encodeURIComponent(this.originurl);

        let res = await fetch(GCP_Web_Risk_Endpoint + GCP_WR_PATH + "?" + GCP_WR_THREAT_TYPES_PARAM + "&uri=" + target + "&key=" + GCP_WR_API_KEY);
        let json = await res.json();

        // 空のjsonが返ってきた場合は安全とみなす
        if (Object.keys(json).length === 0) {
            return true;
        }
        return false;
    }

    private async getExistsKeyList(): Promise<Array<Array<string>>> {
        let current = await this.kv.list();
        let keys: Array<string> = current['keys'].map((item: any) => item.name);
        let hashs: Array<string> = current['keys'].map((item: any) => item.metadata.largeHash);

        while (current.list_complete == false) {
            let cursor = current.cursor;
            current = await this.kv.list({ cursor: cursor });
            keys.push(...current['keys'].map((item: any) => item.name));
            hashs.push(...current['keys'].map((item: any) => item.metadata.largehash));
        }
        return [keys, hashs];
    }

    private async getUrlHash(): Promise<string> {
        let existsKeyList: Array<Array<string>> = await this.getExistsKeyList();
        let hash = this.hashGenerator.getUrlHash(this.originurl);
        let retryCount = 0;
        let originHash = await this.hashGenerator.sha256(this.originurl);
        console.log("=====================================")
        while (existsKeyList[0].includes(hash)) {
            let existKeyIndex = existsKeyList[0].indexOf(hash);
            if (
                originHash == existsKeyList[1][existKeyIndex]
                && await this.kv.get(hash) == this.originurl
            ) {
                console.log(" <<< collision >>>")
                break;
            }
            retryCount++;
            hash = this.hashGenerator.getUrlHash(hash + "猫".repeat(retryCount));
        }
        console.log("Retry count: " + retryCount);
        console.log("Hash: " + hash);
        console.log("OriginUrl: " + this.originurl);
        console.log("LargeHash: " + originHash);
        console.log("=====================================")
        return hash;
    }

    /**
     * 短縮キーを生成する
     *
     * @returns string
     */
    async generateShortenKey(): Promise<string> {
        let key = await this.getUrlHash();
        this.shortenkey = key;
        return key;
    }

    /**
     * モデルを保存する
     *
     * 短縮キー生成後に呼び出すこと
     *
     * @param kv KVNamespace
     * @returns boolean
     */
    async save(): Promise<boolean> {
        if (!this.shortenkey) {
            return false;
        }
        // originUrlのハッシュ値をlargeHashとして保存
        await this.kv.put(this.shortenkey, this.originurl, {
            metadata: {
                largeHash: await this.hashGenerator.sha256(this.originurl)
            }
        });
        return true;
    }
}
