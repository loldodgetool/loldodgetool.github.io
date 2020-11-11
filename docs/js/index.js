

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

function submitStep3() {
    $("#step3Submit").attr("disabled", true);
}

function step2RegionChanged() {
    localStorage.setItem("region", $("#step2Region").val());
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


let WorkersComputingWr = new Set();
function createWrWorker(wr, wrId, wrIdLoad, isSummoner, nextFunc) {
    let modelWorker = newWorker();

    modelWorker.onmessage = function (e) {
        WorkersComputingWr.delete(modelWorker);
        modelWorker.terminate();
        $(wrIdLoad).hide();
        $(wrId).hide();
        let wrd = Math.round(wr * 100) - Math.round(e.data[0] * 100);
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

        if (nextFunc) nextFunc();
    }
    modelWorker.onerror = function (e) {
        WorkersComputingWr.delete(modelWorker);
        modelWorker.terminate();
        $(wrIdLoad).hide();
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
        if (nextFunc) nextFunc();
    }
    WorkersComputingWr.add(modelWorker);
    return modelWorker;
}

function newWorker() {
    return new Worker(URL.createObjectURL(new Blob(["" + __evaluate.toString() + "\nonmessage=function(e){if (e && e.data && e.data.length == " + __inputSize + ") postMessage(__evaluate(e.data));}"], { type: 'text/javascript' })));
}

function loadDifferentialWr(wr, res, slow, estimateOfRuntime) {
    let coresToRunOn = Math.max(1, (navigator.hardwareConcurrency || 32) / 4);
    let delay = estimateOfRuntime / coresToRunOn;

    let tick = 15;
    let nextFunc = null;
    for (let i = 4; i >= 0; --i) {
        let w = createWrWorker(wr, "#wr-opponent" + i + "-result", "#wr-opponent" + i + "-loading", false, nextFunc);
        if (res.FoundOtherChampions[i]) {
            let f = () => { w.postMessage(res.OtherTeamChampionsEffect[i]); };
            if (slow) nextFunc = f; else setTimeout(f, delay * tick--);
        } else {
            let f = () => w.onerror();
            if (slow) nextFunc = f; else setTimeout(f, 0 * tick--);
        }
    }
    //if (slow) {
    //    nextFunc();
    //    nextFunc = null;
    //}
    for (let i = 4; i >= 0; --i) {
        let w = createWrWorker(wr, "#wr-champion" + i + "-result", "#wr-champion" + i + "-loading", false, nextFunc);
        if (res.FoundChampions[i]) {
            let f = () => { w.postMessage(res.MyTeamEffectArrays[i].champion); };
            if (slow) nextFunc = f; else setTimeout(f, delay * tick--);
        } else {
            let f = () => w.onerror();
            if (slow) nextFunc = f; else setTimeout(f, 0 * tick--);
        }
    }
    //if (slow) {
    //    nextFunc();
    //    nextFunc = null;
    //}
    for (let i = 4; i >= 0; --i) {
        let w = createWrWorker(wr, "#wr-summoner" + i + "-result", "#wr-summoner" + i + "-loading", res.GivenSummoners[i], nextFunc);
        if (res.FoundSummoners[i]) {
            let f = () => { w.postMessage(res.MyTeamEffectArrays[i].summoner); };
            if (slow) nextFunc = f; else setTimeout(f, delay * tick--);
        } else {
            let f = () => w.onerror();
            if (slow) nextFunc = f; else setTimeout(f, 0 * tick--);
        }
    }
    if (slow)
        nextFunc();
}

function setAllToLoading(res) {

    let wrIdLoad = "#wr-total-loading";
    let wrId = "#wr-total-result";
    if (!resultHasBeenComputedForThisTeam)
        $(wrId).html(" Calculating Win Rate...");
    else
        $(wrId).css('opacity', '0.6');
    $(wrIdLoad).show();

    for (let i = 4; i >= 0; --i) {
        if (res.FoundOtherChampions[i]) {
            $("#wr-opponent" + i + "-result").css('opacity', '0.6');
            $("#wr-opponent" + i + "-loading").show();
        }
        if (res.FoundChampions[i]) {
            $("#wr-champion" + i + "-result").css('opacity', '0.6');
            $("#wr-champion" + i + "-loading").show();
        }
        if (res.FoundSummoners[i]) {
            $("#wr-summoner" + i + "-result").css('opacity', '0.6');
            $("#wr-summoner" + i + "-loading").show();
        }
    }

}

let resultHasBeenComputedForThisTeam = false;
function computeWr() {
    stopAllOngoingWorkers();

    let input = queryToModelInputArrays();
    let myTeamEff = [];
    let otherTeamEff = [];
    for (let i = 0; i < 5; ++i) {
        myTeamEff.push({ summoner: input[1 + 3 * i + 0], champion: input[1 + 3 * i + 1] });
        otherTeamEff.push(input[1 + 3 * i + 2]);
    }
    let res = {
        WinrateArray: input[0],
        FoundSummoners: Query.SummonerInfos.map(x => !!x),
        GivenSummoners: Query.Summoners.map(x => !!x),
        FoundChampions: Query.Champions.map(x => !!x && x != "0"),
        FoundOtherChampions: Query.OtherChampions.map(x => !!x && x != "0"),
        MyTeamEffectArrays: myTeamEff,
        OtherTeamChampionsEffect: otherTeamEff,
    };
    setAllToLoading(res);

    let wr = 0.5;
    {
        let wrIdLoad = "#wr-total-loading";
        let wrId = "#wr-total-result";
        let modelWorker = newWorker();

        let startTime = Date.now();
        let slow = localStorage.getItem('potato') == 'true';
        modelWorker.onmessage = function (e) {
            WorkersComputingWr.delete(modelWorker);
            modelWorker.terminate();
            $(wrIdLoad).hide();
            wr = e.data[0];
            $(wrId).hide();
            $(wrId).removeClass();
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

            loadDifferentialWr(wr, res, slow, Date.now() - startTime);
        }
        modelWorker.onerror = function (e) {
            WorkersComputingWr.delete(modelWorker);
            modelWorker.terminate();
            $(wrIdLoad).hide();
            $(wrId).removeClass();
            $(wrId).html(' ⚠ Error ');
            $(wrId).css('opacity', '1.0');
            $(wrId).addClass('text-danger');
            loadDifferentialWr(wr, res, slow, Date.now() - startTime);
        }

        WorkersComputingWr.add(modelWorker);
        modelWorker.postMessage(res.WinrateArray);
    }


}

function queryToModelInputArrays() {
    Query.Timestamp = new Date();
    let samples = [Query];
    for (let i = 0; i < 5; ++i) {
        samples.push({
            Timestamp: Query.Timestamp,
            IsBlueTeam: Query.IsBlueTeam,
            SummonerInfos: Query.SummonerInfos.map((x, j) => i == j ? null : x),
            Champions: Query.Champions,
            OtherChampions: Query.OtherChampions,
            Region: Query.Region,
        });
        samples.push({
            Timestamp: Query.Timestamp,
            IsBlueTeam: Query.IsBlueTeam,
            SummonerInfos: Query.SummonerInfos,
            Champions: Query.Champions.map((x, j) => i == j ? "" : x),
            OtherChampions: Query.OtherChampions,
            Region: Query.Region,
        });
        samples.push({
            Timestamp: Query.Timestamp,
            IsBlueTeam: Query.IsBlueTeam,
            SummonerInfos: Query.SummonerInfos,
            Champions: Query.Champions,
            OtherChampions: Query.OtherChampions.map((x, j) => i == j ? "" : x),
            Region: Query.Region,
        });
    }

    let inputs = samples.map(cCreateBatch);
    return inputs;
}

//let extensionID = 'mkbdkojjljgdiffmfkkgnenbcaelgpho'; //Prod
let extensionID = 'bohjgkpfikcleckommegpncajkbefiaf';
//let extensionID = 'bfljlejlklaoihcfacbfglenaefkkogl';
let ExtensionConnected = false;
let ExtensionError = "";
let CurrentErrorMsg = "";

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
        $('#syncChampion' + i).val(Names.ChampionIdToName[Query.Champions[i]] || "");
        $('#syncChampion' + i).css('font-weight', summW);
        $('#syncOpponent' + i).val(Names.ChampionIdToName[Query.OtherChampions[i]] || "");

        //Make sure nobody changes height
        $('#syncSummoner' + i).height(h);
        $('#syncChampion' + i).height(h);
    }
    $('#syncRegion').val(Names.RegionIdToName[Query.Region]);
    $('#syncBlueTeam').prop('checked', Query.IsBlueTeam);
}

let autoSyncDelay = 2000;
function syncMainLoop() {
    let loop = async () => {
        try { await ldtSync(); } catch (ex) { }
        setTimeout(loop, Math.max(100, autoSyncDelay));
    };
    setTimeout(loop, 1);
}

function moveToQuery() {
    location = getQueryPath();
}

function getQueryPath() {
    return '/?step=wr&region=' + Query.Region + '&team=' + encodeURIComponent(Query.Summoners.join(',')) + '&champs=' + encodeURIComponent(Query.Champions.join(',')) + '&otherChamps=' + encodeURIComponent(Query.OtherChampions.join(',')) + '&blue=' + Query.IsBlueTeam;
}

function setPath() {
    let newPath = $('#newPath').val();
    localStorage.setItem("lolPath", newPath);
    $('#setPathModal').modal('hide');
    $('#syncNow').click();
}

let SyncInProgress = false;
async function ldtSync() {
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
        if (Step != 'live') {
            Query = championSelectStatus;
            moveToQuery();
        } else {
            autoSyncDelay = 1000;
            if (JSON.stringify([Query.Summoners, Query.Champions, Query.OtherChampions, Query.Region]) == JSON.stringify([championSelectStatus.Summoners, championSelectStatus.Champions, championSelectStatus.OtherChampions, championSelectStatus.Region])) return;
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

function stopAllOngoingWorkers() {
    for (let w of WorkersComputingWr) {
        w.terminate();
        WorkersComputingWr.delete(w);
    }
}

async function getInfo() {
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

    stopAllOngoingWorkers();

    Query.SummonerInfos = Array(5).fill(null);
    if (/*TODO REMOVE*/ false && localStorage.getItem("lastRequest") == JSON.stringify({ summoners: Query.Summoners, region: Query.Region })) {
        Query.SummonerInfos = JSON.parse(localStorage.getItem("lastReply"));
    } else {
        let maxTries = 3;
        for (var try_ = 0; try_ < maxTries; ++try_) {
            if (try_ > 0) await sleep(4000);

            let remainingSummoners = Query.Summoners.map((x, i) => Query.SummonerInfos[i] == null && x != "" ? x : null);
            if (remainingSummoners.filter(x => x != null) == 0) break;

            let res = null;
            if (ExtensionConnected) {
                res = await extGetInfo(Query.Region, remainingSummoners);
            }
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
    }
    computeWr();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getInfoFromServer(region, summoners) {
    return await new Promise(resolve => {
        try {
            let ajaxData = { summoners: summoners.join(','), region: region };
            $.ajax({ method: "GET", url: "/LoadInfo", data: ajaxData }).done(function (msg) {
                if (msg.error) {
                    console.log(msg.error);
                    resolve(null);
                } else {
                    resolve(msg.result.map(x => { return x == null ? null : { tierInfo: JSON.parse(x.tierInfo), matchInfo: JSON.parse(x.matchInfo) }; }));
                }
            }).fail(function (jqXHR, textStatus) {
                console.log(textStatus);
                resolve(null);
            });
        } catch (ex) {
            console.log(ex);
            resolve(null);
        }
    });
}

async function startup() {
    ExtensionConnected = await extIsConnected();

    $('#syncNow').attr("disabled", false);
    $('#liveSwitch').attr("disabled", false);

    if (!ExtensionConnected) {
        $('.shake').fadeIn(100);
        //$('#syncNow').attr('onclick', 'location="/AutoLDT"');
        $('#syncNow').popover('dispose');
        $('#syncNow').popover({ html: true, container: 'body', trigger: 'focus', placement: 'bottom', content: () => '✗ Requires <a href="/AutoLDT">AutoLDT</a><br/>Click the back arrow above to return' });

        $('#liveSwitch').attr('onclick', 'location="/?step=live"');
        if (Step == 'live')
            location = "/AutoLDT";
    } else {
        if (Step == 'live') {
            $('#liveSwitch').attr('onclick', 'moveToQuery();');
            syncMainLoop();
        } else {
            $('#liveSwitch').attr('onclick', 'location="/?step=live"');
        }
        $('#syncNow').attr('onclick', 'ldtSync();');
        if (SyncOnLoad) {
            $('#syncNow').click();
        }
    }

    if (Step == 'wr') {
        syncContentWithQuery(); //Just for the nicer formatting
        await getInfo();
    }
}

function shareLink() {
    let url = 'https://www.loldodgetool.com' + getQueryPath();
    copyTextToClipboard(url);

    return false;
}

function loadOnOPGG() {
    if (Query.Summoners.filter(x => x && x.length > 0).length > 0 && Names.RegionIdToGg[Query.Region]) {
        window.open('https://' + Names.RegionIdToGg[Query.Region] + '.op.gg/multi/query=' + Query.Summoners.filter(x => x && x.length > 0).join('%2C'), '_blank');
    }
}

function loadOnPorofessor() {
    if (Query.Summoners.filter(x => x && x.length > 0).length > 0 && Names.RegionIdToGg[Query.Region]) {
        window.open('https://porofessor.gg/pregame/' + Names.RegionIdToGg[Query.Region] + '/' + Query.Summoners.filter(x => x && x.length > 0).join(','), '_blank');
    }
}

function updateLocalStorage() {
    localStorage.setItem("lastRequest", JSON.stringify({ summoners: Query.Summoners, region: Query.Region }));
    localStorage.setItem("lastReply", JSON.stringify(Query.SummonerInfos));

    let stats = JSON.parse(localStorage.getItem("summonerQueryStats")) || {};
    for (let summ of Object.keys(stats)) {
        stats[summ] *= 0.95;
    }
    for (let summ of Query.Summoners.filter(x => x != "")) {
        stats[summ] = (stats[summ] || 0) + .1;
    }
    let sorted = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);
    let leave = sorted.slice(100);
    for (let summ of leave) {
        delete stats[summ];
    }

    localStorage.setItem("summonerQueryStats", JSON.stringify(stats));
}

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.clipboard-on-click').popover({ html: true, container: 'body', trigger: 'click', placement: 'top', content: () => 'Link copied to clipboard' });

    startup();
});



// EXTENSION

let defaultLolPath = 'C:/Riot Games/League of Legends/';

let urls = {
    //see https://www.mingweisamuel.com/lcu-schema/tool/
    ChampSelectQuery: 'lol-champ-select/v1/session',
    SummonerNamesQuery: 'lol-summoner/v2/summoner-names', //?ids=[...]
    RegionQuery: 'lol-platform-config/v1/namespaces/LoginDataPacket/platformId',

    //MatchHistoryQueryV1: 'lol-match-history/v1/matchlist', //own matches with only info about own performance
    //MatchHistoryQueryV2: 'lol-match-history/v2/matchlist', //?begIndex=0&endIndex=1000  //same as above with paging
    //FriendMatchesQuery: 'lol-match-history/v1/friend-matchlists/', //{accountId} //same as above on other accountId
    CareerMatchesQuery: 'lol-career-stats/v1/summoner-games/', //{puuid} //same as above? on other puuid

    //SummonerInfoByIdQuery: 'lol-summoner/v1/summoners/', //{id} //get name, accountId and puuid
    SummonerInfoByNameQuery: 'lol-summoner/v1/summoners', //?name=... //get name, accountId and puuid
    RankedStatsQuery: 'lol-ranked/v1/ranked-stats/', //{puuid} //get tiers
    MatchInfoQuery: 'lol-match-history/v1/games/', //{gameId} //Get game details
};

async function extIsConnected() {
    return await new Promise(resolve => {
        try {
            chrome.runtime.sendMessage(extensionID, { type: "Connected", data: {} }, msg => {
                try {
                    if (!msg) {
                        ExtensionError = 'ConnectionLost';
                        resolve(null);
                    } else if (msg.error) {
                        ExtensionError = msg.error;
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                } catch (ex) {
                    ExtensionError = ex;
                    resolve(false);
                }
            });
        } catch (ex) {
            ExtensionError = ex;
            resolve(false);
        }
    });
}

async function extHasFileAccess() {
    return await new Promise(resolve => {
        try {
            chrome.runtime.sendMessage(extensionID, { type: "QueryFileAccessRequest", data: {} }, msg => {
                try {
                    if (!msg) {
                        ExtensionError = 'ConnectionLost';
                        resolve(null);
                    } else if (msg.error) {
                        ExtensionError = msg.error;
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                } catch (ex) {
                    ExtensionError = ex;
                    resolve(false);
                }
            });
        } catch (ex) {
            ExtensionError = ex;
            resolve(false);
        }
    });
}

async function extReadLockFile() {
    return await new Promise(resolve => {
        try {
            let path = localStorage.getItem("lolPath") || defaultLolPath;

            chrome.runtime.sendMessage(extensionID, { type: "ReadLockfileRequest", data: { path: path } }, msg => {
                try {
                    if (!msg) {
                        ExtensionError = 'ConnectionLost';
                        resolve(null);
                    } else if (msg.error) {
                        ExtensionError = msg.error;
                        resolve(null);
                    } else {
                        resolve(msg.data.lockfile);
                    }
                } catch (ex) {
                    ExtensionError = ex;
                    resolve(null);
                }
            });
        } catch (ex) {
            ExtensionError = ex;
            resolve(null);
        }
    });
}

async function extLcuRequest(lockfile, query) {
    return await new Promise(resolve => {
        try {
            chrome.runtime.sendMessage(extensionID, { type: "LcuRequest", data: { lockfile: lockfile, query: query } }, msg => {
                try {
                    if (!msg) {
                        ExtensionError = 'ConnectionLost';
                        resolve(null);
                    } else if (msg.error) {
                        ExtensionError = msg.error;
                        resolve(null);
                    } else {
                        resolve(JSON.parse(msg.data.response));
                    }
                } catch (ex) {
                    ExtensionError = ex;
                    resolve(null);
                }
            });
        } catch (ex) {
            ExtensionError = ex;
            resolve(null);
        }
    });
}


async function extGetChampionSelectStatus() {
    try {
        if (!(await extHasFileAccess())) return null;

        let lf = await extReadLockFile();
        if (null == lf) return null;

        let region = await extLcuRequest(lf, urls.RegionQuery);
        if (null == region) { ExtensionError = 'LcuRequestFailed'; return null; }

        let sessionO = await extLcuRequest(lf, urls.ChampSelectQuery);
        if (null == sessionO) return null;

        if (sessionO["httpStatus"] == 404) { ExtensionError = 'NotInChampionSelect'; return null; }

        let cellInfoIds = {};
        let blueTeam = true;
        for (let x of sessionO["myTeam"]) {
            let cellId = parseInt(x["cellId"]);
            blueTeam = cellId < 5;

            let sId = x["summonerId"].toString();

            let cId = x["championId"].toString();
            //if (cId == "0")
            //{
            //    cId = x["championPickIntent"].toString();
            //}

            cellInfoIds[cellId] = { summId: sId, champId: cId };
        }
        let opponentCellChampionIds = {};
        for (let x of sessionO["theirTeam"]) {
            let cellId = parseInt(x["cellId"]);

            let cId = x["championId"].toString();
            //if (cId == "0")
            //{
            //    cId = x["championPickIntent"].toString();
            //    if (cId != "0") { }
            //}
            opponentCellChampionIds[cellId] = cId;
        }

        //let draft = JSON.parse(sessionO["hasSimultaneousBans"]) && !JSON.parse(sessionO["hasSimultaneousPicks"]) && !JSON.parse(sessionO["isCustomGame"]);

        let summsO = await extLcuRequest(lf, urls.SummonerNamesQuery + '?ids=[' + Object.keys(cellInfoIds).map(x => cellInfoIds[x].summId).join(',') + ']');

        let summNames = {};
        for (let x of summsO) {
            summNames[x["summonerId"].toString()] = x["displayName"].toString();
        }

        let cellLastChamp = {};
        for (let x of sessionO["actions"]) {
            for (let y of x) {
                try {
                    let type = y["type"].toString();
                    //let ally = JSON.parse(y["isAllyAction"]);
                    let inProgress = JSON.parse(y["isInProgress"]);
                    let completed = JSON.parse(y["completed"]);
                    let championId = y["championId"].toString();
                    let cellId = parseInt(y["actorCellId"]);
                    if (type == "pick" && championId != "0") {
                        let finished = completed && !inProgress;
                        cellLastChamp[cellId] = { champId: championId, finished: finished };
                    }
                } catch (ex) { }
            }
        }

        let myTeam = Object.keys(cellInfoIds).map(cellId => {
            let cid = cellInfoIds[cellId];
            let summId = cid.summId;
            let champId = cid.champId;
            let lockedIn = champId != "0";
            if (cellLastChamp[cellId]) {
                if (champId == "0") champId = cellLastChamp[cellId].champId;
                lockedIn = cellLastChamp[cellId].finished;
            }
            let summoner = summNames[summId] || "";
            let champion = champId || "";
            return { summoner, champion, lockedIn };
        });

        let opponentTeam = Object.keys(opponentCellChampionIds).map(cellId => {
            let champId = opponentCellChampionIds[cellId];
            let lockedIn = champId != "0";
            if (cellLastChamp[cellId]) {
                if (champId == "0") champId = cellLastChamp[cellId].champId;
                lockedIn = cellLastChamp[cellId].finished;
            }
            let champion = champId || "";
            return { champion, lockedIn };
        });

        return {
            IsBlueTeam: blueTeam,
            Region: region,
            Summoners: (myTeam.map(x => x.summoner).concat(["", "", "", "", ""])).slice(0, 5),
            Champions: (myTeam.map(x => x.champion).concat(["", "", "", "", ""])).slice(0, 5),
            OtherChampions: (opponentTeam.map(x => x.champion).concat(["", "", "", "", ""])).slice(0, 5),
            SummonerInfos: []
        };
    } catch (ex) {
        ExtensionError = ex;
        return null;
    }
}


async function extGetInfo(region, summoners) {
    try {
        if (!(await extHasFileAccess())) return null;

        let lf = await extReadLockFile();
        if (null == lf) return null;

        let r = await extLcuRequest(lf, urls.RegionQuery);
        if (null == r) return null;

        if (region != r) {
            ExtensionError = 'Mismatching region ' + r + ' vs ' + region;
            return null;
        }

        return await Promise.all(summoners.map(sn => extGetSummonerInfo(lf, sn)));
    } catch (ex) {
        ExtensionError = ex;
        return null;
    }
}

async function extGetSummonerInfo(lockfile, summonerName) {
    try {
        if (!summonerName) return null;

        let info = await extLcuRequest(lockfile, urls.SummonerInfoByNameQuery + '?name=' + summonerName);
        if (null == info || !info.puuid) return null;
        let puuid = info.puuid;

        let [tierInfo, matchInfo] = await Promise.all([extLcuRequest(lockfile, urls.RankedStatsQuery + puuid), extLcuRequest(lockfile, urls.CareerMatchesQuery + puuid)]);
        if (null == tierInfo || null == matchInfo) return null;

        matchInfo = matchInfo.filter(x => x.queueType == 'rank5solo' || x.queueType == 'rank5flex'); // || x.queueType == 'blind5' || x.queueType == 'draft5'

        return { tierInfo, matchInfo };
    } catch (ex) {
        ExtensionError = ex;
        return null;
    }
}


// Transcribed from original code

function cCreateBatch(match) {
    let HistoryLen = 20;

    let timeLen = cTime2V(null, null, null).length;
    let champLen = cGetSelectionOneHotSize(Names.ChampionIdToIndex, Names.MaxChamps);
    let perfStatsLen = cParsePerformanceJson(null).stats.length;

    let globalInput = cGlobal2V(match);

    let enemyChamps = flat(Array.from(Array(5).keys()).map(i => cGetSelectionOneHotIndex('' + match.OtherChampions[i], Names.ChampionIdToIndex)));

    let parsedIPerformances = Array.from(Array(5).keys()).map(i => ((match.SummonerInfos[i] || {}).matchInfo || []).map(cParsePerformanceJson));

    let gameParticipants = {};
    for (let i = 0; i < 5; ++i) {
        for (let p of parsedIPerformances[i]) {
            if (!(p.gameId in gameParticipants)) gameParticipants[p.gameId] = [];
            gameParticipants[p.gameId].push(i);
        }
    }
    let matchPremades = [0.0, 0.0, 0.0, 0.0, 0.0];
    for (let gp of Object.keys(gameParticipants)) {
        if (gameParticipants[gp].length <= 1) continue;
        for (let x of gameParticipants[gp]) {
            matchPremades[x]++;
        }
    }

    let myTeam = flat(Array.from(Array(5).keys()).map(i => {
        let tier = cParseTierJson((match.SummonerInfos[i] || {}).tierInfo || null);

        let premade = [matchPremades[i] / 10.0];

        let champ = cGetSelectionOneHotIndex(match.Champions[i] || "", Names.ChampionIdToIndex);

        let history = flat(Array.from(Array(HistoryLen).keys()).map(mi => {
            let perf = parsedIPerformances[i][HistoryLen - 1 - mi] || {};
            let historyTime = cTime2V(perf.time, match.Region, match.Timestamp);
            let historyChamp = cGetSelectionOneHotIndex('' + perf.championId, Names.ChampionIdToIndex);
            let historyPerf = perf.stats || cParsePerformanceJson(null).stats;
            return historyTime.concat(historyChamp).concat(historyPerf);
        }));

        let pp = parsedIPerformances[i];
        let avgCount = [pp.length / 100.0];
        let avgChamp = cAverageArrays(pp.map(p => cGetSelectionOneHot('' + p.championId, Names.ChampionIdToIndex, Names.MaxChamps)), champLen);
        let avgPerf = cAverageArrays(pp.map(p => p.stats), perfStatsLen);
        let avg = avgCount.concat(avgChamp).concat(avgPerf);

        pp = pp.filter(p => p.championId == match.Champions[i]);

        let sameChampCount = [pp.length / 100.0];
        let sameChampPerf = cAverageArrays(pp.map(p => p.stats), perfStatsLen);
        let sameChamp = sameChampCount.concat(sameChampPerf);

        return tier.concat(premade).concat(champ).concat(history).concat(avg).concat(sameChamp);
    }));

    let inputs = globalInput.concat(enemyChamps).concat(myTeam);

    return inputs;
}

function cTierToDouble(tier, division, lp) {
    let wDivision = true;
    let score = 0;
    if (tier == "IRON") score += 0;
    else if (tier == "BRONZE") score += 400 * 1;
    else if (tier == "SILVER") score += 400 * 2;
    else if (tier == "GOLD") score += 400 * 3;
    else if (tier == "PLATINUM") score += 400 * 4;
    else if (tier == "DIAMOND") score += 400 * 5;
    else if (tier.includes("MASTER") || tier == "CHALLENGER") { score += 400 * 6; wDivision = false; } //Includes Grandmaster
    else return -1000;

    if (!wDivision) { }
    else if (division == "I") score += 100 * (4 - 1);
    else if (division == "II") score += 100 * (4 - 2);
    else if (division == "III") score += 100 * (4 - 3);
    else if (division == "IV") score += 100 * (4 - 4);

    score += lp;

    return score;
}

function cParseTierJson(o) {
    if (o == null) return Array(4).fill(0.0);

    zex = f => { try { return f(); } catch (ex) { return null; } }

    return [
        (zex(() => cTierToDouble(o["queueMap"]["RANKED_SOLO_5x5"]["tier"], o["queueMap"]["RANKED_SOLO_5x5"]["division"], o["queueMap"]["RANKED_SOLO_5x5"]["leaguePoints"])) || -1000) / 1000,
        (zex(() => cTierToDouble(o["queueMap"]["RANKED_FLEX_SR"]["tier"], o["queueMap"]["RANKED_FLEX_SR"]["division"], o["queueMap"]["RANKED_SOLO_5x5"]["leaguePoints"])) || -1000) / 1000,

        Math.max(
            zex(() => cTierToDouble(o["queueMap"]["RANKED_SOLO_5x5"]["previousSeasonAchievedTier"], o["queueMap"]["RANKED_SOLO_5x5"]["previousSeasonAchievedDivision"], 0)) || -1000,
            zex(() => cTierToDouble(o["queueMap"]["RANKED_SOLO_5x5"]["previousSeasonEndTier"], o["queueMap"]["RANKED_SOLO_5x5"]["previousSeasonEndDivision"], 0)) || -1000) / 1000,

        Math.max(
            zex(() => cTierToDouble(o["queueMap"]["RANKED_FLEX_SR"]["previousSeasonAchievedTier"], o["queueMap"]["RANKED_FLEX_SR"]["previousSeasonAchievedDivision"], 0)) || -1000,
            zex(() => cTierToDouble(o["queueMap"]["RANKED_FLEX_SR"]["previousSeasonEndTier"], o["queueMap"]["RANKED_FLEX_SR"]["previousSeasonEndDivision"], 0)) || -1000) / 1000,
    ];
}

function cParsePerformanceJson(o) {
    if (o == null) {
        return { time: null, gameId: null, championId: null, stats: Array(28 + cGetSelectionOneHotSize(Names.LaneToIndex) + cGetSelectionOneHotSize(Names.QueueTypeToIndex)).fill(0.0) };
    }

    let time = new Date(o["timestamp"]);
    let championId = o["championId"];
    let gameId = o["gameId"];

    let s = o["stats"]["CareerStats.js"];
    let stats = [
        o["teamId"] == 100 ? 1.0 : -1,
        s["assists"] / 100,
        s["ccScore"] / 100,
        s["convertedKillAndAssists"] / 100,
        s["csAtLaningEnd"] / 100,
        s["csDiffAtLaningEnd"] / 10,
        s["csScore"] / 100,
        s["damage"] / 100000,
        s["damageShieldedOnTeammates"] / 10000,
        s["deaths"] / 100,
        s["doubleKills"],
        s["goldAtLaningEnd"] / 10000,
        s["goldDiffAtLaningEnd"] / 1000,
        s["goldEarned"] / 10000,
        s["healsOnTeammates"] / 10000,
        s["kills"] / 100,
        s["objectiveTakenInvolved"] / 10,
        s["pentaKills"],
        s["position"],
        s["quadraKills"],
        s["roamDominanceScore"] / 10,
        s["teamDamage"] / 100000,
        s["teamKills"] / 100,
        s["teamObjectivesTaken"] / 10,
        s["timePlayed"] / 1000000,
        s["tripleKills"],
        s["victory"],
        s["visionScore"] / 100,
    ]
        .concat(cGetSelectionOneHot(o["lane"], Names.LaneToIndex))
        .concat(cGetSelectionOneHot(o["queueType"], Names.QueueTypeToIndex));
    return { time, gameId, championId, stats };
}

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}

function cTime2V(time, region, referenceTime) {
    if (time == null || region == null || referenceTime == null) {
        return Array(5).fill(0.0);
    }

    let i = Names.Regions.indexOf(region);
    if (i >= 0) {
        time = time.addHours(Names.RegionGMTHourOffsets[i]);
    }

    let h = (time.getUTCHours() + (time.getUTCMinutes() + time.getUTCSeconds() / 60) / 60) / 24.0;
    let dw = time.getUTCDay() / 7.0; //SUNDAY == 0

    return [
        Math.sin(h * 2 * Math.PI) * .1, Math.cos(h * 2 * Math.PI) * .1,
        Math.sin(dw * 2 * Math.PI) * .1, Math.cos(dw * 2 * Math.PI) * .1,
        Math.exp(-Math.abs((time - referenceTime) / (7 * 24 * 60 * 60 * 1000)))
    ];
}

function cGlobal2V(match) {
    if (match == null) {
        return [0.0].concat(cTime2V(null, null, null)).concat(cGetSelectionOneHot("", Names.RegionToIndex));

    }
    return [match.IsBlueTeam ? -1.0 : 1].concat(cTime2V(match.Timestamp, match.Region, match.Timestamp)).concat(cGetSelectionOneHot(match.Region, Names.RegionToIndex));
}

function cAverageArrays(arrs, size) {
    let count = 0;
    let res = Array(size).fill(0.0);
    for (let arr of arrs) {
        count++;
        for (let i = 0; i < res.length; ++i) {
            res[i] += arr[i];
        }
    }
    if (count > 0) {
        for (let i = 0; i < res.length; ++i) {
            res[i] /= count;
        }

    }
    return res;
}

function cIndexToOneHot(i, size) {
    let arr = [];
    for (let j = 0; j < size; ++j) arr.push(0);
    if (0 <= i && i < size) arr[i] = 1;
    else throw "Index out of bounds";
    return arr;
}

function cGetSelectionOneHot(s, getIndex, maxCollectionLen) {
    return cIndexToOneHot(cGetSelectionOneHotIndex(s, getIndex), cGetSelectionOneHotSize(getIndex, maxCollectionLen));
}

function cGetSelectionOneHotSize(getIndex, maxCollectionLen) {
    return 1 + Math.max(maxCollectionLen || 0, Object.keys(getIndex).length);
}

function cGetSelectionOneHotIndex(s, getIndex) {
    if (s == null) return 0;
    let i = getIndex[s];
    if (i >= 0) return 1 + i;
    return 0;
}


var flat = Array.prototype.flat ? function (array) { return Array.prototype.flat.call(array); } : function (array) { return Array.prototype.concat.apply([], array); };



