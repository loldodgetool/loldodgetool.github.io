
let WorkersComputingWr = new Set();
function stopAllOngoingWorkers() {
    for (let w of WorkersComputingWr) {
        w.terminate();
        WorkersComputingWr.delete(w);
    }
}

function newWorker() {
    return new Worker(URL.createObjectURL(new Blob(["" + __evaluate.toString() + "\nonmessage=function(e){if (e && e.data && e.data.length == " + __inputSize + ") postMessage(__evaluate(e.data));}"], { type: 'text/javascript' })));
}

async function computeWrOnWorker(query) {
	if (query == null) return null;
	
	return await new Promise(resolve => {
		let w = newWorker();

		w.onmessage = function (e) {
			WorkersComputingWr.delete(w);
			w.terminate();
			
			resolve(e.data[0]);
		};
		w.onerror = function (e) {
			WorkersComputingWr.delete(w);
			w.terminate();
			
			resolve(null);
		};
		WorkersComputingWr.add(w);
		
		let arr = cCreateBatch(query);
		w.postMessage(arr);
	});
}


// Transcribed from C code

var flat = Array.prototype.flat ? function (array) { return Array.prototype.flat.call(array); } : function (array) { return Array.prototype.concat.apply([], array); };

function cCreateBatch(match) {
    let HistoryLen = 20;

    let timeLen = cTime2V(null, null, null).length;
    let champLen = cGetSelectionOneHotSize(Patch.ChampionIdToIndex, Patch.MaxChamps);
    let perfStatsLen = cParsePerformanceJson(null).stats.length;

    let globalInput = cGlobal2V(match);

    let enemyChamps = flat(Array.from(Array(5).keys()).map(i => cGetSelectionOneHotIndex('' + match.OtherChampions[i], Patch.ChampionIdToIndex)));

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

        let champ = cGetSelectionOneHotIndex(match.Champions[i] || "", Patch.ChampionIdToIndex);

        let history = flat(Array.from(Array(HistoryLen).keys()).map(mi => {
            let perf = parsedIPerformances[i][HistoryLen - 1 - mi] || {};
            let historyTime = cTime2V(perf.time, match.Region, match.Timestamp);
            let historyChamp = cGetSelectionOneHotIndex('' + perf.championId, Patch.ChampionIdToIndex);
            let historyPerf = perf.stats || cParsePerformanceJson(null).stats;
            return historyTime.concat(historyChamp).concat(historyPerf);
        }));

        let pp = parsedIPerformances[i];
        let avgCount = [pp.length / 100.0];
        let avgChamp = cAverageArrays(pp.map(p => cGetSelectionOneHot('' + p.championId, Patch.ChampionIdToIndex, Patch.MaxChamps)), champLen);
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
        return { time: null, gameId: null, championId: null, stats: Array(28 + cGetSelectionOneHotSize(Patch.LaneToIndex) + cGetSelectionOneHotSize(Patch.QueueTypeToIndex)).fill(0.0) };
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
        .concat(cGetSelectionOneHot(o["lane"], Patch.LaneToIndex))
        .concat(cGetSelectionOneHot(o["queueType"], Patch.QueueTypeToIndex));
    return { time, gameId, championId, stats };
}

function cTime2V(time, region, referenceTime) {
    if (time == null || region == null || referenceTime == null) {
        return Array(5).fill(0.0);
    }

	time = time.addHours(Patch.RegionGMTHourOffsets[region] ?? 0);

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
        return [0.0].concat(cTime2V(null, null, null)).concat(cGetSelectionOneHot("", Patch.RegionToIndex));

    }
    return [match.IsBlueTeam ? -1.0 : 1].concat(cTime2V(match.Timestamp, match.Region, match.Timestamp)).concat(cGetSelectionOneHot(match.Region, Patch.RegionToIndex));
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



