const normalizeText = (value) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function scoreCandidate(candidate, alias) {
  if (candidate === alias) return 100;
  if (candidate.endsWith(alias)) return 82;
  if (candidate.startsWith(alias)) return 72;
  if (candidate.includes(alias)) return 56;
  return 0;
}

function getObjectTerms(object3D) {
  const terms = [];
  if (object3D.name) {
    terms.push(object3D.name);
  }
  const materials = Array.isArray(object3D.material)
    ? object3D.material
    : object3D.material
      ? [object3D.material]
      : [];
  materials.forEach((material) => {
    if (material?.name) {
      terms.push(material.name);
    }
  });
  return terms.map(normalizeText).filter(Boolean);
}

function matchesAliases(object3D, aliases) {
  const normalizedAliases = aliases.map(normalizeText);
  const terms = getObjectTerms(object3D);
  return terms.some((term) =>
    normalizedAliases.some((alias) => scoreCandidate(term, alias) > 0),
  );
}

function findNode(root, aliases) {
  let bestMatch = null;
  root.traverse((object3D) => {
    const terms = getObjectTerms(object3D);
    if (!terms.length) {
      return;
    }
    let bestScore = 0;
    aliases.forEach((alias) => {
      const normalizedAlias = normalizeText(alias);
      terms.forEach((term) => {
        bestScore = Math.max(bestScore, scoreCandidate(term, normalizedAlias));
      });
    });
    if (bestScore && (!bestMatch || bestScore > bestMatch.score)) {
      bestMatch = { object: object3D, score: bestScore };
    }
  });
  return bestMatch?.object ?? null;
}

function findRenderableNode(root, aliases) {
  let bestMatch = null;
  root.traverse((object3D) => {
    if (!object3D?.geometry) {
      return;
    }
    const terms = getObjectTerms(object3D);
    if (!terms.length) {
      return;
    }
    let bestScore = 0;
    aliases.forEach((alias) => {
      const normalizedAlias = normalizeText(alias);
      terms.forEach((term) => {
        bestScore = Math.max(bestScore, scoreCandidate(term, normalizedAlias));
      });
    });
    if (bestScore && (!bestMatch || bestScore > bestMatch.score)) {
      bestMatch = { object: object3D, score: bestScore };
    }
  });
  return bestMatch?.object ?? null;
}

function getObjectLocalCenter(root, object3D) {
  root.updateMatrixWorld(true);
  object3D.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object3D);
  return root.worldToLocal(bounds.getCenter(new THREE.Vector3()));
}

function shouldHideDecorativeObject(object3D) {
  if (!object3D || object3D === sourceSolarModel) {
    return false;
  }
  if (object3D.isLine || object3D.isLineSegments || object3D.isPoints) {
    return true;
  }
  const normalizedName = normalizeText(object3D.name);
  if (!normalizedName) {
    return false;
  }
  const looksDecorative = DECORATION_KEYWORDS.some((keyword) =>
    normalizedName.includes(keyword),
  );
  return (
    looksDecorative &&
    !solarBodies.some((body) => matchesAliases(object3D, body.aliases))
  );
}

function getRenderableBounds(root) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3();
  let hasBounds = false;
  root.traverse((object3D) => {
    if (
      !object3D.visible ||
      (!object3D.isMesh && !object3D.isSkinnedMesh) ||
      !object3D.geometry
    ) {
      return;
    }
    const objectBounds = new THREE.Box3().setFromObject(object3D);
    if (objectBounds.isEmpty()) {
      return;
    }
    if (!hasBounds) {
      bounds.copy(objectBounds);
      hasBounds = true;
    } else {
      bounds.union(objectBounds);
    }
  });
  if (!hasBounds) {
    bounds.setFromObject(root);
  }
  return bounds;
}

function tunePlanetAppearance(root, bodyId) {
  const fallbackColor = BODY_FALLBACK_COLORS[bodyId] ?? 0xd8dde8;
  root.traverse((object3D) => {
    if (!object3D.material) {
      return;
    }
    const materials = Array.isArray(object3D.material)
      ? object3D.material
      : [object3D.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 1;
      material.depthWrite = true;
      const hasLoadedMap = Boolean(material.map?.image);
      if (!hasLoadedMap && "color" in material) {
        material.color = new THREE.Color(fallbackColor);
      }
      if ("emissive" in material) {
        material.emissive = new THREE.Color(bodyId === "sun" ? 0xff9838 : 0x101318);
        material.emissiveIntensity = bodyId === "sun" ? 0.75 : 0.08;
      }
      if ("roughness" in material) {
        material.roughness = bodyId === "sun" ? 0.95 : 0.82;
      }
      if ("metalness" in material) {
        material.metalness = 0.02;
      }
      if ("shininess" in material) {
        material.shininess = bodyId === "sun" ? 38 : 18;
      }
      if ("specular" in material) {
        material.specular = new THREE.Color(0x2b3440);
      }
      if (bodyId === "sun" && "emissive" in material) {
        material.emissive = new THREE.Color(0xffa642);
        material.emissiveIntensity = 0.65;
      }
      material.needsUpdate = true;
    });
  });
}

function addBodyLabel(body, index, labelAnchor) {
  const button = document.createElement("button");
  button.className = "hotspot-label";
  button.type = "button";
  button.textContent = body.label;
  button.title = body.title;
  button.setAttribute("aria-label", body.label);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setFocusedPart(focusedPartIndex === index ? -1 : index);
  });
  const label = new THREE.CSS2DObject(button);
  labelAnchor.add(label);
  labels.push({ id: body.id, index, label });
}

function applySunOrangeAppearance(root) {
  root.traverse((object3D) => {
    if (!object3D.material) {
      return;
    }

    const materials = Array.isArray(object3D.material)
      ? object3D.material
      : [object3D.material];

    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 1;
      material.depthWrite = true;

      if ("color" in material) {
        material.color = new THREE.Color(0xff932f);
      }

      if ("emissive" in material) {
        material.emissive = new THREE.Color(0xff8a1f);
        material.emissiveIntensity = 0.72;
      }

      if ("roughness" in material) {
        material.roughness = 0.88;
      }

      if ("metalness" in material) {
        material.metalness = 0.01;
      }

      if ("shininess" in material) {
        material.shininess = 44;
      }

      material.needsUpdate = true;
    });
  });
}

function scaleDirectPlanetNodes(root) {
  solarBodies.forEach((body) => {
    const sourceNode = findNode(root, body.aliases);
    if (!sourceNode) {
      return;
    }

    sourceNode.scale.multiplyScalar(DIRECT_PLANET_SCALE_FACTORS[body.id] ?? 1.22);
    if (body.id === "sun") {
      applySunOrangeAppearance(sourceNode);
      return;
    }

    tunePlanetAppearance(sourceNode, body.id);
  });
  root.updateMatrixWorld(true);
}

function createDirectOrbitMesh(center, radius, bodyIndex) {
  const segments = 96;
  const points = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y,
        center.z + Math.sin(angle) * radius,
      ),
    );
  }

  const curve = new THREE.CatmullRomCurve3(points, true);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 180, DIRECT_ORBIT_TUBE_RADIUS, 12, true),
    new THREE.MeshBasicMaterial({
      color: DIRECT_ORBIT_COLOR,
      transparent: true,
      opacity: Math.max(0.22, DIRECT_ORBIT_OPACITY - bodyIndex * 0.028),
      depthWrite: false,
    }),
  );
  mesh.renderOrder = -1;
  return mesh;
}

function addDirectOrbitOverlays(root) {
  const sunNode = findNode(root, solarBodies[0].aliases);
  if (!sunNode) {
    return;
  }

  root.updateMatrixWorld(true);
  const sunPosition = root.worldToLocal(sunNode.getWorldPosition(new THREE.Vector3()));
  const orbitGroup = new THREE.Group();
  orbitGroup.name = "direct-orbit-overlays";

  solarBodies.slice(1).forEach((body, index) => {
    const sourceNode = findNode(root, body.aliases);
    if (!sourceNode) {
      return;
    }

    const planetPosition = root.worldToLocal(
      sourceNode.getWorldPosition(new THREE.Vector3()),
    );
    const radius = Math.hypot(
      planetPosition.x - sunPosition.x,
      planetPosition.z - sunPosition.z,
    );

    if (radius < 0.05) {
      return;
    }

    orbitGroup.add(createDirectOrbitMesh(sunPosition, radius, index));
  });

  root.add(orbitGroup);
  root.updateMatrixWorld(true);
}

function attachLabelsToNamedNodes(root) {
  solarBodies.forEach((body, index) => {
    const labelAnchor = new THREE.Group();
    const sourceNode = findNode(root, body.aliases);

    if (sourceNode) {
      labelAnchor.position.set(0, body.layout.labelLift * DIRECT_LABEL_LIFT_SCALE, 0);
      sourceNode.add(labelAnchor);
    } else {
      labelAnchor.position.set(...body.layout.position);
      root.add(labelAnchor);
    }

    addBodyLabel(body, index, labelAnchor);
  });
}

function getDirectBackdropAnchor(root) {
  const sunPivot = findNode(root, solarBodies[0].aliases);
  if (sunPivot) {
    root.updateMatrixWorld(true);
    return root.worldToLocal(sunPivot.getWorldPosition(new THREE.Vector3()));
  }

  const sunMesh = findRenderableNode(root, solarBodies[0].aliases);
  if (!sunMesh) {
    return new THREE.Vector3(0, 0, 0);
  }

  return getObjectLocalCenter(root, sunMesh);
}

function renderDirectSolarModel(root, modelConfig, options = {}) {
  const {
    enhanceModel = true,
    animations = [],
  } = options;

  if (enhanceModel) {
    root.traverse((object3D) => {
      if (shouldHideDecorativeObject(object3D)) {
        object3D.visible = false;
      }
    });
    scaleDirectPlanetNodes(root);
    addDirectOrbitOverlays(root);
  }

  normalizeModel(
    root,
    modelConfig.targetSize ?? defaultConfig.assets.models.solar.targetSize,
  );

  const backdropAnchor = getDirectBackdropAnchor(root);
  root.position.sub(backdropAnchor);
  root.updateMatrixWorld(true);

  attachLabelsToNamedNodes(root);
  modelHolder.add(root);

  if (animations.length && modelConfig.animationClipName) {
    const clip =
      THREE.AnimationClip.findByName(animations, modelConfig.animationClipName) ??
      animations[0];

    if (clip) {
      animationMixer = new THREE.AnimationMixer(root);
      const action = animationMixer.clipAction(clip);
      action.timeScale = modelConfig.animationTimeScale ?? 1;
      action.play();
    }
  }
}

function normalizeModel(root, targetSize) {
  root.updateMatrixWorld(true);
  const bounds = getRenderableBounds(root);
  const size = bounds.getSize(new THREE.Vector3());
  const factor = targetSize / (Math.max(size.x, size.y, size.z) || 1);
  root.scale.multiplyScalar(factor);
  root.updateMatrixWorld(true);
  const centeredBounds = getRenderableBounds(root);
  const center = centeredBounds.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.updateMatrixWorld(true);
}
