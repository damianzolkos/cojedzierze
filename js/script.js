const proxyUrl = "https://infinite-springs-66524.herokuapp.com/";
const mpkUrl = "http://einfo.erzeszow.pl/Home/GetTimeTableReal?busStopId=";

async function getBusStopXML(busStopId) {
    let url = proxyUrl + mpkUrl + busStopId;
    const data = await fetch(url, {
            method: 'GET',
            url: url
        })
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log('There was a problem. Status Code: ' + response.status);
                    return response.status;
                }
                return response.text();
            }
        )
        .catch(function (err) {
            console.log('Fetch Error ', err);
        });
    return data;
}

var savedStops = [];
var loadedStops = localStorage.getItem('stops');
// console.log("loadedStops:", loadedStops);
if (localStorage.getItem('stops') === null) {
    savedStops = [];
} else {
    savedStops = JSON.parse(loadedStops);
}
// console.log("savedStops:", savedStops);

if (savedStops != 0) {
    document.getElementById("zeroStops").style.display = "none";
    savedStops.forEach(element => {
        // console.log(element);
        let newStop = parseData(element);
        newStop.then(function (result) {
            // console.log("result:", result);
            printData(result);
        });
    });
} else {
    document.getElementById("zeroStops").style.display = "block";
}

async function parseData(busStopId) {
    let parser = new DOMParser();
    var newData = new Object;
    await getBusStopXML(busStopId).then(function (response) {
            let parsedXML = parser.parseFromString(response, 'application/xml');
            let schedules = parsedXML.getElementsByTagName("Schedules")[0];
            let stop = schedules.getElementsByTagName("Stop")[0];
            let busStopName = stop.getAttribute("name");
            let howManyBusses = stop.getElementsByTagName("R").length;

            newData.name = busStopName;
            newData.time = schedules.getAttribute("time");
            newData.id = stop.getAttribute("id");
            var lines = new Array;

            for (i = 0; i < howManyBusses; i++) {
                let nr = stop.getElementsByTagName("R")[i].getAttribute("nr");
                let dir = stop.getElementsByTagName("R")[i].getAttribute("dir");
                let t = stop.getElementsByTagName("R")[i].getElementsByTagName("S")[0].getAttribute("t");
                let veh = stop.getElementsByTagName("R")[i].getElementsByTagName("S")[0].getAttribute("veh");
                let line = new Object;
                line.nr = nr;
                line.dir = dir;
                line.veh = veh;
                line.time = t;
                lines.push(line);
            }
            newData.lines = lines;
        })
        .catch(function (error) {
            console.log(error);
        });
    return newData;
}

function printData(parsedData) {
    let wrapper = document.getElementById("wrapper");
    let newContent = document.createElement("div");
    newContent.id = "content_" + parsedData.id;
    newContent.className = "content";
    let newBusStopName = document.createElement("p");
    newBusStopName.id = "busStopName_" + parsedData.id;
    newBusStopName.className = "busStopName border";
    let newBusLines = document.createElement("div");
    newBusLines.id = "busLines_" + parsedData.id;
    newBusLines.className = "container";

    newContent.appendChild(newBusStopName);
    newContent.appendChild(newBusLines);
    wrapper.appendChild(newContent);

    let txt = "";
    document.getElementById("busStopName_" + parsedData.id).innerHTML = parsedData.name +
        "<span class='deleteStop'><button class='remove' onClick='removeStop(" + parsedData.id + ")'>X</button></span>";
    if (parsedData.lines.length > 0) {
        parsedData.lines.forEach(element => {
            let nr = element.nr;
            let dir = element.dir;
            let t = element.time;
            let veh = element.veh;

            txt += "<span class='busNr border'>" + nr + "</span>" +
                "<span class='busDir border'>" + dir + "</span>" +
                "<span class='busVeh border'>" + veh + "</span>" +
                "<span class='busTime border'>" + t + "</span>";
        });
    } else {
        txt = "brak autobusów :("
    }
    document.getElementById("busLines_" + parsedData.id).innerHTML = txt;
}

function removeStop(id) {
    // console.log(id);
    document.getElementById("content_" + id).remove();
    var index = savedStops.indexOf(id);
    savedStops.splice(index, 1);
    // console.log(savedStops);
    localStorage.setItem('stops', JSON.stringify(savedStops));
    if (savedStops == 0) {
        document.getElementById("zeroStops").style.display = "block";
    }
}

// EVENT LISTENERS
document.getElementById("addNewStop").addEventListener("click", function () {
    let id = parseInt(document.getElementById("newStopID").value);
    if (id !== "") {
        if (Number.isInteger(id)) {
            if (!savedStops.includes(id)) {
                let busstop = parseData(id);
                busstop.then(function (result) {
                    // console.log(result);
                    printData(result);
                });
                // console.log("savedStops:", savedStops);
                // console.log(id);
                savedStops.push(id);
                localStorage.setItem('stops', JSON.stringify(savedStops));

                document.getElementById("zeroStops").style.display = "none";
                document.getElementById("newStopID").value = "";
            } else alert("Ten przystanek już istnieje");
        } else alert("Podaj liczbę");
    } else {
        alert("Podaj ID przystanku");
    }
});