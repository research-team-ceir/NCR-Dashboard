// #region SETUP
function center(selection, y) {
    document.fonts.ready.then(() => {
        var width = selection.node().getBoundingClientRect().width;
        var x = selection.node().getBBox().x;
        selection.attr("transform", "translate(" + ((666-width)/2 - x) + "," + y + ")");
    });
};

d3.select("#ncr-dashboard-container")
    .append("div")
    .attr("id", "ncr-dash")
        .style("display", "grid")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("max-width", "666px")
        .style("margin-left", "auto")
        .style("margin-right", "auto");

d3.select("#ncr-dash")
    .append("p")
    .text("Click a state to see claims of registration or voting by possible noncitizens.    ")
    .style("font-weight", "bold")
    .style("font-size", "18px")
    .style("text-align", "left")
    .style("margin-bottom", "0")
    .style("font-family", "'Source Serif 4', sans-serif");

d3.select("#ncr-dash")
    .append("p")
    .text("As of July 2, 2026")
    .style("text-align", "right")
    .style("font-style", "italic")
    .style("font-family", "'Source Serif 4', sans-serif");

var svg = d3.select("#ncr-dash")
    .append("svg")
    .attr("width", "100%")
    .attr("viewBox", "0 0 666 520");

var ncrViz = svg.append("g")
    .attr("id", "ncr-viz");

// text under map
var ncrText = d3.select("#ncr-dash")
    .append("div")
    .attr("id", "ncr-text")
    .style("font-family", "'Source Serif 4', sans-serif");

var ncrHeader = ncrText.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("column-gap", "20px");

var stateHeader = ncrHeader.append("h2").attr("id", "state-header");

// tag that highlights that a state uses SAVE
var saveTag = ncrHeader.append("p") 
    .style("border-radius", "10px")
    .style("background-color", "#efc55b")
    .style("padding", "7px")
    .style("display", "none");

var closeBtn = ncrHeader
    .append("span")
    .html("&times")
    .style("font-size", "40px")
    .style("margin-left", "auto")
    .style("cursor", "pointer")
    .style("display", "none");

var ncrProfile = ncrText.append("div")
    .attr("id", "ncr-profile")
    .style("margin-bottom", "20px");

var ncrSum = ncrText.append("div")
    .attr("id", "ncr-sum")
    .style("font-size", "18px")
    .style("line-height", "30px")
    .style("display", "grid")
    .style("grid-template-columns", "auto auto auto")
    .style("margin-bottom", "50px");

// #endregion

Promise.all([
    d3.json("https://research-team-ceir.github.io/NCR-Dashboard/data/tile_map.json"),
    d3.dsv("|", "https://research-team-ceir.github.io/NCR-Dashboard/data/summaries.csv"),
    d3.dsv("|", "https://research-team-ceir.github.io/NCR-Dashboard/data/profiles.csv")
]).then(function([tileMap, ncrData, profiles]) {
    // #region DATA MERGE
    var found;
    const nullSum = [{summary: "No reported cases found of possible noncitizens registering to vote or voting."}];

    // merge summaries to tilemap
    var currSums = []; // holds all the summaries in an array
    var currSum; // the current summary
    for (var i = 0; i < tileMap.states.length; i++) {
        var tileState = tileMap.states[i].name;
        found = false;

        // loop through profiles
        for (var j = 0; j < profiles.length; j++) {
            var profileState = profiles[j].state;

            if (tileState == profileState) {
                tileMap.states[i].profile = profiles[j].profile;
                tileMap.states[i].save = profiles[j].save;
            };
        };

        // loop through summaries
        for (var j = 0; j < ncrData.length; j++) {
            var ncrState = ncrData[j].state;

            // reset currSums
            if (tileState != ncrState) {
                currSums = [];
            } else if (tileState == ncrState) {
                // add summaries
                currSum = {date: ncrData[j].date, summary: ncrData[j].summary,
                    link: ncrData[j].link, link_text: ncrData[j].link_text};
                currSums.push(currSum);
                tileMap.states[i].summaries = currSums;

                // boolean for whether or not a state has a NCR summary
                tileMap.states[i].value = 1;
                found = true;
            };
        };

        if (found == false) {
            tileMap.states[i].summaries = nullSum;
            tileMap.states[i].value = 0;
            tileMap.states[i].save = "NA";
        };

    };

    // #endregion

    // #region MAP SETUP
    var colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#bebebe", "#b36bcf"]);

    var mapContainer = ncrViz.append("g")
        .attr("id", "map-container");

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
    mapContainer.call(center, 0);

    // #endregion

    // #region LOGO
    var logo = ncrViz
        .append("g")
        .attr("id", "logo");

    logo
        .append("svg:image")
        .attr("xlink:href", "https://research-team-ceir.github.io/NCR-Dashboard/images/CEIR_Logo_Vertical_OneColor_LightBlue.png")
        .attr("x", 666 - 60)
        .attr("y", 520 - 60)
        .attr("width", 50)
        .attr("height", 50);

    // #endregion


    // #region UPDATE TEXT
    var updateText = function(e, d) {
        stateHeader.text(d.name);
        ncrProfile.text(d.profile);

        ncrText.style("display", "block");
        closeBtn.style("display", "block");

        // bold and italicize profile text
        var profileP = document.getElementById("ncr-profile");

        var actReg = profileP.textContent.match(/((\d+.\d million)|(\d+ million))|(\d+,\d+)/)[0];
        profileP.innerHTML = profileP.innerHTML.replace(/((\d+.\d million)|(\d+ million))|(\d+,\d+)/, "<b>" + actReg + "</b>");

        var perc = profileP.textContent.match(/\d.\d+%/);
        profileP.innerHTML = profileP.innerHTML.replace(/\d.\d+%/, "<b>" + perc + "</b>");

        // update save tag
        if (d.save == "Y") {
            saveTag
                .style("display", "block")
                .text("Uses SAVE");

        } else {
            saveTag
                .style("display", "none");
        };

        ncrSum.selectAll("*").remove();

        var dates = [];

        for (var i = 0; i < d.summaries.length; i++) {

            // if there are no summaries, just add the text and break
            if (d.value == 0) {
                ncrSum
                    .append("div")
                    .append("p")
                    .text(d.summaries[i].summary)
                    .style("margin-top", "0");
                    
                break;
            } else {
                ncrProfile.style("display", "block");
            }
    
            // adding summaries
            if (!dates.includes(d.summaries[i].date)) {
                // group summaries by date
                dates.push(d.summaries[i].date);

                // date
                ncrSum
                    .append("div")
                    .append("p")
                    .text(d.summaries[i].date)
                    .style("margin-top", 0)
                    .style("text-align", "right");

                // circle and vertical line that make the "timeline" visual
                var currTimeline = ncrSum
                    .append("div")
                    .style("display", "flex")
                    .style("flex-direction", "column")
                    .style("margin-left", "10px")
                    .style("margin-right", "10px");

                // weird work around to get the circles to align with the date
                if (i == 0) {
                    currTimeline
                        .append("div")
                        .style("margin-top", "6px");
                } else {
                    currTimeline
                        .append("div")
                        .style("width", "3px")
                        .style("height", "6px")
                        .style("background-color", "#bebebe")
                        .style("margin-left", "auto")
                        .style("margin-right", "auto");
                }

                // circle
                currTimeline
                    .append("div")
                    .style("width", "20px")
                    .style("height", "20px")
                    .style("background-color", "#bebebe")
                    .style("border-radius", "50%")
                    .style("flex", "none");

                // rectangle
                var rect = currTimeline
                    .append("div")
                    .style("width", "3px")
                    .style("height", "100%")
                    .style("background-color", "#bebebe")
                    .style("margin-left", "auto")
                    .style("margin-right", "auto");

                // summary
                var currSum = ncrSum.append("div");
                var sums = d.summaries[i].summary.split("||");

                for (j = 0; j < sums.length; j++) {
                    currSum
                        .append("p")
                        .text(sums[j])
                        .attr("id", d.name + "-" + i)
                        .style("margin-top", 0);
                };

            // if there is no summary add the default text
            } else {
                currSum
                    .append("p")
                    .text(d.summaries[i].summary)
                    .attr("id", d.name + "-" + i);
            };

        // italicize update text
        var updateP = document.getElementById(d.name + "-" + i);
        var updateTxt = updateP.textContent.match(/Update.*:/);
        updateP.innerHTML = updateP.innerHTML.replace(/Update.*:/, "<i>" + updateTxt + "</i>");

        // add link to text
        var linkP = document.getElementById(d.name + "-" + i);
        var currLinks = d.summaries[i].link.split("||");
        var currLinkTexts = d.summaries[i].link_text.split("||");

        for (var j = 0; j < currLinks.length; j++) {
            linkP.innerHTML = linkP.innerHTML.replace(currLinkTexts[j], "<a href='" + currLinks[j] + "' target='_blank'>" + currLinkTexts[j] + "</a>");
        };
        
    };
            
        document.getElementById("state-header").scrollIntoView({
            behavior: "smooth"
        });
    };

    map
        .on("click", updateText);

    closeBtn
        .on("click", function() {
            ncrText.style("display", "none")
        });

    // #endregion

});


    