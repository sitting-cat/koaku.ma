let app

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

function jumpToWebsite() {
    const urlobject = new URL(window.location);
    const target = replaceDifferentCharacter(
        encodeURIComponent(urlobject.pathname.substring(1))
    );
    if (target && isValidKey(target)) {
        const dbRef = app.database().ref();
        dbRef.child("short/" + target).once("value").then((snapshot) => {
            if (snapshot.exists()) {
                window.location.replace(snapshot.val());
            } else {
                showError("転送先が見つかりませんでした");
            }
        }).catch((error) => {
            showError("転送中にエラーが発生しました");
            console.error(error);
        })
    }
    document.getElementById("submit").addEventListener("click", startShorteningUrl, false);
    document.getElementById("submit").removeAttribute("disabled");
}

function startShorteningUrl() {
    let urlBoxElement = document.getElementById("urlBox");
    let result = "";
    if (urlBoxElement.value) {
        if (isValidURL(urlBoxElement.value)) {
            document.getElementById("submit").setAttribute("disabled", null);
            searchGoodHashAndOutputResult(urlBoxElement.value);
            result = "https://koaku.ma/" + getUrlHash(urlBoxElement.value);
            document.getElementById("result").value = result;
            document.getElementById("submit").removeAttribute("disabled");
            document.getElementById("result").focus();
        }
        else {
            showError("URL以外は短縮できません");
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
            outputResult("https://koaku.ma/" + hash);
        }
    }).catch((error) => {
        showError("短縮中にエラーが発生しました");
        console.error(error);
    })
}

function outputResult(result) {
    document.getElementById("result").value = result;
    document.getElementById("submit").removeAttribute("disabled");
    document.getElementById("result").focus();
}

function showError(message) {
    document.getElementById("error").removeAttribute("style");
    document.getElementById("error").textContent = message;
}
