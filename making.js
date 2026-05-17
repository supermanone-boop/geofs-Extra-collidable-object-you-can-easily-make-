'use strict';

(() => {

    // =====================================================
    // WAIT
    // =====================================================

    const wait = setInterval(() => {

        if (
            !window.geofs ||
            !geofs.api ||
            !window.Cesium
        ) return;

        clearInterval(wait);

        init();

    }, 500);

    // =====================================================
    // INIT
    // =====================================================

    function init() {

        const viewer = geofs.api.viewer;
        const scene = viewer.scene;

        // =====================================================
        // STATE
        // =====================================================

        let center = null;

        let mode = "square";

        let size = 500;
        let height = 100;
        let sides = 5;

        let alpha = 0.6;
        let colorHex = "#808080";

        const spawned = [];

        // =====================================================
        // UI
        // =====================================================

        const old =
            document.getElementById(
                "geoCollisionBuilder"
            );

        if (old) old.remove();

        const panel =
            document.createElement("div");

        panel.id = "geoCollisionBuilder";

        panel.style.position = "absolute";
        panel.style.top = "10px";
        panel.style.right = "10px";
        panel.style.zIndex = "999999";
        panel.style.background =
            "rgba(0,0,0,0.82)";
        panel.style.color = "white";
        panel.style.padding = "10px";
        panel.style.fontFamily =
            "monospace";
        panel.style.fontSize = "12px";
        panel.style.border =
            "1px solid gray";
        panel.style.width = "220px";

        panel.innerHTML = `

<div style="margin-bottom:8px;">
GeoFS Collision Builder
</div>

<button id="squareBtn">Square</button>
<button id="rectBtn">Rect</button>
<button id="circleBtn">Circle</button>
<button id="polyBtn">Polygon</button>

<br><br>

SIZE (m)
<br>
<input id="sizeInput" type="number" value="500" style="width:100%;">

<br><br>

HEIGHT
<br>
<input id="heightInput" type="number" value="100" style="width:100%;">

<br><br>

POLYGON SIDES
<br>
<input id="sidesInput" type="number" value="5" style="width:100%;">

<br><br>

ALPHA
<br>
<input id="alphaInput" type="range" min="0" max="1" step="0.01" value="0.6" style="width:100%;">

<br><br>

COLOR
<br>
<input id="colorInput" type="color" value="#808080" style="width:100%;">

<br><br>

<button id="spawnBtn">
ADD OBJECT
</button>

<button id="clearBtn">
CLEAR
</button>

`;

        document.body.appendChild(panel);

        const $ = (s) =>
            panel.querySelector(s);

        // =====================================================
        // UI EVENTS
        // =====================================================

        $("#squareBtn").onclick =
            () => mode = "square";

        $("#rectBtn").onclick =
            () => mode = "rect";

        $("#circleBtn").onclick =
            () => mode = "circle";

        $("#polyBtn").onclick =
            () => mode = "polygon";

        $("#sizeInput").oninput =
            (e) => size =
                Number(e.target.value);

        $("#heightInput").oninput =
            (e) => height =
                Number(e.target.value);

        $("#sidesInput").oninput =
            (e) => sides =
                Number(e.target.value);

        $("#alphaInput").oninput =
            (e) => alpha =
                Number(e.target.value);

        $("#colorInput").oninput =
            (e) => colorHex =
                e.target.value;

        // =====================================================
        // CENTER PICK
        // =====================================================

        const handler =
            new Cesium
            .ScreenSpaceEventHandler(
                scene.canvas
            );

        handler.setInputAction(

            (click) => {

                const cartesian =
                    scene.pickPosition(
                        click.position
                    );

                if (!cartesian) return;

                const carto =
                    Cesium.Cartographic
                    .fromCartesian(
                        cartesian
                    );

                center = {

                    lat:
                        Cesium.Math
                        .toDegrees(
                            carto.latitude
                        ),

                    lon:
                        Cesium.Math
                        .toDegrees(
                            carto.longitude
                        ),

                    alt:
                        carto.height
                };

                console.log(
                    "[CENTER]",
                    center
                );
            },

            Cesium
            .ScreenSpaceEventType
            .LEFT_CLICK
        );

        // =====================================================
        // TRIANGLE BUILDER
        // =====================================================

        function tri(p0,p1,p2){

            const u = [
                p1[0]-p0[0],
                p1[1]-p0[1],
                p1[2]-p0[2]
            ];

            const v = [
                p2[0]-p0[0],
                p2[1]-p0[1],
                p2[2]-p0[2]
            ];

            const n = [
                u[1]*v[2] -
                u[2]*v[1],

                u[2]*v[0] -
                u[0]*v[2],

                u[0]*v[1] -
                u[1]*v[0]
            ];

            return Object.assign(
                [p0,p1,p2],
                {u,v,n}
            );
        }

        // =====================================================
        // LOCAL SHAPE
        // =====================================================

        function buildLocalShape(
            shapeMode,
            shapeSize,
            polySides
        ){

            const pts = [];

            const R = shapeSize / 2;

            // =========================
            // SQUARE
            // =========================

            if (shapeMode === "square") {

                pts.push(
                    [-R,-R],
                    [ R,-R],
                    [ R, R],
                    [-R, R]
                );
            }

            // =========================
            // RECT
            // =========================

            else if (
                shapeMode === "rect"
            ){

                pts.push(
                    [-R*1.5,-R],
                    [ R*1.5,-R],
                    [ R*1.5, R],
                    [-R*1.5, R]
                );
            }

            // =========================
            // CIRCLE
            // =========================

            else if (
                shapeMode === "circle"
            ){

                const steps = 40;

                for (
                    let i = 0;
                    i < steps;
                    i++
                ){

                    const a =
                        (i / steps) *
                        Math.PI * 2;

                    pts.push([
                        Math.cos(a) * R,
                        Math.sin(a) * R
                    ]);
                }
            }

            // =========================
            // POLYGON
            // =========================

            else if (
                shapeMode === "polygon"
            ){

                const step =
                    (Math.PI * 2) /
                    polySides;

                for (
                    let i = 0;
                    i < polySides;
                    i++
                ){

                    const a =
                        i * step;

                    pts.push([
                        Math.cos(a) * R,
                        Math.sin(a) * R
                    ]);
                }
            }

            return pts;
        }

        // =====================================================
        // COLLISION TRIANGLES
        // =====================================================

        function buildCollisionTriangles(
            localPts,
            zHeight
        ){

            const tris = [];

            for (
                let i = 1;
                i < localPts.length - 1;
                i++
            ){

                const p0 = [
                    localPts[0][0],
                    localPts[0][1],
                    zHeight
                ];

                const p1 = [
                    localPts[i][0],
                    localPts[i][1],
                    zHeight
                ];

                const p2 = [
                    localPts[i+1][0],
                    localPts[i+1][1],
                    zHeight
                ];

                tris.push(
                    tri(p0,p1,p2)
                );
            }

            return tris;
        }

        // =====================================================
        // CESIUM POSITIONS
        // =====================================================

        function buildCesiumPositions(
            centerData,
            localPts,
            zHeight
        ){

            const positions = [];

            localPts.forEach((p) => {

                const lat =
                    centerData.lat +
                    (
                        p[1] /
                        111320
                    );

                const lon =
                    centerData.lon +
                    (
                        p[0] /
                        (
                            111320 *
                            Math.cos(
                                centerData.lat *
                                Math.PI / 180
                            )
                        )
                    );

                positions.push(

                    Cesium
                    .Cartesian3
                    .fromDegrees(
                        lon,
                        lat,
                        zHeight
                    )
                );
            });

            return positions;
        }

        // =====================================================
        // CREATE ENTITY
        // =====================================================

        function createCesiumPolygon(
            spawnData
        ){

            return viewer.entities.add({

                polygon: {

                    hierarchy:
                        buildCesiumPositions(

                            spawnData.center,

                            spawnData.localPts,

                            spawnData.height
                        ),

                    material:

                        Cesium.Color
                        .fromCssColorString(
                            spawnData.colorHex
                        )
                        .withAlpha(
                            spawnData.alpha
                        ),

                    extrudedHeight:
                        spawnData.height,

                    outline: true,

                    outlineColor:
                        Cesium.Color.BLACK
                }
            });
        }

        // =====================================================
        // REBUILD
        // =====================================================

        function rebuildAll(){

            spawned.forEach((s) => {

                try {

                    if (s.entity) {

                        viewer.entities
                        .remove(
                            s.entity
                        );
                    }

                } catch(e){}

                s.entity =
                    createCesiumPolygon(s);
            });

            console.log(
                "[REBUILT]"
            );
        }

        // =====================================================
        // SPAWN
        // =====================================================

        $("#spawnBtn").onclick = () => {

            if (!center){

                alert(
                    "先に中心クリック"
                );

                return;
            }

            // =========================
            // LOCAL SHAPE
            // =========================

            const localPts =
                buildLocalShape(
                    mode,
                    size,
                    sides
                );

            // =========================
            // COLLISION TRIANGLES
            // =========================

            const collisionTriangles =
                buildCollisionTriangles(
                    localPts,
                    height
                );

            // =========================
            // OBJECT
            // =========================

            const obj = {

                name:
                    "Generated Collision",

                type: 100,

                location: [
                    center.lat,
                    center.lon,
                    center.alt
                ],

                htr: [0,0,0],

                rotateModelOnly:
                    false,

                scale: 1,

                metricOffset:
                    [0,0,0],

                collisionRadius:
                    size * 2,

                collisionTriangles,

                options: {}
            };

            // =========================
            // PUSH
            // =========================

            geofs.objects
            .objectList
            .push(obj);

            geofs.objects
            .loadModels();

            // =========================
            // SAVE
            // =========================

            const spawnData = {

                center: {
                    ...center
                },

                mode,

                size,

                sides,

                height,

                alpha,

                colorHex,

                localPts,

                obj
            };

            // =========================
            // CESIUM
            // =========================

            spawnData.entity =
                createCesiumPolygon(
                    spawnData
                );

            // =========================
            // STORE
            // =========================

            spawned.push(
                spawnData
            );

            console.log(
                "[SPAWNED]",
                spawnData
            );
        };

        // =====================================================
        // CLEAR
        // =====================================================

        $("#clearBtn").onclick =
            () => {

            spawned.forEach((s) => {

                try {

                    viewer.entities
                    .remove(
                        s.entity
                    );

                } catch(e){}
            });

            spawned.length = 0;

            console.log(
                "[CLEARED]"
            );
        };

        // =====================================================
        // CAMERA WATCH
        // =====================================================

        let lastCameraMode =
            geofs.camera
            .currentModeName;

        setInterval(() => {

            const now =
                geofs.camera
                .currentModeName;

            if (
                now !==
                lastCameraMode
            ){

                lastCameraMode =
                    now;

                console.log(
                    "[CAMERA CHANGED]",
                    now
                );

                rebuildAll();
            }

        }, 1000);

        console.log(
            "[GeoFS Collision Builder Loaded]"
        );
    }

})();