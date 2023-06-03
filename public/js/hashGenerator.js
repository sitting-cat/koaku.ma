function hash22(str) {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = (hash + str.charCodeAt(i)) & 0x3fffff;
    }

    return hash;
}

function num2str(num) {
    const charset = "0123456789adefhijmnqrtABCDEFGHJKLMNPQRSTUVWXY~-";
    let str = "";

    if (num == 0) return 0;

    while (num > 0) {
        const digit = num % 47;
        str = charset[digit] + str;
        num = Math.floor(num / 47);
    }

    return str;
}

function replaceDifferentCharacter(str) {
    // TODO - Find a better way to implement
    return str
        .replace(new RegExp("[0o]"), "O")
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

function getUrlHash(url) {
    return num2str(hash22(url));
}
