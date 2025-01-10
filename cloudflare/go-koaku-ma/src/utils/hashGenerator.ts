export class HashGenerator {
    hashLength: number = 4;

    /**
     * 22bitハッシュを生成する.
     *
     * ( Old : keyが必ず4ケタになるように、22ビットに制限する )
     * keyが必ずhashLengthケタになるように、ビット数を調整する
     * hashLengthはhash22呼び出しごとに1づつ加算する
     *
     * @param str string
     * @returns number
     */
    hash22(str: string): number {
        let hash = 0;
        let bitSize = this.calculateHashBitSize(this.hashLength);
        let maxHashLimit = (1 << bitSize) - 1;

        for (let i = 0; i < str.length; i++) {
            // (( 1 << bitSize) - 1) はビット数分の1を繰り返した二進数の値
            // charCodeAt(i) は文字列のi番目の文字のUnicodeコードポイントを返す
            // これらを足し合わせて、許容される最大の値で割った余りを取ることで、
            // 許容範囲内の出力に収まるようにする
            hash = (hash + str.charCodeAt(i)) & maxHashLimit;
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

    num2str(num: number): string {
        const charset = "0123456789adefhijmnqrtABCDEFGHJKLMNPQRSTUVWXY~-";
        let str = "";

        if (num == 0) return "0";

        while (num > 0) {
            const digit = num % 47;
            str = charset[digit] + str;
            num = Math.floor(num / 47);
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
