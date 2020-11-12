
function decompress(base64Data) {
    let compressData = atob(base64Data);
    compressData = compressData.split('').map(function (e) {
        return e.charCodeAt(0);
    });
    let gunzip = new Zlib.Gunzip(compressData);
    let plain = gunzip.decompress();
    let data = new TextDecoder().decode(plain);
    return data;
}

function hashStringsToVec(items, vecSize) {
    let res = [];
    for (let i = 0; i < vecSize; ++i) res.push(0.0);

    for (let s of items) {
        let i = MD5(s).arr[0];
        res[Math.abs(i) % vecSize] += 1.0;
    }
    return res;
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
    }

    document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
    }, function (err) {
    });
}

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.clipboard-on-click').popover({ html: true, container: 'body', trigger: 'click', placement: 'top', content: () => 'Link copied to clipboard' });
	$('#overlay').hide();
	
});

$(function () {
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Disable for chrome which already supports multiline
    if (!(!!window.chrome && !isOpera)) {
        var style = $('<style>textarea[data-placeholder].active { color: #inherit; }</style>')
        $('html > head').append(style);

        $('textarea[placeholder]').each(function (index) {
            var text = $(this).attr('placeholder');
            var match = /\r|\n/.exec(text);

            if (!match)
                return;

            $(this).attr('placeholder', '');
            $(this).attr('data-placeholder', text);
            $(this).addClass('active');
            $(this).val(text);
        });

        $('textarea[data-placeholder]').on('focus', function () {
            if ($(this).attr('data-placeholder') === $(this).val()) {
                $(this).attr('data-placeholder', $(this).val());
                $(this).val('');
                $(this).removeClass('active');
            }
        });

        $('textarea[data-placeholder]').on('blur', function () {
            if ($(this).val() === '') {
                var text = $(this).attr('data-placeholder');
                $(this).val(text);
                $(this).addClass('active');
            }
        });
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1].replace(/\+/g, '%20'));
    }
    return result;
}

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}

Date.prototype.addMinutes = function (h) {
    this.setMinutes(this.getMinutes() + h);
    return this;
}


