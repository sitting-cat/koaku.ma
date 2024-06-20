export class HashGenerator {
    /**
     * 22bitハッシュを生成する.
     *
     * keyが必ず4ケタになるように、22ビットに制限する
     * 何ビットならkeyが最大で何ケタになるかは、num2str(2**22)などで簡易的に確認できる
     *
     * @param str string
     * @returns number
     */
    hash22(str: string): number {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash = (hash + str.charCodeAt(i)) & 0x3fffff;
        }

        return hash;
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