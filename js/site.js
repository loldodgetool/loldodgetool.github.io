


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

function setPotato(state) {
    localStorage.setItem('potato', state ? 'true' : 'false');
}

$(() => {
    if (localStorage.getItem('potato') == 'true') {
        $('#potatoSwitch').attr('checked', 'checked');
    }
});

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


