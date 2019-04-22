AFRAME.registerPrimitive('a-tank', {
    defaultComponents: {
        geometry: {primitive:'box', width:2, depth:1, height:.4},
        material: {color:'blue', opacity:.5},
        position: {x:0, y:-1, z:-2},
    },
    mappings: {
    },
});

AFRAME.registerPrimitive('a-river', {
    defaultComponents: {
        geometry: {primitive:'box', width:1, depth:2, height:.4},
        material: {color:'blue', opacity:.5},
        position: {x:-2, y:-1, z:0},
    },
    mappings: {
    },
});

AFRAME.registerPrimitive('a-food', {
    defaultComponents: {
        geometry: {primitive:'box', width:.5, depth:.5, height:.5},
        material: {color:'red', opacity:1},
        position: {x:2, y:-1, z:0},
    },
    mappings: {
    },
});

AFRAME.registerPrimitive('a-fish', {
    defaultComponents: {
        geometry: {primitive:'sphere', radius:.1},
        material: {color:'green', opacity:1},
        position: {x:0, y:0, z:0},
    },
    mappings: {
    },
});