const proxyUrl = "https://infinite-springs-66524.herokuapp.com/";
const mpkUrl = "http://einfo.erzeszow.pl/Home/GetTimeTableReal?busStopId=";

var latin_map = {
    'ą': 'a',
    'ę': 'e',
    'ł': 'l',
    'ć': 'c',
    'ź': 'z',
    'ż': 'z',
    'ń': 'n',
    'ó': 'o',
    'ś': 's',
    'Ą': 'A',
    'Ę': 'E',
    'Ł': 'L',
    'Ć': 'Ć',
    'Ź': 'Z',
    'Ż': 'Z',
    'Ó': 'O',
    'Ś': 'S',
    'Ń': 'N'
};

String.prototype.latinise = function () {
    return this.replace(/[^A-Za-z0-9]/g, function (x) {
        return latin_map[x] || x;
    })
};

String.prototype.isLatin = function () {
    return this == this.latinise();
};

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
                    return 0;
                }
                return response.text();
            }
        )
        .catch(function (err) {
            console.log('Fetch Error ', err);
        });
    return data;
}

async function getData(url) {
    const data = await fetch(url)
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log('There was a problem. Status Code: ' +
                        response.status);
                    return 0;
                }
                return response.json();
            }
        )
        .catch(function (err) {
            console.log('Fetch Error ', err);
        });
    return data;
}

var allStops = new Array;
async function fetchAllStops() {
    allStops = await getData('./allStopsArr.json')
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

    if (parsedData.name != undefined) {
        newContent.id = "content_" + parsedData.id;
        newContent.className = "content";

        let busStopTitle = document.createElement("div");
        busStopTitle.className = 'busStopTitle';

        let newBusStopName = document.createElement("p");
        newBusStopName.id = "busStopName_" + parsedData.id;
        newBusStopName.className = "busStopName";

        let deleteButton = document.createElement("p");
        deleteButton.className = "deleteStop";
        deleteButton.innerHTML = "✖";
        deleteButton.setAttribute('onclick', 'removeStop(' + parsedData.id + ')');

        let newBusLines = document.createElement("div");
        newBusLines.id = "busLines_" + parsedData.id;
        newBusLines.className = "container";

        busStopTitle.appendChild(newBusStopName);
        busStopTitle.appendChild(deleteButton);
        newContent.appendChild(busStopTitle);
        newContent.appendChild(newBusLines);
        wrapper.appendChild(newContent);

        let txt = "";
        console.log(parsedData);
        document.getElementById("busStopName_" + parsedData.id).innerHTML = parsedData.name;
        if (parsedData.lines.length > 0) {
            parsedData.lines.forEach(element => {
                let nr = element.nr;
                let dir = element.dir;
                let t = element.time;
                let veh = element.veh;
                let icon;
                if (veh === 'T') {
                    icon = `<img title='Biletomat w autobusie' src='./biletomat.png'>`
                } else if (veh === 'N') {
                    icon = `<img src='./brakbiletomatu.png'>`
                }
                txt += "<span class='busNr border'>" + nr + "</span>" +
                    "<span class='busDir border'>" + dir + "</span>" +
                    "<span class='busVeh border'>" + icon + "</span>" +
                    "<span class='busTime border'>" + t + "</span>";
            });
        } else {
            txt = "brak autobusów :("
        }
        document.getElementById("busLines_" + parsedData.id).innerHTML = txt;
    } else {
        newContent.innerHTML = `
        <br><br>
        <p style='text-align: center; padding: 100px auto; width: '>
            błąd pobierania danych<br><br>sprawdź połączenie z Internetem i spróbuj ponownie :)
        </p>
        <br><br>`;
        wrapper.appendChild(newContent);
        newContent.scrollIntoView();
        loader.style.display = 'none';
    }
}

var loader = document.getElementById("loader");

var savedStops = new Array;
var loadedStops = localStorage.getItem('stopsCoJedzieRze');
if (localStorage.getItem('stopsCoJedzieRze') === null) {
    savedStops = new Array;
} else {
    savedStops = JSON.parse(loadedStops);
}

if (savedStops != 0) {
    document.getElementById("zeroStops").style.display = "none";
    savedStops.forEach(element => {
        loader.style.display = 'block';
        let newStop = parseData(element);
        newStop.then(function (result) {
            printData(result);
            loader.style.display = 'none';
        });
    });
} else {
    document.getElementById("zeroStops").style.display = "block";
}

// EVENT LISTENERS
document.getElementById("newStopID").addEventListener("focusout", function () {
    let name = document.getElementById("newStopID").value;
    if (name == "") {
        document.getElementById('search').style.display = "none";
    }
});

document.getElementById("newStopID").addEventListener("focusin", function () {
    let html = document.getElementById("search").innerHTML;
    if (html != "") {
        document.getElementById('search').style.display = 'block';
    }
});

document.getElementById("newStopID").addEventListener("keyup", function () {
    let name = document.getElementById("newStopID").value;
    if (name != "") {
        searchStop(name);
        document.getElementById('search').style.display = 'block';
    } else {
        document.getElementById('search').style.display = 'none';
        document.getElementById('search').innerHTML = "";
    }
});

function addStop(id) {
    if (id !== "") {
        if (Number.isInteger(id)) {
            if (!savedStops.includes(id)) {
                loader.style.display = 'block';
                let busstop = parseData(id);
                busstop.then(function (result) {
                    printData(result);
                    let newElement = document.getElementById("busStopName_" + id);
                    newElement.scrollIntoView();
                    loader.style.display = 'none';
                });
                savedStops.push(id);
                localStorage.setItem('stopsCoJedzieRze', JSON.stringify(savedStops));

                document.getElementById("zeroStops").style.display = "none";
                document.getElementById("newStopID").value = "";
                document.getElementById('search').style.display = "none";
                document.getElementById('search').innerHTML = "";
            } else alert("Ten przystanek już istnieje");
        } else alert("Podaj liczbę");
    } else {
        alert("Podaj ID przystanku");
    }
}

function removeStop(id) {
    document.getElementById("content_" + id).remove();
    var index = savedStops.indexOf(id);
    savedStops.splice(index, 1);
    localStorage.setItem('stopsCoJedzieRze', JSON.stringify(savedStops));
    if (savedStops == 0) {
        document.getElementById("zeroStops").style.display = "block";
    }
}

function searchStop(search) {
    let found = filterIt(allStops, search);
    let newSearch = String(search);
    let txt = ``;
    found.forEach(element => {
        txt += `<li onclick='addStop(` + element.id + `)'>` + element.name + `</li>`;
    });
    document.getElementById('search').innerHTML = txt;
}

function filterIt(arr, searchKey) {
    return arr.filter(function (obj) {
        return Object.keys(obj).some(function (key) {
            let upperSearch = searchKey.toUpperCase();
            let stringSearch = String(upperSearch);
            let latinSearch = stringSearch.latinise();
            return obj[key].includes(latinSearch);
        })
    });
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};

var allStops = new Array;
function getAllStops() {
    console.log("getAllStops");
    for (let index = 0; index < 1600; index++) {
        let newStop = new Object;
        let busstop = parseData(index);
        sleep(10);
        busstop.then(function (result) {
            if (result.name != undefined) {
                console.log(result.id);
                newStop.id = result.id;
                newStop.name = result.name.toUpperCase();
                newStop.nameD = result.name.toUpperCase().latinise();
                console.log(newStop.nameD);
                console.log(newStop.name);
                allStops.push(newStop)
            }
        });
    }
    var allStopsObject = convertArrayToObject(allStops, 'id');
    console.log("allStops:", allStops);
    console.log("allStopsObject:", allStopsObject);
}