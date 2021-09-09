﻿window.initSaveData = function(forceRun){

    if('ewaSaveDetails' in localStorage === true) {
        localStorage.removeItem("ewaSaveDetails")
        }

    if('EWA-saveDetail' in localStorage===false || forceRun === true){
        let saveDetails = {autosave:[null,null,null,null],slots:[null,null,null,null,null,null,null,null,null,null,null,null]}

        localStorage.setItem("EWA-saveDetail" ,JSON.stringify(saveDetails))
    }
    else if('EWA-saveDetail' in localStorage===true){
        let save = localStorage.getItem("EWA-saveDetail")

        if(save == "undefined" || save == undefined || typeof(save) != "object"){
            let saveDetails = {autosave:[null,null,null,null],slots:[null,null,null,null,null,null,null,null,null,null,null,null]}
            localStorage.setItem("EWA-saveDetail" ,JSON.stringify(saveDetails))
        }
        else{
            let save = JSON.parse(localStorage.getItem("EWA-saveDetail"))

            if(!save.autosave || !Array.isArray(save.autosave) || save.autosave.length < 4 || save.slots.length < 12){
                let newsaves = prepareSaveDetails()

                localStorage.setItem("EWA-saveDetail" ,JSON.stringify(newsaves))
                return newsaves
            }
        }
        return save
    }
}

window.initLocalStorage = function(){
    localStorage.removeItem("EWA-saveDetail")
}

window.saveOK = function(slot){
    if(V.passage =="Start" || V.passage =="Event" || V.tags.includes("nosave")){
        cf.allowsave = false
        return false
    }
    else if( slot >= 0 && conf.saves[slot].locked === true){
        return false
    }
    else{
        cf.allowsave = true
        return true
    }
}

window.returnSaveDetails = function () {
	return Save.get();
}

window.resetSaveMenu = function () {
	new Wikifier(null, '<<resetSaveMenu>>');
}

window.SaveUnlock = function(slot) {
    conf.saves[slot].locked = !conf.saves[slot].locked
    resetSaveMenu()
}

window.setSaveMetaData = function(){
    let data = {
        playedtime : clone(V.gametime),
        gamedate : clone(V.day),
        location : (V.local?.tag?.includes("家") ? `${PC.info.name}家` : V.location),
        saveId: V.saveId,
        pctitle: PC.info.title,
        saveName: PC.info.name,
    }
    return data
}
F.setSaveMetaData = setSaveMetaData

/* 初期化or继承旧档案 */
window.prepareSaveDetails = function (forceRun){
	if("EWA-saveDetail" in localStorage === false || forceRun === true){
		var saveDetails = {autosave:[],slots:[]}
		var SCubeSave = Save.get();

		for(let i=0; i<4;i++){
			if(SCubeSave.slots[i]!==null){
				saveDetails.autosave[i] = {
					title: SCubeSave.slots[i].title,
					date:  SCubeSave.slots[i].date,
					metadata:SCubeSave.slots[i].metadata
				}
			}else{
				saveDetails.autosave[i] = null
			}
		}

		for(let i = 4; i < SCubeSave.slots.length; i++){
			if(SCubeSave.slots[i] !== null){
				saveDetails.slots[i-4]={
					title: SCubeSave.slots[i].title,
					date: SCubeSave.slots[i].date,
					metadata: SCubeSave.slots[i],metadata
				};
			}
			else{
				saveDetails.slots[i-4] = null;
			}
		}
		
		localStorage.setItem("EWA-saveDetail" ,JSON.stringify(saveDetails));
	}
	return saveDetails;
}

/* 自动保存，只会在 daychange和主线开启时执行 */
window.AutoSave = function(metadata){
    var saveDetails = JSON.parse(localStorage.getItem("EWA-saveDetail"))
    if(!metadata){
      var metadata = setSaveMetaData()  
    }
    /* sugarcube的正常存档 slot 0~2 为自动存档位。 3~12才是常规存档*/

    for(var i=0; i < 4; i++){

        if(Save.slots.has(i)==false){
            Save.slots.save(i, SugarCube.Story.get(V.passage).title, metadata);
            saveDetails.autosave[i] = {
                title: SugarCube.Story.get(V.passage).title,
                date: Date.now(),
                metadata: metadata,
            };
            localStorage.setItem('EWA-saveDetail', JSON.stringify(saveDetails));
            return saveDetails.autosave[i]
        }
    }

    if(i==3){

        let saves = JSON.parse(localStorage.getItem('EWA.saves'))
        arrShift(saves.slots,1) /*0,1,2,3 > 3,0,1,2 */

        localStorage.setItem('EWA.saves',JSON.stringify(saves))
        Save.slots.save(0,SugarCube.Story.get(V.passage).title, metadata)

        arrShift(saveDetails.autosave,1)
        saveDetails.autosave[0] = {
            title: SugarCube.Story.get(V.passage).title,
            date: Date.now(),
            metadata: metadata,
        };

        localStorage.setItem('EWA-saveDetail', JSON.stringify(saveDetails));
        return Save.slots.get(0), saveDetails.autosave[0]
    }
    
}
F.AutoSave = window.AutoSave

window.setSaveDetail = function (type, slot, metadata, story ){
	var saveDetails = JSON.parse(localStorage.getItem("EWA-saveDetail"));
	if(type === "autosave"){
		saveDetails.autosave[slot] = {
			title: SugarCube.Story.get(V.passage).title,
			date:Date.now(),
			metadata:metadata
		};
	}else{
		var slot = parseInt(slot);
		saveDetails.slots[slot-4] = {
			title: SugarCube.Story.get(V.passage).title,
			date:Date.now(),
			metadata:metadata
		};
	}
	localStorage.setItem("EWA-saveDetail" ,JSON.stringify(saveDetails));
}
F.setSaveDetail = window.setSaveDetail

window.SaveGame = function(slot, uid=null, metadata, check) {
    if(!metadata){
        var metadata = setSaveMetaData()
    }

        /* 覆盖时的确认检测，以及不是同一个角色的档案时的确认检测 */
    if (uid != null && V.saveId != uid && check===true){
        SaveAlert('UID',slot)
    }        
    else if ( V.conf.checkSave === true && check===true) {
         SaveAlert('overwrite',slot)
    }

    else{

        if(slot > 0){
            Save.slots.save(slot,null,metadata);
            setSaveDetail("normal",slot, metadata);
            resetSaveMenu();

        }
    }

}
F.SaveGame = window.SaveGame


window.LoadGame = function(type, slot, check) {

    // 设置了每次读档都提示是否要确认时
    if( (V.conf.checkLoad===true && !check)){
        LoadAlert(type,slot)
    }
    else{
        Save.slots.load(slot)
    }
}

window.deleteSave = function(type,slot,check){

    /* 设置了删档需要确认时 */
    if(V.conf.checkDel === true && !check){
        DelAlert(type,slot)
        return;

    }
    else if(type =="auto"){
        Save.slots.delete(slot)
        deleteSaveDetails("auto", slot)

    }else{
        let fslot = slot -4
        Save.slots.delete(slot)
        deleteSaveDetails("normal",fslot)
    }
    resetSaveMenu()
}

window.deleteSaveDetails = function (type,slot){
	var saveDetails = JSON.parse(localStorage.getItem("EWA-saveDetail"));
	if(type === "autosave"){
		saveDetails.autosave[slot] = null;
	}else{
		saveDetails.slots[slot] = null;
	}
	localStorage.setItem("EWA-saveDetail" ,JSON.stringify(saveDetails));
}