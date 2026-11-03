
(async () => {
  "use strict";

  const HF = "https://huggingface.co/supermanone-boop/ITAMI/resolve/main/";
  const GH = "https://raw.githubusercontent.com/supermanone-boop/model/main/";

  const models = [
    {
      name: "KADO1",
      url: HF + "kado_01.glb",
      lon: 135.442825,
      lat: 34.788936,
      height: 8.888973662526322,
      scale: 9.9,
      rotationX: 0,
      rotationY: 0,
      rotationZ: -135
    },
    {
      name: "KADO2",
      url: GH + "kado_02.glb",
      lon: 135.437349,
      lat: 34.793579,
      height: 8.888973662526322,
      scale: 9.9,
      rotationX: 0,
      rotationY: 0,
      rotationZ: -135
    },
    {
      name: "KADO4",
      url: GH + "kado_04.glb",
      lon: 135.442945,
      lat: 34.791555,
      height: 8.888973662526322,
      scale: 9.9,
      rotationX: 0,
      rotationY: 0,
      rotationZ: -135
    }
  ];

  function waitForGeoFS() {
    return new Promise(resolve => {
      const timer = setInterval(() => {
        if (window.geofs?.api?.viewer && window.Cesium) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  }

  await waitForGeoFS();

  const viewer = geofs.api.viewer;

  // Google satellite imagery
  window.geofs.api.imageryProvider =
    new Cesium.UrlTemplateImageryProvider({
      maximumLevel: 30,
      url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    });

  window.geofs.api.setImageryProvider(
    window.geofs.api.imageryProvider,
    false
  );

  // Load models
  for (const config of models) {
    try {
      const position = Cesium.Cartesian3.fromDegrees(
        config.lon,
        config.lat,
        config.height
      );

      const hpr = new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(config.rotationZ),
        Cesium.Math.toRadians(config.rotationX),
        Cesium.Math.toRadians(config.rotationY)
      );

      const rotation =
        Cesium.Transforms.headingPitchRollQuaternion(
          position,
          hpr
        );

      const model = await Cesium.Model.fromGltf({
        url: config.url,
        modelMatrix:
          Cesium.Matrix4.fromTranslationQuaternionRotationScale(
            position,
            rotation,
            new Cesium.Cartesian3(
              config.scale,
              config.scale,
              config.scale
            )
          ),
        scale: 1
      });

      viewer.scene.primitives.add(model);

      console.log("[KADO] Loaded:", config.name);

    } catch (error) {
      console.error("[KADO] Failed:", config.name, error);
    }
  }

  console.log("[KADO] All models processed.");
})();
