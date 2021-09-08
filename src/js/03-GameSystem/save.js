

window.getSaveDetails = function (saveSlot){
	if("ewaSaveDetails" in localStorage){
		let saves = JSON.parse(localStorage.getItem("ewaSaveDetails"))
		if(saves) {T.saves = saves ;return saves;}
		else {T.saves = returnSaveDetails(); return returnSaveDetails()}
	}
}

window.deleteAllSaveDetails = function (saveSlot){
	var saveDetails = {autosave:[null,null,null,null],slots:[null,null,null,null,null,null,null,null,null,null,null,null]}
	localStorage.setItem("ewaSaveDetails" ,JSON.stringify(saveDetails));
}

window.importSave = function (saveFile) {
	if (!window.FileReader) return; // Browser is not compatible

	var reader = new FileReader();

	reader.onloadend = function () {
		DeserializeGame(this.result);
	}

	reader.readAsText(saveFile[0]);
}

window.SerializeGame = function () { return Save.serialize(); }; 
window.DeserializeGame = function (myGameState) { return Save.deserialize(myGameState) };

window.getSaveData = function () {
	var input = document.getElementById("saveDataInput");
	input.value = Save.serialize();
}

window.loadSaveData = function () {
	var input = document.getElementById("saveDataInput");
	var result = Save.deserialize(input.value);
	if (result === null) {
		input.value = "Invalid Save."
	}
}

window.clearTextBox = function (id) {
	document.getElementById(id).value = "";
}

window.topTextArea = function (id) {
	var textArea = document.getElementById(id);
	textArea.scroll(0, 0);
}

window.bottomTextArea = function (id) {
	var textArea = document.getElementById(id);
	textArea.scroll(0, textArea.scrollHeight);
}

window.copySavedata = function (id) {
	var saveData = document.getElementById(id);
	saveData.focus();
	saveData.select();

	try {
		var successful = document.execCommand('copy');
	} catch (err) {
		var copyTextArea = document.getElementById("CopyTextArea");
		copyTextArea.value = "Copying Error";
		console.log('Unable to copy: ', err);
	}
}

window.copySavedata = function (id) {
	var saveData = document.getElementById(id);
	saveData.focus();
	saveData.select();

	try {
		var successful = document.execCommand('copy');
	} catch (err) {
		var copyTextArea = document.getElementById("CopyTextArea");
		copyTextArea.value = "Copying Error";
		console.log('Unable to copy: ', err);
	}
}

window.importSettings = function (data, type) {
	switch(type){
		case "text":
			V.importString = document.getElementById("settingsDataInput").value
			new Wikifier(null, '<<displaySettings "importConfirmDetails">>');
			break;
		case "file":
			var reader = new FileReader();
			reader.addEventListener('load', function (e) {
				V.importString = e.target.result;
				new Wikifier(null, '<<displaySettings "importConfirmDetails">>');
			});
			reader.readAsBinaryString(data[0]);
			break;
		case "function":
			importSettingsData(data);
			break;
	}
}

var importSettingsData = function (data) {
	var S = null;
	var result = data;
	if (result != null && result != undefined) {
		//console.log("json",JSON.parse(result));
		S = JSON.parse(result);
	}
}

window.validateValue = function (keys, value) {
	//console.log("validateValue",keys,value);
	var keyArray = Object.keys(keys);
	var valid = false;
	if (keyArray.length === 0) {
		valid = true;
	}
	if (keyArray.includes("min")) {
		if (keys.min <= value && keys.max >= value) {
			valid = true;
		}
	}
	if (keyArray.includes("decimals") && value != undefined) {
		if (value.toFixed(keys.decimals) != value) {
			valid = false;
		}
	}
	if (keyArray.includes("bool")) {
		if (value === true || value === false) {
			valid = true;
		}
	}
	if (keyArray.includes("boolLetter")) {
		if (value === "t" || value === "f") {
			valid = true;
		}
	}
	if (keyArray.includes("strings") && value != undefined) {
		if (keys.strings.includes(value)) {
			valid = true;
		}
	}
	return valid;
}

window.loadExternalExportFile = function () {
	importScripts("ewaSettingsExport.json")
		.then(function () {
			var textArea = document.getElementById("settingsDataInput");
			textArea.value = JSON.stringify(ewaSettingsExport);
		})
		.catch(function (err) {
			//console.log(err);
			var button = document.getElementById("LoadExternalExportFile");
			button.value = "Error Loading";
		});
}

// !!Hack warning!! Don't use it maybe?
window.updateMoment = function () {
	// change last (and only) moment in local history
	State.history[State.history.length - 1].variables = JSON.parse(JSON.stringify(V));
	// prepare the moment object with modified history
	let moment = SugarCube.State.marshalForSave();
	// replace moment.history with moment.delta, because that's what SugarCube expects to find
	// this is a bad thing to do probably btw, because while history and delta appear to look very similar,
	// they're not always the same thing, SugarCube actually decodes delta into history (see: https://github.com/tmedwards/sugarcube-2/blob/36a8e1600160817c44866205bc4d2b7730b2e70c/src/state.js#L527)
	// but for my purpose it works (i think?)
	delete Object.assign(moment, {delta: moment.history}).history;
	// replace saved moment in session with the new one
	let gameName = SugarCube.Story.domId;
	sessionStorage[gameName + ".state"] = JSON.stringify(moment);
	// it appears that this line is not necessary for it to work
	//SugarCube.session._engine[gameName + ".state"] = JSON.stringify(moment);

	// Voilà! F5 will reload the current state now without going to another passage!
}

window.isJsonString = function(s) {
	try {
		JSON.parse(s);
	} catch (e) {
		return false;
	}
	return true;
}
