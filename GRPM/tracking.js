var imageAnchorToPlaneQuat = new THREE.Quaternion();
imageAnchorToPlaneQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.Math.DEG2RAD * -90);
// attach to an empty game object to serve as an anchor for any child object.
AFRAME.registerComponent('imagetracking', {
    schema: {
        name: { type: 'string'},
        src: { type: 'string'},
        physicalWidth: {type: 'number'},
        vertical: { default: false }
    },
    // sets up component for use
    init: function () {
        this.el.setAttribute('visible', false);
        this.added = false;
    },
    // runs every frame as an update loop
    tick: function () {
        // gets the ar component from the scene
        if (!this.source) {
            this.source = document.querySelector('[ar]').components.ar.getSource();
        }
        
        if (!this.source) { return; }
        // adds the image to the ar imagetracker
        if (!this.added) {
            this.source.addImage(this.data.name,
                                 this.data.src,
                                 this.data.physicalWidth);
            this.added = true;
            return;
        }
        // retrieves the current anchors
        var anchors = this.source.getAnchors();
        // if anchors does not equal null and the length is more than 0
        if (anchors && anchors.length) {
            // loop through the anchors
            for (var i = 0; i < anchors.length; i++) {
                // if the anchors name equals this components name
                if (anchors[i].name === this.data.name) {
                    var mat = new THREE.Matrix4().fromArray(anchors[i].modelMatrix);
                    mat.decompose(this.el.object3D.position, this.el.object3D.quaternion, this.el.object3D.scale);
                    if (this.data.vertical) { 
                        this.el.object3D.quaternion.multiply(imageAnchorToPlaneQuat);
                    }
                    
                    if (!this.el.getAttribute('visible')) {
                        this.el.setAttribute('visible', true);
                        this.el.emit('imageanchor', {anchor: anchors[i]});
                        this.el.emit('imagetracking');
                        
                    } else {
                        this.el.emit('imageanchorupdate', {anchor: anchors[i]});
                    } 
                    /*
                    if(!this.removed) {
                        this.removed = true;
                        this.source.removeImage(this.data.name);
                    } 
                    */
                }
            }
        }
    }
});