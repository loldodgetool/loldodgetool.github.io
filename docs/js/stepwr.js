
function submitStepWr() {
	$('#hiddenBlue').val(Query.IsBlueTeam);
	$('#hiddenRegion').val(Query.Region);
	$('#hiddenTeam').val(Query.Summoners.join(','));
	$('#hiddenChamps').val(Query.Champions.join(','));
	$('#hiddenOtherChamps').val(Query.OtherChampions.join(','));
}

$(async () => {
	Query.IsBlueTeam = (findGetParameter('blue') ?? 'false') == 'true';
	Query.Region = findGetParameter('region') ?? '';
	Query.Summoners = (findGetParameter('team') ?? '').split(',');
	Query.Champions = (findGetParameter('champs') ?? '').split(',');
	Query.OtherChampions = (findGetParameter('otherChamps') ?? '').split(',');
	
	if (Query.Summoners.concat(Query.Champions).concat(Query.OtherChampions).filter(x => x != null && x.length > 0).length == 0) {
		location = '/';
		return;
	}
	
	syncContentWithQuery(); //Just for the nicer formatting
	
    let extensionConnected = await extIsConnected();

    $('#syncNow').attr("disabled", false);
    $('#liveSwitch').attr("disabled", false);

    if (!extensionConnected) {
        $('#syncNow').popover('dispose');
        $('#syncNow').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '✗ Requires <a href="/AutoLDT">AutoLDT</a><br/>Click the back arrow above to return' });
    } else {
        $('#syncNow').attr('onclick', 'ldtSync(false);');
    }

	await getInfo();
	
});


