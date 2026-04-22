// #region SETUP
d3.select("body")
    .append("div")
    .attr("id", "ncr-dash")
        .style("display", "grid")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("max-width", "666px")
        .style("margin-left", "auto")
        .style("margin-right", "auto");

d3.select("#ncr-dash")
    .append("h1")
    .text("Review of Claims of Noncitizen Registrants and Voters")
    .style("text-align", "center")
    .style("font-family", "'Source Serif 4', sans-serif");

var svg = d3.select("#ncr-dash")
    .append("svg")
    .attr("width", "100%")
    .attr("viewBox", "0 0 675 550");

var ncrViz = svg.append("g")
    .attr("id", "ncr-viz")

var ncrText = d3.select("#ncr-dash")
    .append("div")
    .attr("id", "ncr-text")
    .style("font-family", "'Source Serif 4', sans-serif");

var ncrHeader = ncrText.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("column-gap", "20px")

var stateHeader = ncrHeader.append("h2").attr("id", "state-header")

var activeTag = ncrHeader.append("p")
    .style("border-radius", "10px")
    .style("background-color", "#bebebe")
    .style("padding", "7px")
    .style("display", "none");

var saveTag = ncrHeader.append("p")
    .style("border-radius", "10px")
    .style("background-color", "#bebebe")
    .style("padding", "7px")
    .style("display", "none");

var ncrSum = ncrText.append("div")
    .attr("id", "ncr-sum")
    .style("font-size", "18px")
    .style("line-height", "30px")
    .style("display", "grid")
    .style("grid-template-columns", "auto auto auto")
    .style("margin-bottom", "50px");

var bodyWidth = document.getElementsByTagName("body")[0].getBoundingClientRect().width;

// #endregion

Promise.all([
    d3.json("data/tile_map.json"),
    d3.dsv("|", "data/summaries.csv")
]).then(function([tileMap, ncrData]) {
    // #region DATA MERGE

    var found;
    const nullSum = [{summary: "No cases of noncitizens registering to vote or voting."}];

    // merge summaries to tilemap
    var currSums = []; // holds all the summaries in an array
    var currSum; // the current summary
    for (var i = 0; i < tileMap.states.length; i++) {
        var tileState = tileMap.states[i].name;
        found = false;

        for (var j = 0; j < ncrData.length; j++) {
            var ncrState = ncrData[j].state;

            // reset currSums
            if (tileState != ncrState) {
                currSums = [];
            }

            if (tileState == ncrState) {
                // add summaries
                currSum = {date: ncrData[j].date, summary: ncrData[j].summary,
                    link: ncrData[j].link, link_text: ncrData[j].link_text};
                currSums.push(currSum);
                tileMap.states[i].summaries = currSums;

                // add active reg count, save boolean, and ncr boolean
                tileMap.states[i].active_reg = ncrData[j].active_reg;
                tileMap.states[i].save = ncrData[j].save;
                tileMap.states[i].value = 1;

                found = true;
            };
        };

        if (found == false) {
            tileMap.states[i].summaries = nullSum;
            tileMap.states[i].value = 0;
            tileMap.states[i].active_reg = "NA";
            tileMap.states[i].save = "NA";
        };

    };

    console.log(tileMap)
    // #endregion

    // #region MAP SETUP
    var colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#bebebe", "#9a53b7"]);

    var mapContainer = ncrViz.append("g")
        .attr("id", "map-container")

    // scale variable
    var mapSize = 8;

    var map = mapContainer.append("g")
        .attr("id", "map")
        .selectAll("rect")
        .data(tileMap.states)
        .enter()
        .append("rect")
            .attr("x", d => d.x * mapSize)
            .attr("y", d => d.y * mapSize)
            .attr("width", 5 * mapSize)
            .attr("height", 5 * mapSize)
            .attr("fill", d => colorScale(d.value))
            .attr("cursor", "pointer")


    // state abbreviations for tiles
    mapContainer.append("g")
        .attr("id", "map-abb")
        .selectAll("text")
        .data(tileMap.states)
        .enter()
        .append("text")
            .text(d => d.abb)
            .attr("x", d => d.x * mapSize + 19)
            .attr("y", d => d.y * mapSize + 25)
            .attr("fill", "black")
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .attr("pointer-events", "none")
            .style("font-family", "'Source Serif 4', sans-serif");;

    // center map
    var mapWidth = mapContainer.node().getBoundingClientRect().width;
    var mapx = mapContainer.node().getBoundingClientRect().x;
    mapContainer.attr("transform", "translate(" + ((666-mapWidth) / 2 - (mapx-((bodyWidth-666)/2))) + ", 0)");

    // #endregion


    // #region UPDATE TEXT
    var updateText = function(e, d) {
        stateHeader.text(d.name);

        // update active tag
        if (d.active_reg != "NA") {
            activeTag
                .style("display", "block")
                .text(d.active_reg)
        } else {
            activeTag
                .style("display", "none")
        }

        // update save tag
        if (d.save == "Y") {
            saveTag
                .style("display", "block")
                .text("MOU to use SAVE")
        } else {
            saveTag
                .style("display", "none")
        }

        ncrSum.selectAll("*").remove();

        var dates = [];
        var currSum;
        var currTimeline;

        for (var i = 0; i < d.summaries.length; i++) {

            // if there are no summaries, just add the text and break
            if (d.value == 0) {
                ncrSum
                    .append("div")
                    .append("p")
                    .text(d.summaries[i].summary)
                    .style("margin-top", "0");

                break;
            }

            if (!dates.includes(d.summaries[i].date)) {
                dates.push(d.summaries[i].date);

                ncrSum
                    .append("div")
                    .append("p")
                    .text(d.summaries[i].date)
                    .style("margin-top", "0")
                    .style("text-align", "right");

                currTimeline = ncrSum
                    .append("div")
                    .style("display", "flex")
                    .style("flex-direction", "column")
                    .style("margin-left", "10px")
                    .style("margin-right", "10px");
                    
                // circle
                currTimeline
                    .append("div")
                    .style("width", "20px")
                    .style("height", "20px")
                    .style("background-color", "#bebebe")
                    .style("border-radius", "50%")
                    .style("flex", "none");

                // rectangle
                currTimeline
                    .append("div")
                    .style("width", "3px")
                    .style("height", "100%")
                    .style("background-color", "#bebebe")
                    .style("margin-left", "auto")
                    .style("margin-right", "auto");

                currSum = ncrSum.append("div")

                currSum
                    .append("p")
                    .text(d.summaries[i].summary)
                    .attr("id", d.name + "-" + i)
                    .style("margin-top", "0")

            } else {
                currSum
                    .append("p")
                    .text(d.summaries[i].summary)
                    .attr("id", d.name + "-" + i)
            }

        var currP = document.getElementById(d.name + "-" + i)
        currP.innerHTML = currP.innerHTML.replace(d.summaries[i].link_text, "<a href='" + d.summaries[i].link + "' target='_blank'>" + d.summaries[i].link_text + "</a>");
        
    };
            
        const header = document.getElementById("state-header")

        header.scrollIntoView({
            behavior: "smooth"
        });
    };

    map
        .on("click", updateText)

    // #endregion

});


    