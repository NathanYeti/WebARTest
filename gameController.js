var fishNameList;
d3.csv("SomethingFishy.csv").then((data)=> {
    fishNameList = data;
});

AFRAME.registerComponent('controller', {
    schema: {
        
    },
    init: function() {
        var el = this.el;
        var data = this.data;
        
        this.isEditorTesting = true;
        // reference to the scene
        this.scene = el.sceneEl;
        // reference to the camera
        this.camera = document.getElementById('camera');
        // reference to the point where a selected fish goes when selected.
        this.cameraPoint = '0 .01 -.05';
        // reference object of the tank
        this.tank;
        // reference object of the river
        this.river;
        // reference object of the food
        this.food;
        this.fishFoodCount = 0;
        
        this.trackers = [];
        
        this.activeFishNames = [];
        this.activeFishSelectedData = [];
        fishlist.once('value', snap => {
            for (i in snap.val()) {
                this.activeFishNames.push(i);
            };
            
            if (Object.keys(this.activeFishNames).length >= this.fishMaxAmount) {
                this.riverFishAmount = this.fishMaxAmount;
            } else {
                this.riverFishAmount = Object.keys(this.activeFishNames).length;
            };
            
            el.emit('riverlistretrieved');
            el.removeEventListener('riverlistretrieved', this.finishRiverFishData);
        });
        
        this.selectedFish = null;
        
        this.serverFish = [];
        this.riverFishAmount;
        this.nonServerFish = [];
        this.fishMaxAmount = 15;
        
        this.fishData = [];
        this.fishNameList = fishNameList;
        
        this.feedFish = (details)=> {
            var selFish = details.detail.fishSelected;
            var selFishCom = selFish.components.fish;
            var selFishData = selFish.components.fish.data;
            // decrease fish food amount
            this.decreaseFishFood();
            // update fish data in array of data
            var size = Math.round((selFishData.size + .1) * 1000)/1000;
            var timesFed = selFishData.timesfed + 1;
            var updatedFishData = {BirthDay:selFishData.birthday, Name:selFishData.name, Size:size, TimesFed:timesFed};
            this.updateFishDataInArray(selFish, selFishData.serverName, updatedFishData);
            
            // update local fish data
            selFishCom.fishServerData = this.getFishData(selFish);
            selFishCom.setupData();
            // update UI fish data being showed
            document.getElementById('fsize').innerHTML = "Size: " + selFishData.size + 'm';
            document.getElementById('ffed').innerHTML = "Times Fed: " + selFishData.timesfed;
            // update server
            this.updateFishDataBase();
        };
        this.gameSetup = (details)=> {
            this.tankSetup();
            this.riverSetup();
            this.foodSetup();
        };
        this.fishSelected = (details)=> {
            var selFish = details.detail.fishSelected;
            var selFishData = selFish.components.fish.data;
            this.selectedFish = selFish;
            selFish.setAttribute('position', this.worldToLocal(selFish, this.camera));
            this.camera.appendChild(selFish);
            
            selFish.setAttribute('animation__position', {
                property: 'position',
                from: selFish.getAttribute('position').x + ' ' + selFish.getAttribute('position').y + ' ' +   selFish.getAttribute('position').z,
                to: this.cameraPoint,
                dur: 1000,
                dir: 'normal',
            });
            selFish.setAttribute('animation__scale', {
                property: 'scale',
                from: selFishData.rtscale,
                to: selFishData.sscale,
                dur: 1000,
                dir: 'normal',
            });

            var date = new Date(selFishData.birthday * 1000);
            var dateFormat = {month:'short', day:'numeric', year:'numeric'};
            var formatedDate = new Intl.DateTimeFormat('en-US', dateFormat).format(date);

            document.getElementById('fishdisplay').style.display = 'flex';
            document.getElementById('fname').innerHTML = selFishData.name;
            document.getElementById('fbirth').innerHTML = "Birth Day: " + formatedDate;
            document.getElementById('fsize').innerHTML = "Size: " + selFishData.size + 'm';
            document.getElementById('ffed').innerHTML = "Times Fed: " + selFishData.timesfed;
        };
        this.fishReleased = (details)=> {
            var selFish = details.detail.fishSelected;
            var selFishData = selFish.components.fish.data;
            var releaseSpot = details.detail.spotSelected;
            this.selectedFish = null;
            if(releaseSpot == this.river) {
                if(this.nonServerFish.includes(selFish)) {
                    var index = this.nonServerFish.findIndex((index)=> {
                        return selFish == index;
                    });
                    this.nonServerFish.splice(index, 1);
                    this.serverFish.push(selFish);
                };
                this.addFishToDataBase(selFish, selFishData);
            };
            selFish.setAttribute('position', this.worldToLocal(selFish, releaseSpot));
            releaseSpot.appendChild(selFish);
            
            //fish.removeAttribute('animation__position');
            //fish.removeAttribute('animation__scale');
            
            var fromPos = this.worldToLocal(selFish, releaseSpot);
            var toPos = this.randomFishLocation(releaseSpot);
            selFish.setAttribute('animation__position', {
                property: 'position',
                from: fromPos.x + ' ' + fromPos.y + ' ' + fromPos.z,
                to: toPos.x + ' ' + toPos.y + ' ' + toPos.z,
                dur: 1000,
                dir: 'normal',
            });
            selFish.setAttribute('animation__scale', {
                property: 'scale',
                from: selFishData.sscale,
                to: selFishData.rtscale,
                dur: 1000,
                dir: 'normal',
            }); 
            
            document.getElementById('fishdisplay').style.display = 'none';
        };
        this.finishRiverFishData = (details)=> {
            if(this.riverFishAmount == 0) {
                el.emit('dataloaded');
                el.removeEventListener('dataloaded', this.gameSetup);
                return;
            }
            var fishLoaded = this.riverFishAmount;
            for (var i = this.riverFishAmount; i >= 1; i--) {
                var chosenFish;
                chosenFish = this.activeFishNames[Math.floor(Math.random() * Object.keys(this.activeFishNames).length)];
                var chosenFishData = firebase.database().ref().child('Fish/' + chosenFish);
                var index = (this.activeFishNames.findIndex((index)=>{
                    return chosenFish == index;
                }));
                this.activeFishNames.splice(index, 1);
                // this takes time to call, need to determine selected fish ahead of time, grab data, and then initialize fish. This should be done off of the emit('hasloaded')
                chosenFishData.once('value', snap => {
                    this.activeFishSelectedData.push({fishServerName:snap.key, fishData:snap.val()});
                    fishLoaded--;
                    if (fishLoaded == 0) {
                        el.emit('dataloaded');
                        el.removeEventListener('dataloaded', this.gameSetup);
                    };
                });
            };
        };
        el.addEventListener('feedfish', this.feedFish);
        el.addEventListener('showfish', this.fishSelected);
        el.addEventListener('releasefish', this.fishReleased);
        el.addEventListener('dataloaded', this.gameSetup);
        el.addEventListener('riverlistretrieved', this.finishRiverFishData);
    },
    tankSetup: function() {
        var tracker = document.createElement('a-entity');
        tracker.setAttribute('imagetracking', {name:'tank', src:'./TestImages/Sturgeon_Sign_2_Resize.png', physicalWidth:1.016});
        this.scene.appendChild(tracker);
        this.trackers.push(tracker);
        this.tank = document.createElement('a-tank');
        this.tank.setAttribute('tank', '');
        if(this.isEditorTesting == true) {
            this.tank.setAttribute('position', {x:0, y:-1, z:-2});
            this.scene.appendChild(this.tank);
        } else {
            tracker.appendChild(this.tank);
        }
    },
    riverSetup: function() {
        var tracker = document.createElement('a-entity');
        tracker.setAttribute('imagetracking', {name:'river', src:'./TestImages/OverLook_1_Resize.png', physicalWidth:0.9144});
        this.scene.appendChild(tracker);
        this.trackers.push(tracker);
        this.river = document.createElement('a-river');
        this.river.setAttribute('river', '');
        if(this.isEditorTesting == true) {
            this.river.setAttribute('position', {x:-2, y:-1, z:0});
            this.scene.appendChild(this.river);
        } else {
            tracker.appendChild(this.river);
        }
    },
    foodSetup: function() {
        var tracker = document.createElement('a-entity');
        tracker.setAttribute('imagetracking', {name:'food', src:'./TestImages/Painting_2_Fish_Food.png', physicalWidth:1.6891});
        this.scene.appendChild(tracker);
        this.trackers.push(tracker);
        this.food = document.createElement('a-food');
        this.food.setAttribute('food', '');
        if(this.isEditorTesting == true) {
            this.food.setAttribute('position', {x:2, y:-1, z:0});
            this.scene.appendChild(this.food);
        } else {
            tracker.appendChild(this.food);
        }
    },
    registerFish: function(fishObj, parentObject) {
        var combinedFishData;

        switch(parentObject) {
            case this.tank:
                combinedFishData = {fish:fishObj, fishServerName:null, fishData:{BirthDay:Math.round((new Date()).getTime() / 1000), Name:this.determineName(), Size:.1, TimesFed:0}};
                this.fishData.push(combinedFishData);
                break;
            case this.river:
                var chosenFishData = this.activeFishSelectedData[Math.floor(Math.random() * Object.keys(this.activeFishSelectedData).length)];
                var index = (this.activeFishSelectedData.findIndex((index)=>{
                    return chosenFishData == index;
                }));
                this.activeFishSelectedData.splice(index,1);
                var combinedFishData = {fish:fishObj, fishServerName:chosenFishData.fishServerName, fishData:chosenFishData.fishData};
                this.fishData.push(combinedFishData);
                break;
        }
    },
    increaseFishFood: function() {
        this.fishFoodCount++;
        document.getElementById("ff").innerHTML = "FF: " + this.fishFoodCount;
    },
    decreaseFishFood: function() {
        this.fishFoodCount--;
        document.getElementById("ff").innerHTML = "FF: " + this.fishFoodCount;
    },
    // returns the world position of the passed in object
    getWorldPos: function(el) {
        var worldPos = new THREE.Vector3();
        worldPos.setFromMatrixPosition(el.object3D.matrixWorld);
        return worldPos;
    },
    worldToLocal: function(child, parent) {
        var worldPos = new THREE.Vector3();
        child.object3D.getWorldPosition(worldPos);
        return parent.object3D.worldToLocal(worldPos);
    },
    // called to populate the river and tank at runtime.
    populateRiverTank: function(parentObject, array, fishAmount) {
        if(array == this.riverFish && fishAmount == 0) return;
        for (var i = fishAmount; i >= 1; i--) {
            var fish = document.createElement('a-fish');
            fish.setAttribute('position', this.randomFishLocation(parentObject));
            fish.setAttribute('fish', '');
            parentObject.appendChild(fish);
            array.push(fish);
            this.registerFish(fish, parentObject);
        }
    },
    // retrieves data for the given fish
    getFishData: function(fish) {
        var fishData = this.fishData;
        var data;
        for (var i = fishData.length - 1; i >= 0; i--) {
            if (fishData[i].fish == fish) {
                data = {fishServerName:fishData[i].fishServerName, fishData:fishData[i].fishData};
                break;
            }
        }
        return data;
    },
    // returns a random position within the parent object
    randomFishLocation: function(parentObject) {
        var width = parentObject.getAttribute('geometry').width;
        var depth = parentObject.getAttribute('geometry').depth;
        var height = parentObject.getAttribute('geometry').height;
        var widthPos = (Math.random() * (width - .2)) - (width/2);
        var depthPos = (Math.random() * (depth - .2)) - (depth/2);
        var heightPos = (Math.random() * (height - .2)) - (height/2);
    
        var position = new THREE.Vector3(widthPos, heightPos, depthPos);
        return position;
    },
    determineName: function() {
        var name = [' ',' ',' ',' '];
        var list = fishNameList;
        
        for (var i = 3; i >= 0; i--) {
            while(name[i] == ' ') {
                switch(i) {
                    case 0:
                        name[i] = list[Math.floor(Math.random() * (Object.keys(list).length - 1))]['Color'];
                        break;
                    case 1:
                        name[i] = list[Math.floor(Math.random() * (Object.keys(list).length - 1))]['Adjective/Adverb'];
                        break;
                    case 2:
                        name[i] = list[Math.floor(Math.random() * (Object.keys(list).length - 1))]['Verb ending in ing'];
                        break;
                    case 3:
                        name[i] = list[Math.floor(Math.random() * (Object.keys(list).length - 1))]['Noun'];
                        break;
                };
            };
        };
        return name.join(' ');
    },
    populateDataBase: function() {
        var updates = {};
        for (var i = 10; i > 0; i--) {
            var name = 'Fish_' + Math.floor(Math.random() * 1000) + '_' + Math.floor(Math.random() * 1000) + '_' + Math.floor(Math.random() * 1000) + '_' + Math.floor(Math.random() * 1000);
            console.log(name + " added to server.");
            
            updates['Fish/' + name] = {
                BirthDay:Math.round((new Date()).getTime() / 1000), 
                Name:this.determineName(), 
                Size:.1, 
                TimesFed:0
            };
            updates['FishList/' + name] = name;
        };
        firebase.database().ref().update(updates);
    },
    addFishToDataBase: function(fishObj, fishData) {
        var update = {};
        var name;
        if(fishData.servername != null) {
            name = fishData.servername;
        } else {
            name = 'Fish_' + Math.floor(Math.random() * 1000) + '_' + Math.floor(Math.random() * 1000) + '_' + Math.floor(Math.random() * 1000) + '_' + Math.floor(Math.random() * 1000);
        };
        this.updateFishDataInArray(fishObj, name, fishObj.components.fish.fishServerData.fishData);
        
        console.log(name + " added to server.");
        console.log(fishData);
        
        update['Fish/' + name] = {
            BirthDay:fishData.birthday, 
            Name:fishData.name, 
            Size:fishData.size, 
            TimesFed:fishData.timesfed
        };
        update['FishList/' + name] = name;
        //firebase.database().ref().update(update);
    },
    updateFishDataInArray: function(fishObj, serverName, updatedFishData) {
        for (i in this.fishData) {
            if(this.fishData[i].fish == fishObj) {
                this.fishData.splice(i, 1);
                var combinedFishData = {fish:fishObj, fishServerName:serverName, fishData:updatedFishData};
                this.fishData.push(combinedFishData);
                break;
            } 
        };
    },
    updateFishDataBase() {
        var update = {};
        // TODO: update database
    }
});

// if Key is number use fish[number], if it is a string use fish.string
var fish = {
    '1':{'name':'Sue', 'age':42, 'weight':319.54, 'length':67},
    '2':{'name':'Robert', 'age':37, 'weight':215.95, 'length':48},
    '3':{'name':'Bill', 'age':25, 'weight':118.48, 'length':27},
    '4':{'name':'John', 'age':56, 'weight':340.27, 'length':70},
    '5':{'name':'Steve', 'age':5, 'weight':56.65, 'length':18},
};