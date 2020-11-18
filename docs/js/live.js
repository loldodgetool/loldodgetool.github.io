


function submitLive() {
	$('#hiddenBlue').val(Query.IsBlueTeam);
	$('#hiddenRegion').val(Query.Region);
	$('#hiddenTeam').val(Query.Summoners.join(','));
	$('#hiddenChamps').val(Query.Champions.join(','));
	$('#hiddenOtherChamps').val(Query.OtherChampions.join(','));
}


$(async () => {
    if (!await extIsConnected()) {
		location = "/AutoLDT";
		return;
	}

    $('#liveSwitch').attr("disabled", false);
	$('#liveSwitch').attr('onclick', 'moveToQuery();');
	
	syncMainLoop();
});