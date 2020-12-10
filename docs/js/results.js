let Query = {
	IsBlueTeam: false,
	Region: '',
	Summoners: [],
	Champions: [],
	OtherChampions: [],
	SummonerInfos: []
};

function loadOnOPGG() {
    if (Query.Summoners.filter(x => x && x.length > 0).length > 0 && Patch.RegionIdToGg[Query.Region]) {
        window.open('https://' + Patch.RegionIdToGg[Query.Region] + '.op.gg/multi/query=' + Query.Summoners.filter(x => x && x.length > 0).join('%2C'), '_blank');
    }
}

function loadOnPorofessor() {
    if (Query.Summoners.filter(x => x && x.length > 0).length > 0 && Patch.RegionIdToGg[Query.Region]) {
        window.open('https://porofessor.gg/pregame/' + Patch.RegionIdToGg[Query.Region] + '/' + Query.Summoners.filter(x => x && x.length > 0).join(','), '_blank');
    }
}

function syncContentWithQuery() {
    let stats = JSON.parse(localStorage.getItem("summonerQueryStats")) || {};

    let samples = Query.Summoners.map(s => stats[s]).filter(x => x);

    let min = samples.length > 0 ? Math.min(...samples) : 1;
    let max = samples.length > 0 ? Math.max(...samples) : 1;

    for (let i = 0; i < 5; ++i) {
        let summW = max == min ? 400 : Math.max(400, ((stats[Query.Summoners[i]] || min) - min) / (max - min) * 1000);
        let h = $('#syncSummoner' + i).height();
        $('#syncSummoner' + i).val(Query.Summoners[i]);
        $('#syncSummoner' + i).css('font-weight', summW);
        $('#syncChampion' + i).val(Patch.ChampionIdToName[Query.Champions[i]] || "");
        $('#syncChampion' + i).css('font-weight', summW);
        $('#syncOpponent' + i).val(Patch.ChampionIdToName[Query.OtherChampions[i]] || "");

        //Make sure nobody changes height
        $('#syncSummoner' + i).height(h);
        $('#syncChampion' + i).height(h);
    }
    $('#syncRegion').val(Patch.RegionToName[Query.Region]);
    $('#syncBlueTeam').prop('checked', Query.IsBlueTeam);
}

function updateLocalStorage() {
	storeInfoInLocalCache();

    let stats = JSON.parse(localStorage.getItem("summonerQueryStats")) || {};
    for (let summ of Object.keys(stats)) {
        stats[summ] *= 0.95;
    }
    for (let summ of Query.Summoners.filter(x => x != "")) {
        stats[summ] = (stats[summ] || 0) + .1;
    }
    let sorted = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);
    let leave = sorted.slice(100); //Limit the size
    for (let summ of leave) {
        delete stats[summ];
    }

    localStorage.setItem("summonerQueryStats", JSON.stringify(stats));
}

async function getInfoFromServer(region, summoners) {
    return await new Promise(resolve => {
        try {
			$.ajax(
			{
				url: 'https://7y7f7tk3nd.execute-api.us-east-2.amazonaws.com/default/getSummoners',
				type:'POST',
				data: region + "," + summoners.join(','),
				success: function(data)
				{
					var res = JSON.parse(data);
					resolve(res.map(x => { return x == null ? null : { tierInfo: JSON.parse(x.tier), matchInfo: JSON.parse(x.performances) }; }));
				},
				error: function(data)
				{
					console.log(data);
					resolve(null);
				}
			}); 			
        } catch (ex) {
            console.log(ex);
            resolve(null);
        }
    });
}

let cacheTimeoutMinutes = 10;
function getLocalCache() {
	let cache = {};
	try { cache = JSON.parse(localStorage.getItem("cache")) ?? {}; } catch(ex) { console.log(ex); }
	for (let region of Object.keys(cache)) {
		for (let summoner of Object.keys(cache[region])) {
			if (new Date(cache[region][summoner].time).addMinutes(cacheTimeoutMinutes) < new Date()) delete cache[region][summoner];
		}
	}
	
	return cache;
}

function getInfoFromLocalCache(region, summoners) {
	let cache = getLocalCache();
	let res = Array(5).fill(null);
	
	if (cache[region]) {
		for (let i in summoners) {
			res[i] = (cache[region][summoners[i]] ?? {}).res ?? null;
		}
	}
	
	return res;
}

function storeInfoInLocalCache() {
	let cache = getLocalCache();
	
	if (!cache[Query.Region]) cache[Query.Region] = {};
	
	for (let i in Query.Summoners) {
		if (Query.Summoners[i] != "" && Query.SummonerInfos[i] != null) {
			cache[Query.Region][Query.Summoners[i]] = {res: Query.SummonerInfos[i], time: new Date()};
		}
	}
	
	//Limit cache size
	let sortedByTime = [];
	for (let region of Object.keys(cache)) {
		for (let summoner of Object.keys(cache[region])) {
			sortedByTime.push([region, summoner, new Date(cache[region][summoner].time)]);
		}
	}
    sortedByTime = sortedByTime.sort((a, b) => b[2] - a[2]);
    let remove = sortedByTime.slice(15);
	for (let x of remove) {
		delete cache[x[0]][x[1]];
	}
	

	try { localStorage.setItem("cache", JSON.stringify(cache)); } catch(ex) { console.log(ex); }
}

function moveToQuery() {
	location = getQueryPath();
}

function getQueryPath() {
    return '/WinRate?region=' + Query.Region + '&team=' + encodeURIComponent(Query.Summoners.join(',')) + '&champs=' + encodeURIComponent(Query.Champions.join(',')) + '&otherChamps=' + encodeURIComponent(Query.OtherChampions.join(',')) + '&blue=' + Query.IsBlueTeam;
}

function setPath() {
    let newPath = $('#newPath').val();
    localStorage.setItem("lolPath", newPath);
    $('#setPathModal').modal('hide');
    $('#syncNow').click();
}

function shareLink() {
    let url = 'https://www.loldodgetool.com' + getQueryPath();
    copyTextToClipboard(url);

    return false;
}


//Flow

let autoSyncDelay = 2000;
function syncMainLoop() {
    let loop = async () => {
        try { await ldtSync(true); } catch (ex) { }
        setTimeout(loop, Math.max(100, autoSyncDelay));
    };
    setTimeout(loop, 1);
}

let SyncInProgress = false;
let CurrentErrorMsg = "";
async function ldtSync(isLive) {
    if (SyncInProgress) return;
    SyncInProgress = true;

    let championSelectStatus = await extGetChampionSelectStatus();
    SyncInProgress = false;

    if (null == championSelectStatus) {
        if (ExtensionError.startsWith("ConnectionLost")) {
            alert("Connection to extension lost"); document.location = '/'; return;

        } else if (CurrentErrorMsg != ExtensionError) {
            $('#syncNow').popover('dispose');
            if (ExtensionError.startsWith('NoFileAccess')) {
                $('#syncNow').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '✗ Can\'t access local files<br/><a id="grantAccessLink" href="">Grant access</a>' });

            } else if (ExtensionError.startsWith('LockFileNotFound')) {
                autoSyncDelay = 5000;
                $('#syncNow').popover({
                    html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '✗ LoL client not found<br/>' +
                        '⚠ Ensure that the client is <b>logged in</b> and that its installation folder is:<br/>' +
                        '"<b><span id="popupPath"></span></b>"<br/>Wrong path? <a href="#" class="change-path-link">Change path...</a>'
                });

            } else if (ExtensionError.startsWith('LcuRequestFailed')) {
                $('#syncNow').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '✓ Can access local files<br/>✗ Can\'t access client<br/>⚠ Is the client running?<br/>⚠ Have you granted localhost access?<br/><a id="grantAccessLink" href="">Grant access</a>' });

            } else if (ExtensionError.startsWith('NotInChampionSelect')) {
                autoSyncDelay = 2000;
                $('#syncNow').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '✓ Connected to LoL client<br/>✗ Not in champion select' });

            } else {
                autoSyncDelay = 5000;
                $('#syncNow').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '⚠ An unexpected error has occurred, plase try again. ' + ExtensionError });
            }
            $('#syncNow').popover('show');
        }
        //These have to rerun every time
        $('.change-path-link').on("click", () => $('#setPathModal').modal('show'));
        let path = localStorage.getItem("lolPath") || defaultLolPath;
        if (!($('#setPathModal').data('bs.modal') || {})._isShown)
            $('#newPath').val(path);

        $('#grantAccessLink').attr('href', '/AutoLDT#Permissions');
        $('#popupPath').html(path);
        CurrentErrorMsg = ExtensionError;

    } else {
        CurrentErrorMsg = ExtensionError = "";
        $('#syncNow').popover('dispose');
		
        if (!isLive) {
            Query = championSelectStatus;
            moveToQuery();
        } else {
            autoSyncDelay = 1000;
            if (JSON.stringify([Query.Summoners, Query.Champions, Query.OtherChampions, Query.Region]) == 
				JSON.stringify([championSelectStatus.Summoners, championSelectStatus.Champions, championSelectStatus.OtherChampions, championSelectStatus.Region])) return;
            let alreadyHaveSummonerInfo = JSON.stringify(Query.Summoners) == JSON.stringify(championSelectStatus.Summoners) &&
                JSON.stringify(Query.Region) == JSON.stringify(championSelectStatus.Region) &&
                Query.Summoners.filter((x, i) => x != "" && Query.SummonerInfos[i] == null).length == 0;

            if (alreadyHaveSummonerInfo) {
                championSelectStatus.SummonerInfos = Query.SummonerInfos;
            }
            Query = championSelectStatus;
            syncContentWithQuery();

            if (alreadyHaveSummonerInfo) {
                computeWr();
            } else {
                getInfo();
            }
        }
    }
}

async function getInfo() {
    stopAllOngoingWorkers();
	
    let wrId = '#wr-total-result';
    resultHasBeenComputedForThisTeam = false;
    $(wrId).html(" Loading summoner data...");
    $(wrId).removeClass();
    $(wrId).addClass('text-secondary');
    $('#wr-total-loading').show();

    for (let i = 0; i < 5; ++i) {
        $('#wr-summoner' + i + '-loading').show();
        $('#wr-summoner' + i + '-result').hide();
        $('#wr-champion' + i + '-loading').show();
        $('#wr-champion' + i + '-result').hide();
        $('#wr-opponent' + i + '-loading').show();
        $('#wr-opponent' + i + '-result').hide();
    }

    Query.SummonerInfos = getInfoFromLocalCache(Query.Region, Query.Summoners);
	let maxTries = 3;
	for (var try_ = 0; try_ < maxTries; ++try_) {
		if (try_ > 0) await sleep(4000);

		let remainingSummoners = Query.Summoners.map((x, i) => Query.SummonerInfos[i] == null && x != "" ? x : null);
		if (remainingSummoners.filter(x => x != null) == 0) break;

		let res = await extGetInfo(Query.Region, remainingSummoners);
		
		if (res == null) {
			res = await getInfoFromServer(Query.Region, remainingSummoners);
		}
		for (let i in res) {
			if (res[i] != null) {
				if (Query.SummonerInfos[i] == null) maxTries++;

				Query.SummonerInfos[i] = res[i];
			}
		}
		if (Query.Summoners.filter((x, i) => x != "" && Query.SummonerInfos[i] == null).length == 0) {
			updateLocalStorage();
			break;
		}
	}
	
    computeWr();
}

let resultHasBeenComputedForThisTeam = false;
async function computeWr() {
    stopAllOngoingWorkers();

    let ctx = queryToEffectQueries();
	ctx.GivenSummoners = Query.Summoners.map(x => !!x);
	ctx.FoundSummoners = Query.SummonerInfos.map(x => !!x);
	ctx.FoundChampions = Query.Champions.map(x => !!x && x != "0");
	ctx.FoundOtherChampions = Query.OtherChampions.map(x => !!x && x != "0");
	
    setAllToLoading(ctx);

    
	let wrIdLoad = "#wr-total-loading";
	let wrId = "#wr-total-result";
	
	let startTime = Date.now();
	var wr = await computeWrOnWorker(ctx.Total);
	
	let slow = localStorage.getItem('potato') == 'true';
	
	$(wrIdLoad).hide();
	$(wrId).removeClass();
	
	if (wr == null) {
		$(wrId).html(' ⚠ Error ');
		$(wrId).css('opacity', '1.0');
		$(wrId).addClass('text-danger');
		wr = 0.5;
		
	} else {
		$(wrId).hide();
		$(wrId).html('' + (Math.round(wr * 100)) + '% Win Rate');
		$(wrId).css('opacity', '1.0');
		resultHasBeenComputedForThisTeam = true;
		if (wr >= 0.5) {
			$(wrId).addClass('text-success');
		} else if (wr < 0.5) {
			$(wrId).addClass('text-danger');
		}
		if (Math.abs(wr - 0.5) >= 20) {
			$(wrId).addClass('font-weight-bold');
		}
		$(wrId).fadeIn();

	}
	loadDifferentialWr(wr, ctx, slow, Date.now() - startTime);
}

function queryToEffectQueries() {
    Query.Timestamp = new Date();

	let res = { Total:Query, Summoners: [], Champions: [], OtherChampions: [] };

    for (let i = 0; i < 5; ++i) {
        res.Summoners.push({
            Timestamp: Query.Timestamp,
            IsBlueTeam: Query.IsBlueTeam,
            SummonerInfos: Query.SummonerInfos.map((x, j) => i == j ? null : x),
            Champions: Query.Champions,
            OtherChampions: Query.OtherChampions,
            Region: Query.Region,
        });
        res.Champions.push({
            Timestamp: Query.Timestamp,
            IsBlueTeam: Query.IsBlueTeam,
            SummonerInfos: Query.SummonerInfos,
            Champions: Query.Champions.map((x, j) => i == j ? "" : x),
            OtherChampions: Query.OtherChampions,
            Region: Query.Region,
        });
        res.OtherChampions.push({
            Timestamp: Query.Timestamp,
            IsBlueTeam: Query.IsBlueTeam,
            SummonerInfos: Query.SummonerInfos,
            Champions: Query.Champions,
            OtherChampions: Query.OtherChampions.map((x, j) => i == j ? "" : x),
            Region: Query.Region,
        });
    }

    return res;
}

function setAllToLoading(ctx) {

    let wrIdLoad = "#wr-total-loading";
    let wrId = "#wr-total-result";
    if (!resultHasBeenComputedForThisTeam)
        $(wrId).html(" Calculating Win Rate...");
    else
        $(wrId).css('opacity', '0.6');
    $(wrIdLoad).show();

    for (let i = 4; i >= 0; --i) {
        if (ctx.FoundOtherChampions[i]) {
            $("#wr-opponent" + i + "-result").css('opacity', '0.6');
            $("#wr-opponent" + i + "-loading").show();
        }
        if (ctx.FoundChampions[i]) {
            $("#wr-champion" + i + "-result").css('opacity', '0.6');
            $("#wr-champion" + i + "-loading").show();
        }
        if (ctx.FoundSummoners[i]) {
            $("#wr-summoner" + i + "-result").css('opacity', '0.6');
            $("#wr-summoner" + i + "-loading").show();
        }
    }

}

async function loadDifferentialWr(wr, ctx, slow, estimateOfRuntime) {
    let coresToRunOn = Math.max(1, (navigator.hardwareConcurrency || 32) / 4);
    let delay = estimateOfRuntime / coresToRunOn;

	let workerFunctions = [];

    let nextFunc = null;
    for (let i = 0; i < 5; ++i) {
		let f = async () => await launchWrWorker(ctx.FoundSummoners[i] ? ctx.Summoners[i] : null, wr, "#wr-summoner" + i + "-result", "#wr-summoner" + i + "-loading", ctx.GivenSummoners[i]);
		if (ctx.FoundSummoners[i]) {
			workerFunctions.push(f);
		} else {
			f();
		}
    }
    for (let i = 0; i < 5; ++i) {
		let f = async () => await launchWrWorker(ctx.FoundChampions[i] ? ctx.Champions[i] : null, wr, "#wr-champion" + i + "-result", "#wr-champion" + i + "-loading", false);
		if (ctx.FoundChampions[i]) {
			workerFunctions.push(f);
		} else {
			f();
		}
    }
    for (let i = 0; i < 5; ++i) {
		let f = async () => await launchWrWorker(ctx.FoundOtherChampions[i] ? ctx.OtherChampions[i] : null, wr, "#wr-opponent" + i + "-result", "#wr-opponent" + i + "-loading", false);
		if (ctx.FoundOtherChampions[i]) {
			workerFunctions.push(f);
		} else {
			f();
		}
    }
	
    if (slow) {
		for (let f of workerFunctions) {
			await f();
		}
	} else {
		let tick = 0;
		for (let f of workerFunctions) {
			setTimeout(f, delay * tick++);
		}
	}
}

async function launchWrWorker(query, totalWr, wrId, wrIdLoad, isSummoner) {
	let wr = await computeWrOnWorker(query);
	$(wrIdLoad).hide();
	
	if (wr == null) {
        $(wrId).removeClass();
        if (isSummoner) {
            $(wrId).html(' ⚠ Error ');
            $(wrId).css('opacity', '1.0');
            $(wrId).attr('data-original-title', 'Error finding summoner in our database. Try the AutoLDT extension for best results.');
            $(wrId).addClass('text-danger');
            $(wrId).fadeIn();
        } else {
            $(wrId).html(' ');
        }
	} else {
        $(wrId).hide();
        let wrd = Math.round(totalWr * 100) - Math.round(wr * 100);
        $(wrId).html('' + (wrd >= 0 ? "+" : "") + wrd + '%');
        $(wrId).css('opacity', '1.0');
        $(wrId).removeClass();
        if (wrd > 0) {
            $(wrId).addClass('text-success');
        } else if (wrd < 0) {
            $(wrId).addClass('text-danger');
        }
        if (Math.abs(wrd) >= 5) {
            $(wrId).addClass('font-weight-bold');
        }
        $(wrId).fadeIn();
    }
}

