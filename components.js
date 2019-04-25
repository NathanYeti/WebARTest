AFRAME.registerComponent('tank', {
    init: function() {
        var el = this.el;
        var data = this.data;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;
        
        this.sceneController.populateRiverTank(el, this.sceneController.nonServerFish, this.sceneController.fishMaxAmount);
    },
});

AFRAME.registerComponent('river', {
    init: function() {
        var el = this.el;
        var data = this.data;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;

        this.sceneController.populateRiverTank(el, this.sceneController.serverFish, this.sceneController.riverFishAmount);
    },
});

AFRAME.registerComponent('food', {
    init: function() {
        var el = this.el;
        var data = this.data;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;
        
        this.increaseFishFood = () => {
            this.sceneController.increaseFishFood();
        };
        
        el.addEventListener('mousedown', this.increaseFishFood);
        el.setAttribute('class', 'interactable');
    },
    remove: function() {
        this.el.removeEventListener('mousedown', this.increaseFishFood);
    },
});

AFRAME.registerComponent('fish', {
    schema: {
        birthday: {type: 'int'},
        name: {type: 'string'},
        servername: {type: 'string'},
        size: {type: 'int'},
        timesfed: {type: 'int'},
        rtscale: {type: 'string', default:'1 1 1'},
        sscale: {type: 'string', default:'.1 .1 .1'},
    },
    init: function() {
        var el = this.el;
        var data = this.data;
        
        this.posAnim = null;
        this.scaleAnim = null;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;
        
        this.fishServerData = this.sceneController.getFishData(el);
        this.setupData();
        
        this.mdFN = ()=> {
            if(this.sceneController.selectedFish == null) {
                el.emit('showfish',{fishSelected:el},true);
            } else if (this.sceneController.selectedFish != null && this.sceneController.selectedFish == el) {
                if(this.sceneController.fishFoodCount > 0) {
                    el.emit('feedfish',{fishSelected:el},true);
                }
            }
        };
        this.aEnd = (details)=> {
            if (this.posAnim != null && this.posAnim == details.target) {
                el.removeChild(this.posAnim);
                this.posAnim = null;
            }
            if (this.scaleAnim != null && this.scaleAnim == details.target) {
                el.removeChild(this.scaleAnim);
                this.scaleAnim = null;
            }
        }; 
        
        el.addEventListener('animationend', this.aEnd);
        el.addEventListener('mousedown', this.mdFN);
        el.setAttribute('class', 'interactable');
    },
    setupData: function() {
        var data = this.data;
        
        data.servername = this.fishServerData.fishServerName;
        data.birthday = this.fishServerData.fishData.BirthDay;
        data.name = this.fishServerData.fishData.Name;
        data.size = this.fishServerData.fishData.Size;
        data.timesfed = this.fishServerData.fishData.TimesFed;
    },
    remove: function() {
        this.el.removeEventListener('mousedown', this.mdFN);
    },
});