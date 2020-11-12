
function submitStep2() {
    let team = [];
    let champs = [];
    let otherChamps = [];

    for (let i = 0; i < 5; ++i) {
        team = team.concat($("#step2Summoner" + i).val());
        champs = champs.concat($("#step2Champion" + i).val());
        otherChamps = otherChamps.concat($("#step2OtherChampion" + i).val());
    }

    if (team.concat(champs).concat(otherChamps).filter(x => x.length > 0).length < 2) {
        $('#step2Submit').popover('dispose');
        $('#step2Submit').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '⚠ At least two fields required' });
        $('#step2Submit').popover('show');
        return false;
    }

    for (let i = 0; i < 5; ++i) {
        $("#step2Summoner" + i).prop("disabled", true);
        $("#step2Champion" + i).prop("disabled", true);
        $("#step2OtherChampion" + i).prop("disabled", true);
    }

    $("#step2RegionHidden").attr("value", $("#step2Region").val());
    $("#step2Team").attr("value", team.join(','));
    $("#step2Champs").attr("value", champs.join(','));
    $("#step2OtherChamps").attr("value", otherChamps.join(','));

    let blueTeam = $("#step2BlueTeam").is(':checked');
    $("#step2Blue").attr("value", blueTeam);
    $("#step2Region").prop("disabled", true);
    $("#step2BlueTeam").prop("disabled", true);

    $("#step2Submit").attr("disabled", true);

    return true;
}

function backStep2() {
    $("#step2Back").attr("disabled", true);
    location = '/';
}

function step2RegionChanged() {
    localStorage.setItem("region", $("#step2Region").val());
}

$(function () {
	let team = (findGetParameter('team') ?? '').split(',');
	let champs = (findGetParameter('champs') ?? '').split(',');
	let otherChamps = (findGetParameter('otherChamps') ?? '').split(',');
	let region = findGetParameter('region') ?? localStorage.getItem("region") ?? 'unset';
	let blue = (findGetParameter('blue') ?? 'false') == 'true';
	
	for (let i = 0; i < 5; ++i) {
		$('#step2Summoner' + i).val(team[i] ?? '');
	}
	
	$('.championDropdown').append(`<option value="">- Select One -</option>`);
	for (let c in Patch.ChampionIdToName) {
		$('.championDropdown').append(`<option value="${c}"> ${Patch.ChampionIdToName[c]} </option>`);
	}
	for (let i = 0; i < 5; ++i) {
		$('#step2Champion' + i + ' option[value="' + (champs[i] ?? null)  + '"]').attr('selected', 'selected');
	}
	for (let i = 0; i < 5; ++i) {
		$('#step2OtherChampion' + i + ' option[value="' + (otherChamps[i] ?? null)  + '"]').attr('selected', 'selected');
	}
	
	for (let c in Patch.RegionToName) {
		if (c == 'KR') continue; //Patch until Korean working again without extension
		$('.regionDropdown').append(`<option value="${c}"> ${Patch.RegionToName[c]} </option>`);
	}
	
	if ($("#step2Region option").filter((x, i) => i.value == region).length > 0) {
		$("#step2Region").val(region);
	}

	if (blue) {
		$('#step2BlueTeam').attr('checked', 'checked');
	}
	
});

