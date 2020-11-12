function submitStep1() {
    let t = $("#step1Textarea").val();

    let lines = t.split('\n').map(x => x.trim()).filter(x => x.length > 0);
    let longestCommonSuff = '';
    let maxLine = Math.max(...lines.map(x => x.length));
    for (let i = 2; i < maxLine; ++i) {
        let suff = lines[0].substring(lines[0].length - i);
        if (lines.filter(x => x.endsWith(suff)).length != lines.length) break;
        if (suff[0] == ' ') longestCommonSuff = suff;
    }

    if (longestCommonSuff.length == 0) longestCommonSuff = '\n';

    t = t.split(longestCommonSuff).map(q => q.trim()).filter(q => q.length > 0).join(',');

    $("#step1Team").attr("value", t);

    $("#step1Submit").attr("disabled", true);
    $('#step1Textarea').attr('readonly', 'readonly');

    return true;
}

$(async function () {
    let extensionConnected = await extIsConnected();
    if (!extensionConnected) {
        $('.shake').fadeIn(100);
    }
	
});

