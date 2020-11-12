function flashManualCopyPaste(x) {
	copyTextToClipboard(x.innerHTML);

	$('#manual-copy-paste-warning').removeClass();
	setTimeout(() => {
		$('#manual-copy-paste-warning').addClass('yellow-flash');
	}, 1);
	return false;
}

$('.clipboard-on-click').popover({ html: true, container: 'body', trigger: 'focus', placement: 'top', content: () => 'Copied to clipboard' });
