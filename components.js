AFRAME.registerComponent('tank', {
    init: function() {
        var el = this.el;
        var data = this.data;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;
        
        this.sceneController.populateRiverTank(el, this.sceneController.tankFish, this.sceneController.fishMaxAmount);
    },
});

AFRAME.registerComponent('river', {
    init: function() {
        var el = this.el;
        var data = this.data;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;

        this.sceneController.populateRiverTank(el, this.sceneController.riverFish, this.sceneController.riverFishAmount);
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
        size: {type: 'int'},
        timesfed: {type: 'int'},
        isfromserver: {type: 'boolean', default: false},
        rtscale: {type: 'string', default:'1 1 1'},
        sscale: {type: 'string', default:'.1 .1 .1'},
    },
    init: function() {
        var el = this.el;
        var data = this.data;
        
        // reference to the scene
        this.scene = el.sceneEl;
        this.sceneController = this.scene.components.controller;
        
        this.fishData = this.sceneController.getFishData(el);
        this.setupData();
        console.log(data.isfromserver);
        
        this.mdFN = ()=> {
            if(this.sceneController.selectedFish == null) {
                el.emit('showfish',{fishSelected:el},true);
            } else if (this.sceneController.selectedFish != null && this.sceneController.selectedFish == el) {
                // TODO: emit feed fish
            }
        };
                
        el.addEventListener('mousedown', this.mdFN);
        el.setAttribute('class', 'interactable');
    },
    setupData: function() {
        var data = this.data;

        data.birthday = this.fishData.BirthDay;
        data.name = this.fishData.Name;
        data.size = this.fishData.Size;
        data.timesfed = this.fishData.TimesFed;
    },
    remove: function() {
        this.el.removeEventListener('mousedown', this.mdFN);
    },
});