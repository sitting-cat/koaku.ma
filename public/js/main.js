/*

セッションの開始：ウェブサイトへのアクセス
商品を表示： F - ターゲットキーが指定されている / S - ウェブサイトコンテンツの表示
カートに追加: F - 有効なターゲットキー（ここでバリアント指定） / S - フォームへのフォーカス
決済開始： F - スナップショットの返答 / S - ボタン押下
購入: F - 転送実施 / S - URL発行

*/

let app
const urlPrefix = "https://koaku.ma/";
let koakumaItems = {
    forward: { item_name: "Koaku.ma - Forwarding Service", item_variant: null },
    shorten: { item_name: "Koaku.ma - shortened URL" }
}
const transaction = generateUuid();

document.addEventListener('DOMContentLoaded', function () {
    try {
        app = firebase.app();
        let appCheck = firebase.appCheck();
        appCheck.activate(
            new firebase.appCheck.ReCaptchaEnterpriseProvider('6Ld3MTomAAAAAPbzD7ySZnNL1JSLF_Aa9F_F8Cb3'),
            true
        );
    } catch (e) {
        showError("データベースエラー（使用できません）");
        console.error(e);
    } finally {
        setTimeout(function () { jumpToWebsite(); });
    }
});

document.getElementById("urlBox").addEventListener("focus", urlBoxFocused);

function urlBoxFocused() {
    sendAddCartEvent(koakumaItems["shorten"]);
    document.getElementById("urlBox").removeEventListener("focus", urlBoxFocused);
}

function jumpToWebsite() {
    const urlobject = new URL(window.location);
    const target = replaceDifferentCharacter(
        encodeURIComponent(urlobject.pathname.substring(1))
    );
    if (target) { sendViewEvent(koakumaItems["forward"]); }
    if (target && isValidKey(target)) {
        koakumaItems["forward"]["item_variant"] = target;
        sendAddCartEvent(koakumaItems["forward"]);
        const dbRef = app.database().ref();
        dbRef.child("short/" + target).once("value").then((snapshot) => {
            sendStartPaymentEvent(koakumaItems["forward"]);
            if (snapshot.exists()) {
                sendPurchaseEvent(koakumaItems["forward"]);
                window.location.replace(snapshot.val());
            } else {
                showError("転送先が見つかりませんでした");
                showContent();
            }
        }).catch((error) => {
            showError("転送中にエラーが発生しました");
            showContent();
            console.error(error);
        })
    } else {
        showContent();
    }
    document.getElementById("submit").addEventListener("click", startShorteningUrl, false);
    document.getElementById("submit").removeAttribute("disabled");
}

function startShorteningUrl() {
    let urlBoxElement = document.getElementById("urlBox");
    let result = "";
    sendStartPaymentEvent(koakumaItems["shorten"]);
    if (urlBoxElement.value) {
        if (isValidURL(urlBoxElement.value)) {
            document.getElementById("submit").setAttribute("disabled", null);
            searchGoodHashAndOutputResult(urlBoxElement.value);
        }
        else {
            showError("URL以外は短縮できません");
            document.getElementById("submit").removeAttribute("disabled");
        }
    }
}

function searchGoodHashAndOutputResult(url, retry = 0) {
    let hash = getUrlHash(url);
    if (retry > 0) hash = getUrlHash(url + "猫".repeat(retry));
    const target = app.database().ref("short/" + hash);
    target.once("value").then((snapshot) => {
        if (snapshot.exists() && snapshot.val() != url) {
            searchGoodHashAndOutputResult(url, retry + 1);
        } else {
            target.set(url)
            outputResult(urlPrefix + hash);
        }
    }).catch((error) => {
        showError("短縮中にエラーが発生しました");
        console.error(error);
    })
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
    document.getElementById("error").removeAttribute("style");
    document.getElementById("error").textContent = message;
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
