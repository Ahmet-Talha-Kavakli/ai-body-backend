import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export interface SkeletonModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

let cachedModel: SkeletonModel | null = null;
let loadingPromise: Promise<SkeletonModel | null> | null = null;

export async function loadSkeletonModel(): Promise<SkeletonModel | null> {
  if (cachedModel) return cachedModel;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const loader = new GLTFLoader();
      return new Promise<SkeletonModel | null>((resolve) => {
        loader.load(
          '/models/skeleton.glb',
          (gltf) => {
            cachedModel = {
              scene: gltf.scene,
              animations: gltf.animations || [],
            };
            resolve(cachedModel);
          },
          undefined,
          (error) => {
            console.error('Failed to load skeleton model:', error);
            resolve(null);
          }
        );
      });
    } catch (error) {
      console.error('Skeleton model loading error:', error);
      return null;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export function getSkeletonModel(): SkeletonModel | null {
  return cachedModel;
}
