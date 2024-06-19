export class shortenMapModel {
    originurl: string;
    shortenkey!: string;

    constructor(url: string) {
        this.originurl = url;
    }

    /**
     * 短縮キーからモデルを生成する
     *
     * @param key
     * @returns shortenMapModel
     */
    static fetchShortenKey(key: string): shortenMapModel {
        // STUB
        let fetchedModel = new shortenMapModel("https://example.com");
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

    /**
     * 短縮キーを生成する
     *
     * @returns string
     */
    generateShortenKey(): string {
        // STUB
        let key = Math.random().toString(36).substring(7);
        this.shortenkey = key;
        return key;
    }

    /**
     * モデルを保存する
     *
     * 短縮キー生成後に呼び出すこと
     *
     * @returns boolean
     */
    save(): boolean {
        if (!this.shortenkey) {
            return false;
        }
        // STUB
        return true;
    }
}
