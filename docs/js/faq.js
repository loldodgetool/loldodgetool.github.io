function setPotato(state) {
    localStorage.setItem('potato', state ? 'true' : 'false');
}

$(() => {
    if (localStorage.getItem('potato') == 'true') {
        $('#potatoSwitch').attr('checked', 'checked');
    }
});
