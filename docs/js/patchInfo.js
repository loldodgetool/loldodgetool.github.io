let Patch = {
    RegionToName: {"KR":"Korea","JP1":"Japan","NA1":"N America","EUW1":"Europe W","EUN1":"Europe N & E","OC1":"Oceania","BR1":"Brazil","LA2":"Latin America S","LA1":"Latin America N","RU":"Russia","TR1":"Turkey"},
    RegionToIndex: {"KR":0,"JP1":1,"NA1":2,"EUW1":3,"EUN1":4,"OC1":5,"BR1":6,"LA2":7,"LA1":8,"RU":9,"TR1":10},
    RegionGMTHourOffsets: {"KR":9,"JP1":9,"NA1":-7,"EUW1":1,"EUN1":2,"OC1":11,"BR1":-3,"LA2":-3,"LA1":-5,"RU":3,"TR1":3},
    RegionIdToGg: {'BR1':'br','EUN1':'eune','EUW1':'euw','JP1':'jp','KR':'','LA1':'lan','LA2':'las','NA1':'na','OC1':'oce','RU':'ru','TR1':'tr'},
    //Lanes: ['JUNGLE','TOP','BOTTOM','MID'],
    LaneToIndex: {"JUNGLE":0,"TOP":1,"BOTTOM":2,"MID":3},
    //QueueTypes: ['rank5solo','blind5','rank5flex','draft5'],
    QueueTypeToIndex: {"rank5solo":0,"blind5":1,"rank5flex":2,"draft5":3},
    ChampionIdToName: {"266":"Aatrox","103":"Ahri","84":"Akali","12":"Alistar","32":"Amumu","34":"Anivia","1":"Annie","523":"Aphelios","22":"Ashe","136":"Aurelion Sol","268":"Azir","432":"Bard","53":"Blitzcrank","63":"Brand","201":"Braum","51":"Caitlyn","164":"Camille","69":"Cassiopeia","31":"Cho'Gath","42":"Corki","122":"Darius","131":"Diana","119":"Draven","36":"Dr. Mundo","245":"Ekko","60":"Elise","28":"Evelynn","81":"Ezreal","9":"Fiddlesticks","114":"Fiora","105":"Fizz","3":"Galio","41":"Gangplank","86":"Garen","150":"Gnar","79":"Gragas","104":"Graves","120":"Hecarim","74":"Heimerdinger","420":"Illaoi","39":"Irelia","427":"Ivern","40":"Janna","59":"Jarvan IV","24":"Jax","126":"Jayce","202":"Jhin","222":"Jinx","145":"Kai'Sa","429":"Kalista","43":"Karma","30":"Karthus","38":"Kassadin","55":"Katarina","10":"Kayle","141":"Kayn","85":"Kennen","121":"Kha'Zix","203":"Kindred","240":"Kled","96":"Kog'Maw","7":"LeBlanc","64":"Lee Sin","89":"Leona","876":"Lillia","127":"Lissandra","236":"Lucian","117":"Lulu","99":"Lux","54":"Malphite","90":"Malzahar","57":"Maokai","11":"Master Yi","21":"Miss Fortune","62":"Wukong","82":"Mordekaiser","25":"Morgana","267":"Nami","75":"Nasus","111":"Nautilus","518":"Neeko","76":"Nidalee","56":"Nocturne","20":"Nunu & Willump","2":"Olaf","61":"Orianna","516":"Ornn","80":"Pantheon","78":"Poppy","555":"Pyke","246":"Qiyana","133":"Quinn","497":"Rakan","33":"Rammus","421":"Rek'Sai","526":"Rell","58":"Renekton","107":"Rengar","92":"Riven","68":"Rumble","13":"Ryze","360":"Samira","113":"Sejuani","235":"Senna","147":"Seraphine","875":"Sett","35":"Shaco","98":"Shen","102":"Shyvana","27":"Singed","14":"Sion","15":"Sivir","72":"Skarner","37":"Sona","16":"Soraka","50":"Swain","517":"Sylas","134":"Syndra","223":"Tahm Kench","163":"Taliyah","91":"Talon","44":"Taric","17":"Teemo","412":"Thresh","18":"Tristana","48":"Trundle","23":"Tryndamere","4":"Twisted Fate","29":"Twitch","77":"Udyr","6":"Urgot","110":"Varus","67":"Vayne","45":"Veigar","161":"Vel'Koz","254":"Vi","234":"Viego","112":"Viktor","8":"Vladimir","106":"Volibear","19":"Warwick","498":"Xayah","101":"Xerath","5":"Xin Zhao","157":"Yasuo","777":"Yone","83":"Yorick","350":"Yuumi","154":"Zac","238":"Zed","115":"Ziggs","26":"Zilean","142":"Zoe","143":"Zyra"},
    ChampionIdToIndex: {"1":1,"10":10,"101":85,"102":86,"103":87,"104":88,"105":89,"106":90,"107":91,"11":11,"110":92,"111":93,"112":94,"113":95,"114":96,"115":97,"117":98,"119":99,"12":12,"120":100,"121":101,"122":102,"126":103,"127":104,"13":13,"131":105,"133":106,"134":107,"136":108,"14":14,"141":109,"142":110,"143":111,"145":112,"147":113,"15":15,"150":114,"154":115,"157":116,"16":16,"161":117,"163":118,"164":119,"17":17,"18":18,"19":19,"2":2,"20":20,"201":120,"202":121,"203":122,"21":21,"22":22,"222":123,"223":124,"23":23,"234":154,"235":125,"236":126,"238":127,"24":24,"240":128,"245":129,"246":130,"25":25,"254":131,"26":26,"266":132,"267":133,"268":134,"27":27,"28":28,"29":29,"3":3,"30":30,"31":31,"32":32,"33":33,"34":34,"35":35,"350":135,"36":36,"360":136,"37":37,"38":38,"39":39,"4":4,"40":40,"41":41,"412":137,"42":42,"420":138,"421":139,"427":140,"429":141,"43":43,"432":142,"44":44,"45":45,"48":46,"497":143,"498":144,"5":5,"50":47,"51":48,"516":145,"517":146,"518":147,"523":148,"526":153,"53":49,"54":50,"55":51,"555":149,"56":52,"57":53,"58":54,"59":55,"6":6,"60":56,"61":57,"62":58,"63":59,"64":60,"67":61,"68":62,"69":63,"7":7,"72":64,"74":65,"75":66,"76":67,"77":68,"777":150,"78":69,"79":70,"8":8,"80":71,"81":72,"82":73,"83":74,"84":75,"85":76,"86":77,"875":151,"876":152,"89":78,"9":9,"90":79,"91":80,"92":81,"96":82,"98":83,"99":84},
    ChampionNameToSprite: {"Aatrox":{file:"champion0.png",x:0,y:0},"Ahri":{file:"champion0.png",x:48,y:0},"Akali":{file:"champion0.png",x:96,y:0},"Alistar":{file:"champion0.png",x:144,y:0},"Amumu":{file:"champion0.png",x:192,y:0},"Anivia":{file:"champion0.png",x:240,y:0},"Annie":{file:"champion0.png",x:288,y:0},"Aphelios":{file:"champion0.png",x:336,y:0},"Ashe":{file:"champion0.png",x:384,y:0},"Aurelion Sol":{file:"champion0.png",x:432,y:0},"Azir":{file:"champion0.png",x:0,y:48},"Bard":{file:"champion0.png",x:48,y:48},"Blitzcrank":{file:"champion0.png",x:96,y:48},"Brand":{file:"champion0.png",x:144,y:48},"Braum":{file:"champion0.png",x:192,y:48},"Caitlyn":{file:"champion0.png",x:240,y:48},"Camille":{file:"champion0.png",x:288,y:48},"Cassiopeia":{file:"champion0.png",x:336,y:48},"Cho'Gath":{file:"champion0.png",x:384,y:48},"Corki":{file:"champion0.png",x:432,y:48},"Darius":{file:"champion0.png",x:0,y:96},"Diana":{file:"champion0.png",x:48,y:96},"Draven":{file:"champion0.png",x:96,y:96},"Dr. Mundo":{file:"champion0.png",x:144,y:96},"Ekko":{file:"champion0.png",x:192,y:96},"Elise":{file:"champion0.png",x:240,y:96},"Evelynn":{file:"champion0.png",x:288,y:96},"Ezreal":{file:"champion0.png",x:336,y:96},"Fiddlesticks":{file:"champion0.png",x:384,y:96},"Fiora":{file:"champion0.png",x:432,y:96},"Fizz":{file:"champion1.png",x:0,y:0},"Galio":{file:"champion1.png",x:48,y:0},"Gangplank":{file:"champion1.png",x:96,y:0},"Garen":{file:"champion1.png",x:144,y:0},"Gnar":{file:"champion1.png",x:192,y:0},"Gragas":{file:"champion1.png",x:240,y:0},"Graves":{file:"champion1.png",x:288,y:0},"Hecarim":{file:"champion1.png",x:336,y:0},"Heimerdinger":{file:"champion1.png",x:384,y:0},"Illaoi":{file:"champion1.png",x:432,y:0},"Irelia":{file:"champion1.png",x:0,y:48},"Ivern":{file:"champion1.png",x:48,y:48},"Janna":{file:"champion1.png",x:96,y:48},"Jarvan IV":{file:"champion1.png",x:144,y:48},"Jax":{file:"champion1.png",x:192,y:48},"Jayce":{file:"champion1.png",x:240,y:48},"Jhin":{file:"champion1.png",x:288,y:48},"Jinx":{file:"champion1.png",x:336,y:48},"Kai'Sa":{file:"champion1.png",x:384,y:48},"Kalista":{file:"champion1.png",x:432,y:48},"Karma":{file:"champion1.png",x:0,y:96},"Karthus":{file:"champion1.png",x:48,y:96},"Kassadin":{file:"champion1.png",x:96,y:96},"Katarina":{file:"champion1.png",x:144,y:96},"Kayle":{file:"champion1.png",x:192,y:96},"Kayn":{file:"champion1.png",x:240,y:96},"Kennen":{file:"champion1.png",x:288,y:96},"Kha'Zix":{file:"champion1.png",x:336,y:96},"Kindred":{file:"champion1.png",x:384,y:96},"Kled":{file:"champion1.png",x:432,y:96},"Kog'Maw":{file:"champion2.png",x:0,y:0},"LeBlanc":{file:"champion2.png",x:48,y:0},"Lee Sin":{file:"champion2.png",x:96,y:0},"Leona":{file:"champion2.png",x:144,y:0},"Lillia":{file:"champion2.png",x:192,y:0},"Lissandra":{file:"champion2.png",x:240,y:0},"Lucian":{file:"champion2.png",x:288,y:0},"Lulu":{file:"champion2.png",x:336,y:0},"Lux":{file:"champion2.png",x:384,y:0},"Malphite":{file:"champion2.png",x:432,y:0},"Malzahar":{file:"champion2.png",x:0,y:48},"Maokai":{file:"champion2.png",x:48,y:48},"Master Yi":{file:"champion2.png",x:96,y:48},"Miss Fortune":{file:"champion2.png",x:144,y:48},"Wukong":{file:"champion2.png",x:192,y:48},"Mordekaiser":{file:"champion2.png",x:240,y:48},"Morgana":{file:"champion2.png",x:288,y:48},"Nami":{file:"champion2.png",x:336,y:48},"Nasus":{file:"champion2.png",x:384,y:48},"Nautilus":{file:"champion2.png",x:432,y:48},"Neeko":{file:"champion2.png",x:0,y:96},"Nidalee":{file:"champion2.png",x:48,y:96},"Nocturne":{file:"champion2.png",x:96,y:96},"Nunu & Willump":{file:"champion2.png",x:144,y:96},"Olaf":{file:"champion2.png",x:192,y:96},"Orianna":{file:"champion2.png",x:240,y:96},"Ornn":{file:"champion2.png",x:288,y:96},"Pantheon":{file:"champion2.png",x:336,y:96},"Poppy":{file:"champion2.png",x:384,y:96},"Pyke":{file:"champion2.png",x:432,y:96},"Qiyana":{file:"champion3.png",x:0,y:0},"Quinn":{file:"champion3.png",x:48,y:0},"Rakan":{file:"champion3.png",x:96,y:0},"Rammus":{file:"champion3.png",x:144,y:0},"Rek'Sai":{file:"champion3.png",x:192,y:0},"Rell":{file:"champion3.png",x:240,y:0},"Renekton":{file:"champion3.png",x:288,y:0},"Rengar":{file:"champion3.png",x:336,y:0},"Riven":{file:"champion3.png",x:384,y:0},"Rumble":{file:"champion3.png",x:432,y:0},"Ryze":{file:"champion3.png",x:0,y:48},"Samira":{file:"champion3.png",x:48,y:48},"Sejuani":{file:"champion3.png",x:96,y:48},"Senna":{file:"champion3.png",x:144,y:48},"Seraphine":{file:"champion3.png",x:192,y:48},"Sett":{file:"champion3.png",x:240,y:48},"Shaco":{file:"champion3.png",x:288,y:48},"Shen":{file:"champion3.png",x:336,y:48},"Shyvana":{file:"champion3.png",x:384,y:48},"Singed":{file:"champion3.png",x:432,y:48},"Sion":{file:"champion3.png",x:0,y:96},"Sivir":{file:"champion3.png",x:48,y:96},"Skarner":{file:"champion3.png",x:96,y:96},"Sona":{file:"champion3.png",x:144,y:96},"Soraka":{file:"champion3.png",x:192,y:96},"Swain":{file:"champion3.png",x:240,y:96},"Sylas":{file:"champion3.png",x:288,y:96},"Syndra":{file:"champion3.png",x:336,y:96},"Tahm Kench":{file:"champion3.png",x:384,y:96},"Taliyah":{file:"champion3.png",x:432,y:96},"Talon":{file:"champion4.png",x:0,y:0},"Taric":{file:"champion4.png",x:48,y:0},"Teemo":{file:"champion4.png",x:96,y:0},"Thresh":{file:"champion4.png",x:144,y:0},"Tristana":{file:"champion4.png",x:192,y:0},"Trundle":{file:"champion4.png",x:240,y:0},"Tryndamere":{file:"champion4.png",x:288,y:0},"Twisted Fate":{file:"champion4.png",x:336,y:0},"Twitch":{file:"champion4.png",x:384,y:0},"Udyr":{file:"champion4.png",x:432,y:0},"Urgot":{file:"champion4.png",x:0,y:48},"Varus":{file:"champion4.png",x:48,y:48},"Vayne":{file:"champion4.png",x:96,y:48},"Veigar":{file:"champion4.png",x:144,y:48},"Vel'Koz":{file:"champion4.png",x:192,y:48},"Vi":{file:"champion4.png",x:240,y:48},"Viego":{file:"champion4.png",x:288,y:48},"Viktor":{file:"champion4.png",x:336,y:48},"Vladimir":{file:"champion4.png",x:384,y:48},"Volibear":{file:"champion4.png",x:432,y:48},"Warwick":{file:"champion4.png",x:0,y:96},"Xayah":{file:"champion4.png",x:48,y:96},"Xerath":{file:"champion4.png",x:96,y:96},"Xin Zhao":{file:"champion4.png",x:144,y:96},"Yasuo":{file:"champion4.png",x:192,y:96},"Yone":{file:"champion4.png",x:240,y:96},"Yorick":{file:"champion4.png",x:288,y:96},"Yuumi":{file:"champion4.png",x:336,y:96},"Zac":{file:"champion4.png",x:384,y:96},"Zed":{file:"champion4.png",x:432,y:96},"Ziggs":{file:"champion5.png",x:0,y:0},"Zilean":{file:"champion5.png",x:48,y:0},"Zoe":{file:"champion5.png",x:96,y:0},"Zyra":{file:"champion5.png",x:144,y:0}},
    MaxChamps: 199,
};
