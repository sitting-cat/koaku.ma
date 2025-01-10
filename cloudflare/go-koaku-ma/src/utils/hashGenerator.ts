import { Logger } from "./logger";

export class HashGenerator {
    hashLength: number = 4;

    /**
     * 22bitハッシュを生成する.
     *
     * ( Old : keyが必ず4ケタ以内になるように、22ビットに制限する )
     * keyが必ずhashLengthケタ以内になるように、ビット数を制限する
     *
     * hashLengthはhash22呼び出しごとに1づつ加算する
     *
     * @param str string
     * @returns BigInt
     */
    hash22(str: string): bigint {
        let hash = BigInt(0);
        let maxBitSize = this.calculateHashBitSize(this.hashLength);
        let maxHashLimit = (BigInt(1) << BigInt(maxBitSize)) - BigInt(1);

        for (let i = 0; i < str.length; i++) {
            hash = (hash * BigInt(i * (this.hashLength - 3)) + BigInt(str.charCodeAt(i))) & maxHashLimit;
        }

        this.hashLength++;
        return hash;
    }

    /**
     * ハッシュのビット数を計算する.
     *
     * @param hashLength number
     * @returns number
     */
    calculateHashBitSize(hashLength: number): number {
        return Math.ceil(Math.log2(47 ** hashLength)) - 1;
    }

    /**
     * SHA256ハッシュを生成する.
     *
     * largeHashを生成するために使用する.
     *
     * @param plain string
     * @returns Promise<string>
     */
    async sha256(plain: string): Promise<string> {
        const uint8 = new TextEncoder().encode(plain);
        const digest = await crypto.subtle.digest('SHA-256', uint8);
        return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, '0')).join('');
    }

    num2str(num: bigint): string {
        const charset = "0123456789adefhijmnqrtABCDEFGHJKLMNPQRSTUVWXY~-";
        let str = "";

        if (num == BigInt(0)) return "0";

        while (num > BigInt(0)) {
            // digitは必ず0以上46以下になるためNumberでキャストして問題ない
            const digit = Number(num % BigInt(47));
            str = charset[digit] + str;

            // BigInt同士の割り算であるため、小数点以下は切り捨てられる
            num = num / BigInt(47);
        }

        return str;
    }

    replaceDifferentCharacter(str: string): string {
        // TODO - Find a better way to implement
        return str
            .replace(new RegExp("[Oo]"), "0")
            .replace(new RegExp("[Il]"), "1")
            .replace(new RegExp("[zZ]"), "2")
            .replace("b", "6")
            .replace("g", "9")
            .replace("c", "C")
            .replace("k", "K")
            .replace("p", "P")
            .replace("s", "S")
            .replace("u", "U")
            .replace("v", "V")
            .replace("w", "W")
            .replace("x", "X")
            .replace("y", "Y")
    }

    getUrlHash(url: string): string {
        return this.num2str(this.hash22(url));
    }
}
