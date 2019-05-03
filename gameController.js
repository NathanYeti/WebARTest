var fishNameList;
d3.csv("SomethingFishy.csv").then((data)=> {
    fishNameList = data;
});

// the controller for the gamestate of the game.
// this is attached to the 'a-scene' to load all the objects for the game.
AFRAME.registerComponent('controller', {
    init: function() {
        // this refers to the object the component is attached to, in this case: 'a-scene'.
        var el = this.el;
        // 'true' for testing in the editor, 'false' for phone testing.
            // 'true' spawns the game objects in a half circle around the user.
            // 'false' spawns the game objects as childs of the image tracking objects.
        this.isEditorTesting = true;
        // reference to the 'a-scene'
        // in this case, el and el.sceneEl refer to the same object, however, if the 'controller' component is attached to another object later on, the game objects will still be created.
        this.scene = el.sceneEl;
        // reference to the camera 'object'
        this.camera = document.getElementById('camera');
        // reference to the point where a selected fish goes when selected.
        this.cameraPoint = '0 .01 -.05';
        // reference 'object' of the tank
        this.tank;
        // reference 'object' of the river
        this.river;
        // reference 'object' of the food
        this.food;
        // 'number' of fish food the user has
        this.fishFoodCount = 0;
        // holds reference to all the tracker 'objects' if 'isEditorTesting = false'
        this.trackers = [];
        this.rtScaleSizes = ['.8 .8 .8', '1 1 1', '1.2 1.2 1.2', '1.4 1.4 1.4'];
        this.sScaleSizes = ['.06 .06 .06', '.08 .08 .08', '.1 .1 .1', '.12 .12 .12'];
        // holds the list of fish names from the server
        // this is used to select which fish 'data' will be used for each fish 'object' spawned in the river
        this.activeFishNames = [];
        // data selected for use based on the amount of fish 'objects' allowed to spawn.
        this.activeFishSelectedData = [];
        // retrieves the fish name list from the server.
        fishlist.once('value', snap => {
            // puts every fish name into the array 'activeFishNames'
            for (i in snap.val()) {
                this.activeFishNames.push(i);
            };
            // determines the amount of fish allowed to spawn based on the length of the 'activeFishNames' array
            if (Object.keys(this.activeFishNames).length >= this.fishMaxAmount) {
                // set amount to max amount of fish spawned
                this.riverFishAmount = this.fishMaxAmount;
            } else {
                // set the amount to the amount of names in the 'activeFishNames' array
                this.riverFishAmount = Object.keys(this.activeFishNames).length;
            };
            // emits to do the next phase in initializing fish 'data' for river fish 'objects'
            el.emit('riverlistretrieved');
            // removes the 'Event Listener' to prevent duplicate calling
            el.removeEventListener('riverlistretrieved', this.finishRiverFishData);
        });
        // the fish 'object' that is selected by the user
        this.selectedFish = null;
        // fish 'object' with data registered on the server
        this.serverFish = [];
        // amount of fish 'objects' allowed to spawn in the river
        this.riverFishAmount;
        // fish 'object' with no data registered on the server
        this.nonServerFish = [];
        // max amount of fish allowed to spawn in the river and tank
        this.fishMaxAmount = 15;
        // packet of information for all fish 'objects'
        // a fish 'object' gets reset whenever it is reparented inside the scene, this makes it so that it can reinitialize with the same data it had before it got reset.
        this.fishData = [];
        // an array of json 'objects' to determine a name for an unregistered fish 'object'
        this.fishNameList = fishNameList;
        // function called for feeding a fish
        this.feedFish = (details)=> {
            // reference to the fish 'object' being fed
            var selFish = details.detail.fishSelected;
            // reference to the fish component of the fish 'object'
            var selFishCom = selFish.components.fish;
            // reference to the fish component data of the fish 'object'
            var selFishData = selFish.components.fish.data;
            // decrease fish food amount
            this.decreaseFishFood();
            // update fish data in array of data
            var size;
            if(selFishData.size < selFishData.maxsize) {
                size = Math.round((selFishData.size + .1) * 1000)/1000;
            } else {
                size = selFishData.maxsize;
            };
            
            var timesFed = selFishData.timesfed + 1;
            var updatedFishData = {BirthDay:selFishData.birthday, Name:selFishData.name, Size:size, TimesFed:timesFed};
            this.updateFishDataInArray(selFish, selFishData.servername, updatedFishData);
            // update local fish data
            selFishCom.fishServerData = this.getFishData(selFish);
            selFishCom.setupData();
            
            // update UI fish data being showed
            document.getElementById('fsize').innerHTML = selFishData.size + 'm';
            document.getElementById('ffed').innerHTML = selFishData.timesfed;
            // update server
            this.updateFishDataBase(selFish, selFishData);
            
            //update fish data with size
            this.determineFishSize(selFish);
            //update fish size
            selFish.setAttribute('scale', this.updateFishSize(selFish, updatedFishData));
        };
        // called for setting up the game 'objects'
        this.gameSetup = (details)=> {
            this.tankSetup();
            this.riverSetup();
            this.foodSetup();
        };
        // called when a fish is selected
        this.fishSelected = (details)=> {
            // reference to the fish 'object' being selected
            var selFish = details.detail.fishSelected;
            // reference to the fish component of the fish 'object'
            var selFishCom = selFish.components.fish;
            // reference to the fish component data of the fish 'object'
            var selFishData = selFish.components.fish.data;
            // holds reference to the selected fish 'object'
            this.selectedFish = selFish;
            // repositions the fish 'objects' position so that it stays in the same object when reparenting.
            // 'objects' positions are all based off of local position
            selFish.setAttribute('position', this.worldToLocal(selFish, this.camera));
            // reparents the selected fish 'object'
            this.camera.appendChild(selFish);
            // animates the position of the fish 'object'
            // create animation
            var posAnimation = document.createElement('a-animation');
            // set attirbutes
            posAnimation.setAttribute('attribute', 'position');
            posAnimation.setAttribute('from', selFish.getAttribute('position').x + ' ' + selFish.getAttribute('position').y + ' ' +   selFish.getAttribute('position').z);
            posAnimation.setAttribute('to', this.cameraPoint);
            posAnimation.setAttribute('dur', 1000);
            posAnimation.setAttribute('dir', 'normal');
            // attach to fish
            selFish.appendChild(posAnimation);
            selFishCom.posAnim = posAnimation;
            
            // create animation
            var scaleAnimation = document.createElement('a-animation');
            // set attributes
            scaleAnimation.setAttribute('attribute', 'scale');
            scaleAnimation.setAttribute('from', selFishData.rtscale);
            scaleAnimation.setAttribute('to', selFishData.sscale);
            scaleAnimation.setAttribute('dur', 1000);
            scaleAnimation.setAttribute('dir', 'normal');
            // attach to fish
            selFish.appendChild(scaleAnimation);
            selFishCom.scaleAnim = scaleAnimation;
            /*
            selFish.setAttribute('animation__position', {
                property: 'position',
                from: selFish.getAttribute('position').x + ' ' + selFish.getAttribute('position').y + ' ' +   selFish.getAttribute('position').z,
                to: this.cameraPoint,
                dur: 1000,
                dir: 'normal',
            });
            // animates the scale of the fish 'object'
            selFish.setAttribute('animation__scale', {
                property: 'scale',
                from: selFishData.rtscale,
                to: selFishData.sscale,
                dur: 1000,
                dir: 'normal',
            });
            */
            // determines date based on the format
            var date = new Date(selFishData.birthday * 1000);
            var dateFormat = {month:'numeric', day:'numeric', year:'2-digit'};
            var formatedDate = new Intl.DateTimeFormat('en-US', dateFormat).format(date);
            // makes the UI display for the fish data visible
            // then, applies the fish data for the selected fish
            document.getElementById('fishdisplay').style.display = 'flex';
            document.getElementById('fishbuttons').style.display = 'flex';
            document.getElementById('fname').innerHTML = selFishData.name;
            document.getElementById('fbirth').innerHTML = formatedDate;
            document.getElementById('fsize').innerHTML = selFishData.size + 'm';
            document.getElementById('ffed').innerHTML = selFishData.timesfed;
        };
        // called when a fish is released
        this.fishReleased = (details)=> {
            // reference to the fish 'object' being released
            var selFish = details.detail.fishSelected;
            // reference to the fish component of the fish 'object'
            var selFishCom = selFish.components.fish;
            // reference to the fish component data of the fish 'object'
            var selFishData = selFish.components.fish.data;
            // the release spot position
            var releaseSpot = details.detail.spotSelected;
            // removes the selected fish from the 'selectedFish' variable
            this.selectedFish = null;
            // if the release spot is the river, add the fish data to the server, and update the arrays appropriately
            if(releaseSpot == this.river) {
                // updates the fish 'object' arrays
                if(this.nonServerFish.includes(selFish)) {
                    var index = this.nonServerFish.findIndex((index)=> {
                        return selFish == index;
                    });
                    this.nonServerFish.splice(index, 1);
                    this.serverFish.push(selFish);
                };
                // add fish data to the database
                this.addFishToDataBase(selFish, selFishData);
            };
            
            var fromPos = this.worldToLocal(selFish, releaseSpot);
            var toPos = this.randomFishLocation(releaseSpot);
            // repositions the fish 'objects' position so that it stays in the same object when reparenting.
            // 'objects' positions are all based off of local position
            selFish.setAttribute('position', fromPos);
            // reparents the released fish 'object'
            releaseSpot.appendChild(selFish);
            
            //fish.removeAttribute('animation__position');
            //fish.removeAttribute('animation__scale');
            
            // determines positions to animate to and from
            
            // animates the position of the fish 'object'
            // create animation
            var posAnimation = document.createElement('a-animation');
            // set attribute
            posAnimation.setAttribute('attribute', 'position');
            posAnimation.setAttribute('from', fromPos.x + ' ' + fromPos.y + ' ' + fromPos.z);
            posAnimation.setAttribute('to', toPos.x + ' ' + toPos.y + ' ' + toPos.z);
            posAnimation.setAttribute('dur', 1000);
            posAnimation.setAttribute('dir', 'normal');
            // attach to fish
            selFish.appendChild(posAnimation);
            selFishCom.posAnim = posAnimation;
            
            // create animation
            var scaleAnimation = document.createElement('a-animation');
            // set attributes
            scaleAnimation.setAttribute('attribute', 'scale');
            scaleAnimation.setAttribute('from', selFishData.sscale);
            scaleAnimation.setAttribute('to', selFishData.rtscale);
            scaleAnimation.setAttribute('dur', 1000);
            scaleAnimation.setAttribute('dir', 'normal');
            // attach to fish
            selFish.appendChild(scaleAnimation);
            selFishCom.scaleAnim = scaleAnimation;
            /*
            selFish.setAttribute('animation__position', {
                property: 'position',
                from: fromPos.x + ' ' + fromPos.y + ' ' + fromPos.z,
                to: toPos.x + ' ' + toPos.y + ' ' + toPos.z,
                dur: 1000,
                dir: 'normal',
            });
            // animates the scale of the fish 'object'
            selFish.setAttribute('animation__scale', {
                property: 'scale',
                from: selFishData.sscale,
                to: selFishData.rtscale,
                dur: 1000,
                dir: 'normal',
            }); 
            */
            // makes the UI display for the fish data invisible
            document.getElementById('fishdisplay').style.display = 'none';
            document.getElementById('fishbuttons').style.display = 'none';
        };
        // called to finish the fish data after the name list has been retrieved from the server.
        this.finishRiverFishData = (details)=> {
            if(this.riverFishAmount == 0) {
                // emits event listener to initialize the game 'objects'
                el.emit('dataloaded');
                el.removeEventListener('dataloaded', this.gameSetup);
                return;
            }
            // amount of fish to load for the river
            var fishLoaded = this.riverFishAmount;
            // for the amount of fish to spawn, choose a fish data to retrieve from the server.
            for (var i = this.riverFishAmount; i >= 1; i--) {
                // the chosen fish name
                var chosenFish;
                // chooses a fish name
                chosenFish = this.activeFishNames[Math.floor(Math.random() * Object.keys(this.activeFishNames).length)];
                // finds the index of the chosen name in 'activeFishNames' array
                var index = (this.activeFishNames.findIndex((index)=>{
                    return chosenFish == index;
                }));
                // removes it from the 'activeFishNames' array so there are no duplicate fish
                this.activeFishNames.splice(index, 1);
                // creates reference pathway to the chosen fish name
                var chosenFishData = firebase.database().ref().child('Fish/' + chosenFish);
                // retrieves the fish data in a useable manner
                // this takes time to call, need to determine selected fish ahead of time, grab data, and then initialize fish.
                chosenFishData.once('value', snap => {
                    this.activeFishSelectedData.push({fishServerName:snap.key, fishData:snap.val()});
                    fishLoaded--;
                    if (fishLoaded == 0) {
                        // emits event listener to initialize the game 'objects'
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
    // sets up the tank 'object' for use
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
    // sets up the river 'object' for use
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
    // sets up the food 'object' for use
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
    // called to register a fish in the 'fishData' array so that it can retrieve its 'data' when it gets reparented
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
        return combinedFishData;
    },
    // called to increase the amount of fish food the user has
    increaseFishFood: function() {
        this.fishFoodCount++;
        document.getElementById("ff").innerHTML = this.fishFoodCount;
        console.log(fishNameList);
    },
    // called to decrease the amount of fish food the user has
    decreaseFishFood: function() {
        this.fishFoodCount--;
        document.getElementById("ff").innerHTML = this.fishFoodCount;
    },
    // returns the world position of the passed in object
    getWorldPos: function(el) {
        var worldPos = new THREE.Vector3();
        worldPos.setFromMatrixPosition(el.object3D.matrixWorld);
        return worldPos;
    },
    // returns the local position of the passed in child to parent
    worldToLocal: function(child, parent) {
        var worldPos = new THREE.Vector3();
        child.object3D.getWorldPosition(worldPos);
        parent.object3D.worldToLocal(worldPos);
        return worldPos;
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
            var combinedFishData = this.registerFish(fish, parentObject);
            fish.setAttribute('scale', this.determineInitialFishSize(fish, combinedFishData.fishData));
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
        // min must equal to or less than half width,height,depth otherwise it will cause offset
        var min = .2;
        var widthPos = ((Math.random() * ((width - min) - min)) + min) - (width/2);
        var depthPos = ((Math.random() * ((depth - min) - min)) + min) - (depth/2);
        var heightPos = ((Math.random() * ((height - min) - min)) + min) - (height/2);
    
        var position = new THREE.Vector3(widthPos, heightPos, depthPos);
        return position;
    },
    // creates and returns a randomly created fish name
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
    // determines proper fish size for animations
    // used in init of fish to keep proper scaling when animating
    determineFishSize: function(fishObj) {
        // reference to the fish component of the fish 'object'
        var fishCom = fishObj.components.fish;
        // reference to the fish component data of the fish 'object'
        var fishData = fishObj.components.fish.data;
        var sizePercentage = fishData.size/fishData.maxsize;
        switch(true) {
            case (.25 >= sizePercentage):
                fishData.rtscale = this.rtScaleSizes[0];
                fishData.sscale = this.sScaleSizes[0];
                break;
            case (.25 < sizePercentage && sizePercentage <= .5):
                fishData.rtscale = this.rtScaleSizes[1];
                fishData.sscale = this.sScaleSizes[1];
                break;
            case (.5 < sizePercentage && sizePercentage <= .75):
                fishData.rtscale = this.rtScaleSizes[2];
                fishData.sscale = this.sScaleSizes[2];
                break;
            case (.75 < sizePercentage):
                fishData.rtscale = this.rtScaleSizes[3];
                fishData.sscale = this.sScaleSizes[3];
                break;
        }
    },
    // determines fish's initial size when spawned
    // returns proper size
    determineInitialFishSize: function(fishObj, fishData) {
        var sizePercentage = fishData.Size/2.2;
        var decidedSize;
        switch(true) {
            case (.25 >= sizePercentage):
                decidedSize = this.rtScaleSizes[0];
                break;
            case (.25 < sizePercentage && sizePercentage <= .5):
                decidedSize = this.rtScaleSizes[1];
                break;
            case (.5 < sizePercentage && sizePercentage <= .75):
                decidedSize = this.rtScaleSizes[2];
                break;
            case (.75 < sizePercentage):
                decidedSize = this.rtScaleSizes[3];
                break;
            default:
                decidedSize = this.rtScaleSizes[0];
                break;
        };
        return decidedSize;
    },
    // updates fish size when feeding a fish
    // returns proper size
    updateFishSize: function(fishObj, fishData) {
        var sizePercentage = fishData.Size/2.2;
        var decidedSize;
        switch(true) {
            case (.25 >= sizePercentage):
                decidedSize = this.sScaleSizes[0];
                break;
            case (.25 < sizePercentage && sizePercentage <= .5):
                decidedSize = this.sScaleSizes[1];
                break;
            case (.5 < sizePercentage && sizePercentage <= .75):
                decidedSize = this.sScaleSizes[2];
                break;
            case (.75 < sizePercentage):
                decidedSize = this.sScaleSizes[3];
                break;
            default:
                decidedSize = this.sScaleSizes[0];
                break;
        };
        return decidedSize;
    },
    // called to populate the database with X amount of fish
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
    // called to add a fish's 'data' to the database
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
        firebase.database().ref().update(update);
    },
    // called to update the local data in the 'fishData' array
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
    // called to update a fish's 'data' in the database
    updateFishDataBase(fishObj, fishData) {
        if(fishData.servername == null) return;
        var update = {};
        // TODO: update database
        update['Fish/' + fishData.servername] = {
            BirthDay:fishData.birthday, 
            Name:fishData.name, 
            Size:fishData.size, 
            TimesFed:fishData.timesfed
        };
        firebase.database().ref().update(update);
    }
});