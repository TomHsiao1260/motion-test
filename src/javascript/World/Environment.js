import * as THREE from 'three';

import envMap0 from '../../models/environmentMaps/0/px.jpg';
import envMap1 from '../../models/environmentMaps/0/nx.jpg';
import envMap2 from '../../models/environmentMaps/0/py.jpg';
import envMap3 from '../../models/environmentMaps/0/ny.jpg';
import envMap4 from '../../models/environmentMaps/0/pz.jpg';
import envMap5 from '../../models/environmentMaps/0/nz.jpg';

export default class Environment {
    constructor() {
        this.resources = [];
        this.resources.push(envMap0);
        this.resources.push(envMap1);
        this.resources.push(envMap2);
        this.resources.push(envMap3);
        this.resources.push(envMap4);
        this.resources.push(envMap5);

        this.setEnvironment();
    }

    setEnvironment() {
        this.cubeTextureLoader = new THREE.CubeTextureLoader();
        this.environmentMap = this.cubeTextureLoader.load(this.resources);
        this.environmentMap.encoding = THREE.sRGBEncoding;
    }
}