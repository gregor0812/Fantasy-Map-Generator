"use strict";

// functions to save the project to a file
async function saveMap(method) {

  



  if (customization) return tip("Map cannot be saved in EDIT mode, please complete the edit and retry", false, "error");
  closeDialogs("#alert");

  try {
    const mapData = prepareMapData();
    const filename = getFileName() + ".map";

    saveToStorage(mapData, method === "storage"); // any method saves to indexedDB
    if (method === "machine") saveToMachine(mapData, filename);
    if (method === "dropbox") saveToDropbox(mapData, filename);
  } catch (error) {
    ERROR && console.error(error);
    alertMessage.innerHTML = /* html */ `An error is occured on map saving. If the issue persists, please copy the message below and report it on ${link(
      "https://github.com/Azgaar/Fantasy-Map-Generator/issues",
      "GitHub"
    )}. <p id="errorBox">${parseError(error)}</p>`;

    $("#alert").dialog({
      resizable: false,
      title: "Saving error",
      width: "28em",
      buttons: {
        Retry: function () {
          $(this).dialog("close");
          saveMap(method);
        },
        Close: function () {
          $(this).dialog("close");
        }
      },
      position: {my: "center", at: "center", of: "svg"}
    });
  }
}

function prepareMapData() {
  const date = new Date();
  const dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  const license = "File can be loaded in azgaar.github.io/Fantasy-Map-Generator";
  const params = [version, license, dateString, seed, graphWidth, graphHeight, mapId].join("|");

  fdbset(fdbref(window.fdb,'map/params'),{
    version: version,
    license: license,
    dateString: dateString,
    seed: seed,
    graphwidth: graphWidth,
    graphHeight: graphHeight,
    mapId: mapId,
  });
  const settings = [
    distanceUnitInput.value,
    distanceScaleInput.value,
    areaUnit.value,
    heightUnit.value,
    heightExponentInput.value,
    temperatureScale.value,
    "", // previously used for barSize.value
    "", // previously used for barLabel.value
    "", // previously used for barBackColor.value
    "", // previously used for barBackColor.value
    "", // previously used for barPosX.value
    "", // previously used for barPosY.value
    populationRate,
    urbanization,
    mapSizeOutput.value,
    latitudeOutput.value,
    "", // previously used for temperatureEquatorOutput.value
    "", // previously used for tempNorthOutput.value
    precOutput.value,
    JSON.stringify(options),
    mapName.value,
    +hideLabels.checked,
    stylePreset.value,
    +rescaleLabels.checked,
    urbanDensity,
    longitudeOutput.value
  ].join("|");

  fdbset(fdbref(window.fdb,'map/settings'),{
    distanceUnitInput: distanceUnitInput.value,
    distanceScaleInput: distanceScaleInput.value,
    areaUnit: areaUnit.value,
    heightUnit: heightUnit.value,
    heightExponentInput: heightExponentInput.value,
    temperatureScale: temperatureScale.value, 
    populationRate: populationRate,
    urbanization: urbanization,
    mapsizeOutput: mapSizeOutput.value,
    latitudeOutput: latitudeOutput.value,
    precOutput: precOutput.value,
    options: options,
    mapName: mapName.value,
    hideLabels: +hideLabels.checked,
    stylePreset: stylePreset.value,
    rescaleLabels: +rescaleLabels.checked,
    urbanDensity: urbanDensity,
    longitudeOutput: longitudeOutput.value
  });

  const coords = JSON.stringify(mapCoordinates);
  const biomes = [biomesData.color, biomesData.habitability, biomesData.name].join("|");
  const notesData = JSON.stringify(notes);
  var rulersString = null;
  if (rulers){
     rulersString = rulers.toString();
  }
  if (!rulersString){
    rulersString = "empty";
  }
  const fonts = JSON.stringify(getUsedFonts(svg.node()));

  fdbset(fdbref(window.fdb,'map/options'),{
    coords: mapCoordinates,
    biomes: biomes,
    notesData: notes,
    rulersString: rulersString,
    fonts: getUsedFonts(svg.node())
  });

  // save svg
  const cloneEl = document.getElementById("map").cloneNode(true);

  // reset transform values to default
  cloneEl.setAttribute("width", graphWidth);
  cloneEl.setAttribute("height", graphHeight);
  cloneEl.querySelector("#viewbox").removeAttribute("transform");

  cloneEl.querySelector("#ruler").innerHTML = ""; // always remove rulers

  const serializedSVG = new XMLSerializer().serializeToString(cloneEl);

  fdbset(fdbref(window.fdb,'map/serializedsvg'),{
    serializedSVG: serializedSVG
  });

  const {spacing, cellsX, cellsY, boundary, points, features, cellsDesired} = grid;
  const gridGeneral = JSON.stringify({spacing, cellsX, cellsY, boundary, points, features, cellsDesired});
  const packFeatures = JSON.stringify(pack.features);
  const cultures = JSON.stringify(pack.cultures);
  const states = JSON.stringify(pack.states);
  const burgs = JSON.stringify(pack.burgs);
  const religions = JSON.stringify(pack.religions);
  const provinces = JSON.stringify(pack.provinces);
  const rivers = JSON.stringify(pack.rivers);
  const markers = JSON.stringify(pack.markers);

  console.log("Saving Data");
  fdbset(fdbref(window.fdb,'map/data'),{

    gridGeneral: {spacing, cellsX, cellsY, boundary, points, features, cellsDesired},
    gridh: grid.cells.h,
    gridprec: grid.cells.prec,
    gridf: grid.cells.f,
    gridt: grid.cells.t,
    gridtemp: grid.cells.temp,
    packFeatures: pack.features,
    cultures: pack.cultures,
    states: pack.states,
    burgs: JSON.parse(burgs),
    religions: pack.religions,
    provinces: pack.provinces,
    rivers: pack.rivers,
    markers: JSON.parse(markers)
  });

  console.log("Saving Cells");
  fdbset(fdbref(window.fdb,'map/cells'),{
    packcellsbiome: pack.cells.biome,
    packcellsburg:pack.cells.burg,
    packcellsconf:pack.cells.conf,
    packcellsculture: pack.cells.culture,
    packcellsfl:pack.cells.fl,
    packcellsr: pack.cells.r,
    packcellsroad: pack.cells.road,
    packcellss: pack.cells.s,
    packcellsstate: pack.cells.state,
    packcellsreligion:  pack.cells.religion,
    packcellsprovince: pack.cells.province,
    packcellscrossroad: pack.cells.crossroad,
    packcellspop: Array.from(pack.cells.pop).map(p => rn(p, 4)),
  });





  // store name array only if not the same as default
  const defaultNB = Names.getNameBases();
  const namesData = nameBases
    .map((b, i) => {
      const names = defaultNB[i] && defaultNB[i].b === b.b ? "" : b.b;
      return `${b.name}|${b.min}|${b.max}|${b.d}|${b.m}|${names}`;
    })
    .join("/");

    fdbset(fdbref(window.fdb,'map/namesdata'),{
      namesData: namesData
    });

  // round population to save space
  const pop = Array.from(pack.cells.pop).map(p => rn(p, 4));

  // data format as below

  const mapData = [
    params,
    settings,
    coords,
    biomes,
    notesData,
    serializedSVG,
    gridGeneral,
    grid.cells.h,
    grid.cells.prec,
    grid.cells.f,
    grid.cells.t,
    grid.cells.temp,
    packFeatures,
    cultures,
    states,
    burgs,
    pack.cells.biome,
    pack.cells.burg,
    pack.cells.conf,
    pack.cells.culture,
    pack.cells.fl,
    pop,
    pack.cells.r,
    pack.cells.road,
    pack.cells.s,
    pack.cells.state,
    pack.cells.religion,
    pack.cells.province,
    pack.cells.crossroad,
    religions,
    provinces,
    namesData,
    rivers,
    rulersString,
    fonts,
    markers
  ].join("\r\n");
  return mapData;
}

// save map file to indexedDB
async function saveToStorage(mapData, showTip = false) {
  const blob = new Blob([mapData], {type: "text/plain"});
  await ldb.set("lastMap", blob);
  showTip && tip("Map is saved to the browser storage", false, "success");
}

// download map file
function saveToMachine(mapData, filename) {
  const blob = new Blob([mapData], {type: "text/plain"});
  const URL = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = URL;
  link.click();

  tip('Map is saved to the "Downloads" folder (CTRL + J to open)', true, "success", 8000);
  window.URL.revokeObjectURL(URL);
}

async function saveToDropbox(mapData, filename) {
  await Cloud.providers.dropbox.save(filename, mapData);
  tip("Map is saved to your Dropbox", true, "success", 8000);
}

async function initiateAutosave() {
  const MINUTE = 60000; // munite in milliseconds
  let lastSavedAt = Date.now();

  async function autosave() {
    const timeoutMinutes = byId("autosaveIntervalOutput").valueAsNumber;
    if (!timeoutMinutes) return;

    const diffInMinutes = (Date.now() - lastSavedAt) / MINUTE;
    if (diffInMinutes < timeoutMinutes) return;
    if (customization) return tip("Autosave: map cannot be saved in edit mode", false, "warning", 2000);

    try {
      tip("Autosave: saving map...", false, "warning", 3000);
      const mapData = prepareMapData();
      await saveToStorage(mapData);
      tip("Autosave: map is saved", false, "success", 2000);

      lastSavedAt = Date.now();
    } catch (error) {
      ERROR && console.error(error);
    }
  }

  setInterval(autosave, MINUTE / 2);
}

// TODO: unused code
async function compressData(uncompressedData) {
  const compressedStream = new Blob([uncompressedData]).stream().pipeThrough(new CompressionStream("gzip"));

  let compressedData = [];
  for await (const chunk of compressedStream) {
    compressedData = compressedData.concat(Array.from(chunk));
  }

  return new Uint8Array(compressedData);
}

const saveReminder = function () {
  if (localStorage.getItem("noReminder")) return;
  const message = [
    "Please don't forget to save the project to desktop from time to time",
    "Please remember to save the map to your desktop",
    "Saving will ensure your data won't be lost in case of issues",
    "Safety is number one priority. Please save the map",
    "Don't forget to save your map on a regular basis!",
    "Just a gentle reminder for you to save the map",
    "Please don't forget to save your progress (saving to desktop is the best option)",
    "Don't want to get reminded about need to save? Press CTRL+Q"
  ];
  const interval = 15 * 60 * 1000; // remind every 15 minutes

  saveReminder.reminder = setInterval(() => {
    if (customization) return;
    tip(ra(message), true, "warn", 2500);
  }, interval);
  saveReminder.status = 1;
};
saveReminder();

function toggleSaveReminder() {
  if (saveReminder.status) {
    tip("Save reminder is turned off. Press CTRL+Q again to re-initiate", true, "warn", 2000);
    clearInterval(saveReminder.reminder);
    localStorage.setItem("noReminder", true);
    saveReminder.status = 0;
  } else {
    tip("Save reminder is turned on. Press CTRL+Q to turn off", true, "warn", 2000);
    localStorage.removeItem("noReminder");
    saveReminder();
  }
}
