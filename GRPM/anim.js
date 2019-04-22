AFRAME.registerComponent('lerpAnim', {
    schema: {
        property: {type:'string', default:'position'},
        from: {type:'string', default:'0 0 0'},
        to: {type:'string', default:'0 0 0'},
        dur: {type:'number', default:1000},
        dir: {type:'string', default:'normal'},
        //startEvents: {type:'string', default:'slideto'},
    },
    init: function() {
        var el = this.el;
        var data = this.data;
        console.log('woot');
        el.setAttribute('animation', {
            property: data.property,
            from: data.from,
            to: data.to,
            dur: data.dur,
            dir: data.dir,
            //startEvents: data.startEvents,
        });
    },
});