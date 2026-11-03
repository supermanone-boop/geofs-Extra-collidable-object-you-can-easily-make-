
"use strict";

(async () => {
  const HF = "https://huggingface.co/supermanone-boop/ITAMI/resolve/main/";
  const GH = "https://raw.githubusercontent.com/supermanone-boop/model/main/";

  const BRIGHTNESS = 2.665;

  const configs = [
    {
      name: "KADO1",
      url: HF + "kado_01.glb",
      lon: 135.442825,
      lat: 34.788936,
      height: 8.888973662526322,
      scale: 9.9,
      rx: 0, ry: 0, rz: -135
    },
    {
      name: "KADO2",
      url: GH + "kado_02.glb",
      lon: 135.437349,
      lat: 34.793579,
      height: 8.888973662526322,
      scale: 9.9,
      rx: 0, ry: 0, rz: -135
    },
    {
      name: "KADO4",
      url: GH + "kado_04.glb",
      lon: 135.442945,
      lat: 34.791555,
      height: 8.888973662526322,
      scale: 9.9,
      rx: 0, ry: 0, rz: -135
    }
  ];

  function waitForGeoFS() {
    return new Promise((resolve, reject) => {
      let count = 0;

      const timer = setInterval(() => {
        count++;

        if (
          window.geofs &&
          geofs.api &&
          geofs.api.viewer &&
          window.Cesium
        ) {
          clearInterval(timer);
          resolve();
        }

        if (count >= 120) {
          clearInterval(timer);
          reject(new Error("GeoFS initialization timeout"));
        }
      }, 500);
    });
  }

  await waitForGeoFS();

  const g = window.geofs;
  const C = window.Cesium;
  const viewer = g.api.viewer;

  // ==================================================
  // GEOFS HD SETTINGS
  // ==================================================

  window.geofsNewHDState = true;

  if (window.jQuery) {
    jQuery("body").trigger("terrainProviderWillUpdate");
  }

  g.geoIpUpdate = function () {
    delete g.api.analytics;

    document.body.classList.add("geofs-hd");

    g.api.imageryProvider =
      new C.UrlTemplateImageryProvider({
        maximumLevel: 21,
        hasAlphaChannel: false,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
      });

    g.api.setImageryProvider(
      g.api.imageryProvider,
      false
    );

    g.api.viewer.terrainProvider =
      g.api.flatRunwayTerrainProviderInstance =
      new g.api.FlatRunwayTerrainProvider({
        baseProvider: new C.CesiumTerrainProvider({
          url: "https://data.geo-fs.com/srtm/",
          requestWaterMask: false,
          requestVertexNormals: true
        }),
        bypass: false,
        maximumLevel: 12
      });
  };

  g.geoIpUpdate();

  g.api.hdOn = window.geofsNewHDState;

  // 空・描画品質の更新
  g.api.renderingQuality();

  if (window.jQuery) {
    jQuery("body").trigger("terrainProviderUpdate");
  }

  g.mapXYZ =
    "https://data.geo-fs.com/osm/{z}/{x}/{y}.png";

  viewer.scene.requestRender();

  // ==================================================
  // KADO MODEL LOADER
  // ==================================================

  for (const cfg of configs) {
    try {
      const position = C.Cartesian3.fromDegrees(
        cfg.lon,
        cfg.lat,
        cfg.height
      );

      const hpr = new C.HeadingPitchRoll(
        C.Math.toRadians(cfg.rz),
        C.Math.toRadians(cfg.rx),
        C.Math.toRadians(cfg.ry)
      );

      const rotation =
        C.Transforms.headingPitchRollQuaternion(
          position,
          hpr
        );

      const modelMatrix =
        C.Matrix4.fromTranslationQuaternionRotationScale(
          position,
          rotation,
          new C.Cartesian3(
            cfg.scale,
            cfg.scale,
            cfg.scale
          )
        );

      const model = await C.Model.fromGltf({
        url: cfg.url,
        modelMatrix: modelMatrix,
        scale: 1
      });

      // Brightness correction
      model.color = new C.Color(
        BRIGHTNESS,
        BRIGHTNESS,
        BRIGHTNESS,
        1
      );

      if (
        C.ModelColorBlendMode &&
        C.ModelColorBlendMode.HIGHLIGHT !== undefined
      ) {
        model.colorBlendMode =
          C.ModelColorBlendMode.HIGHLIGHT;

        model.colorBlendAmount = 0.18;
      }

      viewer.scene.primitives.add(model);

      console.log("[KADO] Loaded:", cfg.name);

    } catch (error) {
      console.error(
        "[KADO] Failed:",
        cfg.name,
        error
      );
    }
  }

  viewer.scene.requestRender();

  console.log("[KADO] HD + KADO system ready.");

})().catch(error => {
  console.error("[KADO SYSTEM ERROR]", error);
});
