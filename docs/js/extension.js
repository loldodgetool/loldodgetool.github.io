let extensionID = 'mkbdkojjljgdiffmfkkgnenbcaelgpho'; //Prod
//let extensionID = 'bohjgkpfikcleckommegpncajkbefiaf';
//let extensionID = 'bfljlejlklaoihcfacbfglenaefkkogl';

let ExtensionError = "";

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
                        resolve(false);
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


