"use strict";

(function () {
    const mapContainer = document.getElementById("map");

    let width = mapContainer.offsetWidth;
    let height = mapContainer.offsetHeight;
    let scale = 0.9;
    let projection = d3.geoAlbersUsa();
    let path = d3.geoPath().projection(projection);
    let map = void 0;
    let usa = void 0;
    let states = void 0;

    let mode = "selection";
    let selectedStates = [];

    // score
    let rightAnswers = 0;
    let wrongAnswers = 0;

    function hideTooltip() {
        var div = document.getElementById('tooltip');
        div.style.display = 'none';
    }

    function onZoom(event) {
        hideTooltip();
        map.attr(
            "transform",
            `translate(${event.transform.x}, ${event.transform.y})scale(${event.transform.k})`
        );
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 50])
        .on("zoom", onZoom);

    function geoID(d) {
        return "c" + d.id;
    };

    function onClick(event, d) {
        if (mode === "interim") {
            return;
        }
        if (mode === "selection") {
            const stateInfo = {
                elID: geoID(d),
                name: d.properties.name
            }
            if (selectedStates.find(c => c.elID === stateInfo.elID)) {
                selectedStates = selectedStates.filter(c => c.elID !== stateInfo.elID);
                hideTooltip();
            }
            else {
                selectedStates.push(stateInfo);
                var div = document.getElementById('tooltip');
                div.style.left = event.pageX + 'px';
                div.style.top = event.pageY + 'px';
                const name = d.properties.name;
                const flagFileName = name.replace(" ", "_");
                div.innerHTML =
                    `<img class="flag" src="svg_flags/${flagFileName}.svg" /> <span>${name}</span>`;
                div.style.display = 'block';
            }
            d3.selectAll('path').attr('fill', "#ccc");
            for (let c of selectedStates) {
                d3.select('#' + c.elID).attr('fill', "lightgreen");
            }

            const startBtn = document.getElementById("start-btn");
            startBtn.disabled = selectedStates.length < 2;

        }
        else { // test mode
            if (d.properties.a3 === pickedState.a3) {
                updateScore(rightAnswers + 1, wrongAnswers);
                d3.selectAll('path').attr('fill', "#ccc");
                d3.select('#' + geoID(d)).attr('fill', "lightgreen");
                mode = "interim";
                setTimeout(pickState, 200);
            }
            else {
                updateScore(rightAnswers, wrongAnswers + 1);
                d3.selectAll('path').attr('fill', "#ccc");
                d3.select('#' + geoID(d)).attr('fill', "lightcoral");
            }
        }
    };

    function updateScore(newRightAnswer, newWrongAnswers) {
        if (newRightAnswer !== rightAnswers) {
            rightAnswers = newRightAnswer;
            document.getElementById("right-answers").innerHTML = `${rightAnswers}`;
        }
        if (newWrongAnswers !== wrongAnswers) {
            wrongAnswers = newWrongAnswers;
            document.getElementById("wrong-answers").innerHTML = `${wrongAnswers}`;
        }
    }

    let svg = d3.select("#map")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");


    d3.json('geodata/states-10m.json').then(function (data) {
        states = topojson.feature(data, data.objects.states);

        projection.scale(1).translate([0, 0]);
        const b = path.bounds(states);
        const s = scale / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
        const t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
        projection.scale(s).translate(t);

        map = svg.append('g').attr('class', 'boundary');
        usa = map.selectAll('path').data(states.features);

        usa.enter()
            .append('path')
            .attr('d', path)
            .attr('id', geoID)
            .on('click', onClick);

        usa.attr('fill', '#eee');

        usa.exit().remove();

        svg.call(zoom);
    });


    function hideDiv(divID) {
        const div = document.getElementById(divID);
        div.style.display = "none";
    }

    function showDiv(divID) {
        const div = document.getElementById(divID);
        div.style.display = "block";
    }

    document.getElementById("select-btn").onclick = function () {
        mode = "selection";
        hideDiv("test-tools");
        showDiv("selection-tools");
        d3.selectAll('path').attr('fill', "#ccc");
        for (let c of selectedStates) {
            d3.select('#' + c.elID).attr('fill', "lightgreen");
        }
        document.getElementById("state-name").innerHTML = "";
    }

    document.getElementById("start-btn").onclick = function () {
        mode = "test";
        hideDiv("selection-tools");
        showDiv("test-tools");
        updateScore(0, 0);
        hideTooltip();
        pickState();

    }

    document.getElementById("clear-selection-btn").onclick = function () {
        hideTooltip();
        selectedStates = [];
        d3.selectAll('path').attr('fill', "#ccc");
        for (let c of selectedStates) {
            d3.select('#' + c.elID).attr('fill', "lightgreen");
        }
        document.getElementById("start-btn").disabled = true;
    }

    let pickedState = "";
    let previousPickedState = "";
    function pickState() {
        mode = "test";
        while (true) {
            pickedState = getRandomArrayElement(selectedStates);
            if (pickedState !== previousPickedState) {
                previousPickedState = pickedState;
                break;
            }
        }
        d3.selectAll('path').attr('fill', "#ccc");
        const div = document.getElementById("state-name");
        const name = pickedState.name;
        const flagFileName = name.replace(" ", "_");
        div.innerHTML = `<img class="flag" src="svg_flags/${flagFileName}.svg" /> <span>${name}</span>`;
    }

    function getRandomArrayElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
})();
