const axios = require("axios");
const moment = require("moment");
const fs = require("fs");

const year = new Date().getFullYear();
const url = `http://global.nba.com/wp-content/themes/nba-global/lib/proxy.php?url=http%253A//stats.nba.com/stats/internationalbroadcasterschedule%3FLeagueID%3D00%26Season%3D${year}%26RegionID%3D11`
let args = process.argv.slice(2).map(g => g.toLowerCase());

let output = "terminal";
let mode = "double";
const indexOut = args.indexOf("-o");
const indexMode = args.indexOf("-m");

if (indexOut != -1)
	output = args[indexOut + 1] + ".csv";

if (indexMode != -1)
	mode = args[indexMode + 1];

const maxIndex = Math.max(indexOut, indexMode);
args = args.slice(maxIndex < 0 ? 0 : maxIndex + 2);

if (mode === "single" && args.length)
	args = args.join(" ").split(" ");

console.log("Output: ", output);
console.log("Modo: ", mode);
console.log("Argumentos de busca: ", args);
console.log();

convertDate = (date, time) => moment(date + " " + time, "MM/DD/YYYY hh:mm A").add(3, "hours").format("MM/DD/YYYY");

convertTime = time => moment(time, "hh:mm A").add(3, "hours").format("hh:mm A");

getData = async () => {
	console.log("Recuperando dados de http://global.nba.com...");
	return axios.get(url)
	.then(response => response.data.resultSets[1].CompleteGameList)
	.catch(error => {
		console.log(error);
	});
};


extractNecessaryData = data => {
	console.log("Extraindo dados necessarios...");
	return data.map(g => ({
		homeTeam: g.htNickName,
		awayTeam: g.vtNickName,
		startDate: g.date,
		startTime: g.time,
		endDate: convertDate(g.date, g.time),
		endTime: convertTime(g.time),
		broadcaster: g.broadcasterName,
	}))
};

filterGames = (data, args) => {
	console.log("Filtrando os jogos...");
	if (args.length == 0)
		return data;

	return data.filter(game => {
		let teams = ([game.htShortName, game.htNickName, game.vtShortName, game.vtNickName]).map(g => g.toLowerCase());
		if (mode === "single")
			teams = teams.join(" ").split(" ");
		
		return args.some(arg => teams.includes(arg));
	});
};

dataStringfy = (data) => {
	return `${data.homeTeam} @ ${data.awayTeam},${data.startDate},${data.startTime},${data.endDate},${data.endTime},${data.broadcaster}`;
};

header = "Subject,Start Date,Start Time,End Date,End Time,Description";

main = async () => {
	const data = await getData();
	const filteredData = filterGames(data, args);
	const games = extractNecessaryData(filteredData);
	let resultString = header;
	games.forEach(g => resultString += "\n" + dataStringfy(g));
	if (output === "terminal")
		console.log("Gerando saída...\n\n" + resultString);
	else {
		console.log(`Gerando arquivo ${output}...`);
		fs.writeFileSync(output, resultString);
		console.log("Pronto!");
	}
}

main()
.then()
.catch(err => console.log("Ops, Houve algo errado:\n", err));
