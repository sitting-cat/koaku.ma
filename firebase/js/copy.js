document.getElementById("result").addEventListener("focus", function () {
    this.select();
});
document.getElementById("copybtn").addEventListener("click", copyShortUrl);

function copyShortUrl() {
    let target = document.getElementById("result").value;
    console.log("target : " + target);
    try {
        navigator.clipboard.writeText(target);
    } catch (error) {
        console.error(error);
    }
    document.getElementById("copied").classList.remove("hidden");
}
