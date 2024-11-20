/*

セッションの開始：ウェブサイトへのアクセス
商品を表示： F - ターゲットキーが指定されている / S - ウェブサイトコンテンツの表示
カートに追加: F - 有効なターゲットキー（ここでバリアント指定） / S - フォームへのフォーカス
決済開始： F - スナップショットの返答 / S - ボタン押下
購入: F - 転送実施 / S - URL発行

*/

const urlPrefix = "https://koaku.ma/";
let koakumaItems = {
    forward: { item_name: "Koaku.ma - Forwarding Service", item_variant: null },
    shorten: { item_name: "Koaku.ma - shortened URL" }
}
const transaction = generateUuid();

document.addEventListener('DOMContentLoaded', function () {
    // Ajaxでhttps://go.api.koaku.ma/healthにアクセスする
    $.ajax({
        url: "https://go.api.koaku.ma/health",
        type: "GET",
        dataType: "json",
        success: function (data) {
            console.log("API Health Check: " + data.status);
            if (data.status == "ok") {
                setTimeout(function () { jumpToWebsite(); });
            } else {
                showError("APIが利用できません(E001)");
                console.error(data);
            }
        },
        error: function (data) {
            showError("APIが利用できません(E002)");
            console.error(data);
        }
    });
});

document.getElementById("urlBox").addEventListener("focus", urlBoxFocused);

function urlBoxFocused() {
    sendAddCartEvent(koakumaItems["shorten"]);
    document.getElementById("urlBox").removeEventListener("focus", urlBoxFocused);
}

function jumpToWebsite() {
    const urlobject = new URL(window.location);
    const target = encodeURIComponent(urlobject.pathname.substring(1));
    if (target) { sendViewEvent(koakumaItems["forward"]); }
    if (target && isValidKey(target)) {
        koakumaItems["forward"]["item_variant"] = target;
        sendAddCartEvent(koakumaItems["forward"]);
        // https://go.api.koaku.ma/urlmap/{target} にアクセスしてリダイレクト先を取得する
        $.ajax({
            url: "https://go.api.koaku.ma/urlmap/" + target,
            type: "GET",
            dataType: "json",
            success: function (data) {
                sendStartPaymentEvent(koakumaItems["forward"]);
                if (data.result.originUrl) {
                    sendPurchaseEvent(koakumaItems["forward"]);
                    window.location.replace(data.result.originUrl);
                } else {
                    showError("転送中にエラーが発生しました(E003)");
                    showContent();
                }
            },
            error: function (data) {
                if (data.responseJSON.error == "Not Found") {
                    showError("転送先が見つかりませんでした(E013)");
                } else {
                    showError("転送中にエラーが発生しました(E004)");
                }
                showContent();
                console.error(data);
            }
        });
    } else {
        showContent();
    }
    document.getElementById("submit").addEventListener("click", startShorteningUrl, false);
    document.getElementById("submit").removeAttribute("disabled");
}

function startShorteningUrl() {
    let urlBoxElement = document.getElementById("urlBox");
    sendStartPaymentEvent(koakumaItems["shorten"]);
    if (urlBoxElement.value) {
        if (isValidURL(urlBoxElement.value)) {
            document.getElementById("submit").setAttribute("disabled", null);
            searchGoodHashAndOutputResult(urlBoxElement.value);
        }
        else {
            showError("URL以外は短縮できません(E005)");
            document.getElementById("submit").removeAttribute("disabled");
        }
    }
}

function searchGoodHashAndOutputResult(url) {
    // https://go.api.koaku.ma/urlmap にPOSTリクエストを送信する
    grecaptcha.ready(function () {
        grecaptcha.execute('6LdU4_0pAAAAAKv5ReY5xNxPyuDt8kH4dq19qcDB', { action: 'submit' }).then(function (token) {
            $.ajax({
                url: "https://go.api.koaku.ma/urlmap",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ url: url, token: token }),
                dataType: "json",
                success: function (data) {
                    if (data.result.shortenKey) {
                        outputResult(urlPrefix + data.result.shortenKey);
                    } else {
                        showError("短縮URLの取得に失敗しました(E006)");
                    }
                },
                error: function (data) {
                    showError("短縮URLの取得に失敗しました(E007)");
                    console.error(data);
                }
            });
        });
    });
}

function outputResult(result) {
    sendPurchaseEvent(koakumaItems["shorten"]);
    document.getElementById("result").value = result;
    document.getElementById("submit").removeAttribute("disabled");
    document.getElementById("result").focus();
    document.getElementById("copybtn").removeAttribute("disabled");
    document.getElementById("openbtn").removeAttribute("disabled");
}

function showError(message) {
    document.getElementById("error").classList.remove("hidden");
    document.body.classList.remove("loading");
    document.getElementById("error").textContent = message + "。バグ報告は最下部の「フィードバック」からお願いします。";
}

function openShortUrl() {
    let target = document.getElementById("result").value;
    window.open(target);
}

function showContent() {
    document.body.classList.remove("loading");
    sendViewEvent(koakumaItems["shorten"]);
}

function sendViewEvent(item) {
    gtag("event", "view_item", {
        currency: "JPY",
        value: 0,
        items: [item]
    });
}

function sendAddCartEvent(item) {
    gtag("event", "add_to_cart", {
        currency: "JPY",
        value: 0,
        items: [item]
    });
}

function sendStartPaymentEvent(item) {
    gtag("event", "begin_checkout", {
        currency: "JPY",
        value: 0,
        items: [item]
    });
}

function sendPurchaseEvent(item) {
    gtag("event", "purchase", {
        transaction_id: transaction,
        value: 0,
        currency: "JPY",
        items: [item]
    });
}
