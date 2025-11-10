(function () {
	'use strict';

	const animationEngine = (() => {
	  let uniqueID = 0;

	  class AnimationEngine {
	    constructor() {
	      this.ids = [];
	      this.animations = {};
	      this.update = this.update.bind(this);
	      this.raf = 0;
	      this.time = 0;
	    }

	    update() {
	      const now = performance.now();
	      const delta = now - this.time;
	      this.time = now;

	      let i = this.ids.length;

	      this.raf = i ? requestAnimationFrame(this.update) : 0;

	      while (i--)
	        this.animations[this.ids[i]] &&
	          this.animations[this.ids[i]].update(delta);
	    }

	    add(animation) {
	      animation.id = uniqueID++;

	      this.ids.push(animation.id);
	      this.animations[animation.id] = animation;

	      if (this.raf !== 0) return;

	      this.time = performance.now();
	      this.raf = requestAnimationFrame(this.update);
	    }

	    remove(animation) {
	      const index = this.ids.indexOf(animation.id);

	      if (index < 0) return;

	      this.ids.splice(index, 1);
	      delete this.animations[animation.id];
	      animation = null;
	    }
	  }

	  return new AnimationEngine();
	})();

	class Animation {
	  constructor(start) {
	    if (start === true) this.start();
	  }

	  start() {
	    animationEngine.add(this);
	  }

	  stop() {
	    animationEngine.remove(this);
	  }

	  update(delta) {}
	}

	class World extends Animation {

		constructor( game ) {

			super( true );

			this.game = game;

			this.container = this.game.dom.game;
			this.scene = new THREE.Scene();

			this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.container.appendChild( this.renderer.domElement );

			this.camera = new THREE.PerspectiveCamera( 2, 1, 0.1, 10000 );

			this.stage = { width: 2, height: 3 };
			this.fov = 10;

			this.createLights();

			this.onResize = [];

			this.resize();
			window.addEventListener( 'resize', () => this.resize(), false );

		}

		update() {

			this.renderer.render( this.scene, this.camera );

		}

		resize() {

			this.width = this.container.offsetWidth;
			this.height = this.container.offsetHeight;

			this.renderer.setSize( this.width, this.height );

		  this.camera.fov = this.fov;
		  this.camera.aspect = this.width / this.height;

			const aspect = this.stage.width / this.stage.height;
		  const fovRad = this.fov * THREE.Math.DEG2RAD;

		  let distance = ( aspect < this.camera.aspect )
				? ( this.stage.height / 2 ) / Math.tan( fovRad / 2 )
				: ( this.stage.width / this.camera.aspect ) / ( 2 * Math.tan( fovRad / 2 ) );

		  distance *= 0.5;

			this.camera.position.set( distance, distance, distance);
			this.camera.lookAt( this.scene.position );
			this.camera.updateProjectionMatrix();

			const docFontSize = ( aspect < this.camera.aspect )
				? ( this.height / 100 ) * aspect
				: this.width / 100;

			document.documentElement.style.fontSize = docFontSize + 'px';

			if ( this.onResize ) this.onResize.forEach( cb => cb() );

		}

		createLights() {

			this.lights = {
				holder:  new THREE.Object3D,
				ambient: new THREE.AmbientLight( 0xffffff, 0.69 ),
				front:   new THREE.DirectionalLight( 0xffffff, 0.36 ),
				back:    new THREE.DirectionalLight( 0xffffff, 0.19 ),
			};

			this.lights.front.position.set( 1.5, 5, 3 );
			this.lights.back.position.set( -1.5, -5, -3 );

			this.lights.holder.add( this.lights.ambient );
			this.lights.holder.add( this.lights.front );
			this.lights.holder.add( this.lights.back );

			this.scene.add( this.lights.holder );

		}

	}

	function RoundedBoxGeometry( size, radius, radiusSegments ) {

	  THREE.BufferGeometry.call( this );

	  this.type = 'RoundedBoxGeometry';

	  radiusSegments = ! isNaN( radiusSegments ) ? Math.max( 1, Math.floor( radiusSegments ) ) : 1;

	  var width, height, depth;

	  width = height = depth = size;
	  radius = size * radius;

	  radius = Math.min( radius, Math.min( width, Math.min( height, Math.min( depth ) ) ) / 2 );

	  var edgeHalfWidth = width / 2 - radius;
	  var edgeHalfHeight = height / 2 - radius;
	  var edgeHalfDepth = depth / 2 - radius;

	  this.parameters = {
	    width: width,
	    height: height,
	    depth: depth,
	    radius: radius,
	    radiusSegments: radiusSegments
	  };

	  var rs1 = radiusSegments + 1;
	  var totalVertexCount = ( rs1 * radiusSegments + 1 ) << 3;

	  var positions = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );
	  var normals = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );

	  var cornerVerts = [],
	    cornerNormals = [];
	    new THREE.Vector3();
	    var vertex = new THREE.Vector3(),
	    vertexPool = [],
	    normalPool = [],
	    indices = []
	  ;

	  var
	    lastVertex = rs1 * radiusSegments,
	    cornerVertNumber = rs1 * radiusSegments + 1
	  ;

	  doVertices();
	  doFaces();
	  doCorners();
	  doHeightEdges();
	  doWidthEdges();
	  doDepthEdges();

	  function doVertices() {

	    var cornerLayout = [
	      new THREE.Vector3( 1, 1, 1 ),
	      new THREE.Vector3( 1, 1, -1 ),
	      new THREE.Vector3( -1, 1, -1 ),
	      new THREE.Vector3( -1, 1, 1 ),
	      new THREE.Vector3( 1, -1, 1 ),
	      new THREE.Vector3( 1, -1, -1 ),
	      new THREE.Vector3( -1, -1, -1 ),
	      new THREE.Vector3( -1, -1, 1 )
	    ];

	    for ( var j = 0; j < 8; j ++ ) {

	      cornerVerts.push( [] );
	      cornerNormals.push( [] );

	    }

	    var PIhalf = Math.PI / 2;
	    var cornerOffset = new THREE.Vector3( edgeHalfWidth, edgeHalfHeight, edgeHalfDepth );

	    for ( var y = 0; y <= radiusSegments; y ++ ) {

	      var v = y / radiusSegments;
	      var va = v * PIhalf;
	      var cosVa = Math.cos( va );
	      var sinVa = Math.sin( va );

	      if ( y == radiusSegments ) {

	        vertex.set( 0, 1, 0 );
	        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
	        cornerVerts[ 0 ].push( vert );
	        vertexPool.push( vert );
	        var norm = vertex.clone();
	        cornerNormals[ 0 ].push( norm );
	        normalPool.push( norm );
	        continue;

	      }

	      for ( var x = 0; x <= radiusSegments; x ++ ) {

	        var u = x / radiusSegments;
	        var ha = u * PIhalf;
	        vertex.x = cosVa * Math.cos( ha );
	        vertex.y = sinVa;
	        vertex.z = cosVa * Math.sin( ha );

	        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
	        cornerVerts[ 0 ].push( vert );
	        vertexPool.push( vert );

	        var norm = vertex.clone().normalize();
	        cornerNormals[ 0 ].push( norm );
	        normalPool.push( norm );

	      }

	    }

	    for ( var i = 1; i < 8; i ++ ) {

	      for ( var j = 0; j < cornerVerts[ 0 ].length; j ++ ) {

	        var vert = cornerVerts[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
	        cornerVerts[ i ].push( vert );
	        vertexPool.push( vert );

	        var norm = cornerNormals[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
	        cornerNormals[ i ].push( norm );
	        normalPool.push( norm );

	      }

	    }

	  }

	  function doCorners() {

	    var flips = [
	      true,
	      false,
	      true,
	      false,
	      false,
	      true,
	      false,
	      true
	    ];

	    var lastRowOffset = rs1 * ( radiusSegments - 1 );

	    for ( var i = 0; i < 8; i ++ ) {

	      var cornerOffset = cornerVertNumber * i;

	      for ( var v = 0; v < radiusSegments - 1; v ++ ) {

	        var r1 = v * rs1;
	        var r2 = ( v + 1 ) * rs1;

	        for ( var u = 0; u < radiusSegments; u ++ ) {

	          var u1 = u + 1;
	          var a = cornerOffset + r1 + u;
	          var b = cornerOffset + r1 + u1;
	          var c = cornerOffset + r2 + u;
	          var d = cornerOffset + r2 + u1;

	          if ( ! flips[ i ] ) {

	            indices.push( a );
	            indices.push( b );
	            indices.push( c );

	            indices.push( b );
	            indices.push( d );
	            indices.push( c );

	          } else {

	            indices.push( a );
	            indices.push( c );
	            indices.push( b );

	            indices.push( b );
	            indices.push( c );
	            indices.push( d );

	          }

	        }

	      }

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var a = cornerOffset + lastRowOffset + u;
	        var b = cornerOffset + lastRowOffset + u + 1;
	        var c = cornerOffset + lastVertex;

	        if ( ! flips[ i ] ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );

	        }

	      }

	    }

	  }

	  function doFaces() {

	    var a = lastVertex;
	    var b = lastVertex + cornerVertNumber;
	    var c = lastVertex + cornerVertNumber * 2;
	    var d = lastVertex + cornerVertNumber * 3;

	    indices.push( a );
	    indices.push( b );
	    indices.push( c );
	    indices.push( a );
	    indices.push( c );
	    indices.push( d );

	    a = lastVertex + cornerVertNumber * 4;
	    b = lastVertex + cornerVertNumber * 5;
	    c = lastVertex + cornerVertNumber * 6;
	    d = lastVertex + cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( a );
	    indices.push( d );
	    indices.push( c );

	    a = 0;
	    b = cornerVertNumber;
	    c = cornerVertNumber * 4;
	    d = cornerVertNumber * 5;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	    a = cornerVertNumber * 2;
	    b = cornerVertNumber * 3;
	    c = cornerVertNumber * 6;
	    d = cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	    a = radiusSegments;
	    b = radiusSegments + cornerVertNumber * 3;
	    c = radiusSegments + cornerVertNumber * 4;
	    d = radiusSegments + cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( b );
	    indices.push( c );
	    indices.push( b );
	    indices.push( d );
	    indices.push( c );

	    a = radiusSegments + cornerVertNumber;
	    b = radiusSegments + cornerVertNumber * 2;
	    c = radiusSegments + cornerVertNumber * 5;
	    d = radiusSegments + cornerVertNumber * 6;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	  }

	  function doHeightEdges() {

	    for ( var i = 0; i < 4; i ++ ) {

	      var cOffset = i * cornerVertNumber;
	      var cRowOffset = 4 * cornerVertNumber + cOffset;
	      var needsFlip = i & 1 === 1;

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var u1 = u + 1;
	        var a = cOffset + u;
	        var b = cOffset + u1;
	        var c = cRowOffset + u;
	        var d = cRowOffset + u1;

	        if ( ! needsFlip ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        }

	      }

	    }

	  }

	  function doDepthEdges() {

	    var cStarts = [ 0, 2, 4, 6 ];
	    var cEnds = [ 1, 3, 5, 7 ];

	    for ( var i = 0; i < 4; i ++ ) {

	      var cStart = cornerVertNumber * cStarts[ i ];
	      var cEnd = cornerVertNumber * cEnds[ i ];

	      var needsFlip = 1 >= i;

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var urs1 = u * rs1;
	        var u1rs1 = ( u + 1 ) * rs1;

	        var a = cStart + urs1;
	        var b = cStart + u1rs1;
	        var c = cEnd + urs1;
	        var d = cEnd + u1rs1;

	        if ( needsFlip ) {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        } else {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        }

	      }

	    }

	  }

	  function doWidthEdges() {

	    var end = radiusSegments - 1;

	    var cStarts = [ 0, 1, 4, 5 ];
	    var cEnds = [ 3, 2, 7, 6 ];
	    var needsFlip = [ 0, 1, 1, 0 ];

	    for ( var i = 0; i < 4; i ++ ) {

	      var cStart = cStarts[ i ] * cornerVertNumber;
	      var cEnd = cEnds[ i ] * cornerVertNumber;

	      for ( var u = 0; u <= end; u ++ ) {

	        var a = cStart + radiusSegments + u * rs1;
	        var b = cStart + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

	        var c = cEnd + radiusSegments + u * rs1;
	        var d = cEnd + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

	        if ( ! needsFlip[ i ] ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        }

	      }

	    }

	  }

	  var index = 0;

	  for ( var i = 0; i < vertexPool.length; i ++ ) {

	    positions.setXYZ(
	      index,
	      vertexPool[ i ].x,
	      vertexPool[ i ].y,
	      vertexPool[ i ].z
	    );

	    normals.setXYZ(
	      index,
	      normalPool[ i ].x,
	      normalPool[ i ].y,
	      normalPool[ i ].z
	    );

	    index ++;

	  }

	  this.setIndex( new THREE.BufferAttribute( new Uint16Array( indices ), 1 ) );
	  this.addAttribute( 'position', positions );
	  this.addAttribute( 'normal', normals );

	}

	RoundedBoxGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
	RoundedBoxGeometry.constructor = RoundedBoxGeometry;

	function RoundedPlaneGeometry( size, radius, depth ) {

	  var x, y, width, height;

	  x = y = - size / 2;
	  width = height = size;
	  radius = size * radius;

	  const shape = new THREE.Shape();

	  shape.moveTo( x, y + radius );
	  shape.lineTo( x, y + height - radius );
	  shape.quadraticCurveTo( x, y + height, x + radius, y + height );
	  shape.lineTo( x + width - radius, y + height );
	  shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
	  shape.lineTo( x + width, y + radius );
	  shape.quadraticCurveTo( x + width, y, x + width - radius, y );
	  shape.lineTo( x + radius, y );
	  shape.quadraticCurveTo( x, y, x, y + radius );

	  const geometry = new THREE.ExtrudeBufferGeometry(
	    shape,
	    { depth: depth, bevelEnabled: false, curveSegments: 3 }
	  );

	  return geometry;

	}

	let Cube$1 = class Cube {
	  constructor(game) {
	    this.game = game;
	    this.size = 3;

	    this.geometry = {
	      pieceCornerRadius: 0.12,
	      edgeCornerRoundness: 0.15,
	      edgeScale: 0.82,
	      edgeDepth: 0.01,
	    };

	    this.holder = new THREE.Object3D();
	    this.object = new THREE.Object3D();
	    this.animator = new THREE.Object3D();

	    this.holder.add(this.animator);
	    this.animator.add(this.object);

	    this.game.world.scene.add(this.holder);
	  }

	  init() {
	    this.cubes = [];
	    this.object.children = [];
	    this.object.add(this.game.controls.group);

	    if (this.size === 2) this.scale = 1.25;
	    else if (this.size === 3) this.scale = 1;
	    else if (this.size > 3) this.scale = 3 / this.size;

	    this.object.scale.set(this.scale, this.scale, this.scale);

	    const controlsScale = this.size === 2 ? 0.825 : 1;
	    this.game.controls.edges.scale.set(
	      controlsScale,
	      controlsScale,
	      controlsScale
	    );

	    this.generatePositions();
	    this.generateModel();

	    this.pieces.forEach((piece) => {
	      this.cubes.push(piece.userData.cube);
	      this.object.add(piece);
	    });

	    this.holder.traverse((node) => {
	      if (node.frustumCulled) node.frustumCulled = false;
	    });

	    this.updateColors(this.game.themes.getColors());

	    this.sizeGenerated = this.size;
	  }

	  resize(force = false) {
	    if (this.size !== this.sizeGenerated || force) {
	      this.size = this.game.preferences.ranges.size.value;

	      this.reset();
	      this.init();

	      this.game.saved = false;
	      this.game.storage.clearGame();
	    }
	  }

	  reset() {
	    this.game.controls.edges.rotation.set(0, 0, 0);

	    this.holder.rotation.set(0, 0, 0);
	    this.object.rotation.set(0, 0, 0);
	    this.animator.rotation.set(0, 0, 0);
	  }

	  generatePositions() {
	    const m = this.size - 1;
	    const first =
	      this.size % 2 !== 0 ? 0 - Math.floor(this.size / 2) : 0.5 - this.size / 2;

	    let x, y, z;

	    this.positions = [];

	    for (x = 0; x < this.size; x++) {
	      for (y = 0; y < this.size; y++) {
	        for (z = 0; z < this.size; z++) {
	          let position = new THREE.Vector3(first + x, first + y, first + z);
	          let edges = [];

	          if (x == 0) edges.push(0);
	          if (x == m) edges.push(1);
	          if (y == 0) edges.push(2);
	          if (y == m) edges.push(3);
	          if (z == 0) edges.push(4);
	          if (z == m) edges.push(5);

	          position.edges = edges;
	          this.positions.push(position);
	        }
	      }
	    }
	  }

	  generateModel() {
	    this.pieces = [];
	    this.edges = [];

	    const pieceSize = 1 / 3;

	    const mainMaterial = new THREE.MeshLambertMaterial();

	    const pieceMesh = new THREE.Mesh(
	      new RoundedBoxGeometry(pieceSize, this.geometry.pieceCornerRadius, 3),
	      mainMaterial.clone()
	    );

	    const edgeGeometry = RoundedPlaneGeometry(
	      pieceSize,
	      this.geometry.edgeCornerRoundness,
	      this.geometry.edgeDepth
	    );

	    this.positions.forEach((position, index) => {
	      const piece = new THREE.Object3D();
	      const pieceCube = pieceMesh.clone();
	      const pieceEdges = [];

	      piece.position.copy(position.clone().divideScalar(3));
	      piece.add(pieceCube);
	      piece.name = index;
	      piece.edgesName = "";

	      position.edges.forEach((position) => {
	        const edge = new THREE.Mesh(edgeGeometry, mainMaterial.clone());
	        const name = ["L", "R", "D", "U", "B", "F"][position];
	        const distance = pieceSize / 2;

	        edge.position.set(
	          distance * [-1, 1, 0, 0, 0, 0][position],
	          distance * [0, 0, -1, 1, 0, 0][position],
	          distance * [0, 0, 0, 0, -1, 1][position]
	        );

	        edge.rotation.set(
	          (Math.PI / 2) * [0, 0, 1, -1, 0, 0][position],
	          (Math.PI / 2) * [-1, 1, 0, 0, 2, 0][position],
	          0
	        );

	        edge.scale.set(
	          this.geometry.edgeScale,
	          this.geometry.edgeScale,
	          this.geometry.edgeScale
	        );

	        edge.name = name;

	        piece.add(edge);
	        pieceEdges.push(name);
	        this.edges.push(edge);
	      });

	      piece.userData.edges = pieceEdges;
	      piece.userData.cube = pieceCube;

	      piece.userData.start = {
	        position: piece.position.clone(),
	        rotation: piece.rotation.clone(),
	      };

	      this.pieces.push(piece);
	    });
	  }

	  updateColors(colors) {
	    if (typeof this.pieces !== "object" && typeof this.edges !== "object")
	      return;

	    this.pieces.forEach((piece) =>
	      piece.userData.cube.material.color.setHex(colors.P)
	    );
	    this.edges.forEach((edge) => edge.material.color.setHex(colors[edge.name]));
	  }

	  loadFromData(data) {
	    this.size = data.size;

	    this.reset();
	    this.init();

	    this.pieces.forEach((piece) => {
	      const index = data.names.indexOf(piece.name);

	      const position = data.positions[index];
	      const rotation = data.rotations[index];

	      piece.position.set(position.x, position.y, position.z);
	      piece.rotation.set(rotation.x, rotation.y, rotation.z);
	    });
	  }
	};

	const Easing = {

	  Power: {

	    In: power => {

	      power = Math.round( power || 1 );

	      return t => Math.pow( t, power );

	    },

	    Out: power => {

	      power = Math.round( power || 1 );

	      return t => 1 - Math.abs( Math.pow( t - 1, power ) );

	    },

	    InOut: power => {

	      power = Math.round( power || 1 );

	      return t => ( t < 0.5 )
	        ? Math.pow( t * 2, power ) / 2
	        : ( 1 - Math.abs( Math.pow( ( t * 2 - 1 ) - 1, power ) ) ) / 2 + 0.5;

	    },

	  },

	  Sine: {

	    In: () => t => 1 + Math.sin( Math.PI / 2 * t - Math.PI / 2 ),

	    Out: () => t => Math.sin( Math.PI / 2 * t ),

	    InOut: () => t => ( 1 + Math.sin( Math.PI * t - Math.PI / 2 ) ) / 2,

	  },

	  Back: {

	    Out: s => {

	      s = s || 1.70158;

	      return t => { return ( t -= 1 ) * t * ( ( s + 1 ) * t + s ) + 1; };

	    },

	    In: s => {

	      s = s || 1.70158;

	      return t => { return t * t * ( ( s + 1 ) * t - s ); };

	    }

	  },

	  Elastic: {

	    Out: ( amplitude, period ) => {

	      let PI2 = Math.PI * 2;

	      let p1 = ( amplitude >= 1 ) ? amplitude : 1;
	      let p2 = ( period || 0.3 ) / ( amplitude < 1 ? amplitude : 1 );
	      let p3 = p2 / PI2 * ( Math.asin( 1 / p1 ) || 0 );

	      p2 = PI2 / p2;

	      return t => { return p1 * Math.pow( 2, -10 * t ) * Math.sin( ( t - p3 ) * p2 ) + 1 }

	    },

	  },

	};

	class Tween extends Animation {

	  constructor( options ) {

	    super( false );

	    this.duration = options.duration || 500;
	    this.easing = options.easing || ( t => t );
	    this.onUpdate = options.onUpdate || ( () => {} );
	    this.onComplete = options.onComplete || ( () => {} );

	    this.delay = options.delay || false;
	    this.yoyo = options.yoyo ? false : null;

	    this.progress = 0;
	    this.value = 0;
	    this.delta = 0;

	    this.getFromTo( options );

	    if ( this.delay ) setTimeout( () => super.start(), this.delay );
	    else super.start();

	    this.onUpdate( this );

	  }

	  update( delta ) {

	    const old = this.value * 1;
	    const direction = ( this.yoyo === true ) ? -1 : 1;

	    this.progress += ( delta / this.duration ) * direction;

	    this.value = this.easing( this.progress );
	    this.delta = this.value - old;

	    if ( this.values !== null ) this.updateFromTo();

	    if ( this.yoyo !== null ) this.updateYoyo();
	    else if ( this.progress <= 1 ) this.onUpdate( this );
	    else {

	      this.progress = 1;
	      this.value = 1;
	      this.onUpdate( this );
	      this.onComplete( this );
	      super.stop();      

	    }

	  }

	  updateYoyo() {

	    if ( this.progress > 1 || this.progress < 0 ) {

	      this.value = this.progress = ( this.progress > 1 ) ? 1 : 0;
	      this.yoyo = ! this.yoyo;

	    }

	    this.onUpdate( this );

	  }

	  updateFromTo() {

	    this.values.forEach( key => {

	      this.target[ key ] = this.from[ key ] + ( this.to[ key ] - this.from[ key ] ) * this.value;

	    } );

	  }

	  getFromTo( options ) {

	    if ( ! options.target || ! options.to ) {

	      this.values = null;
	      return;

	    }

	    this.target = options.target || null;
	    this.from = options.from || {};
	    this.to = options.to || null;
	    this.values = [];

	    if ( Object.keys( this.from ).length < 1 )
	      Object.keys( this.to ).forEach( key => { this.from[ key ] = this.target[ key ]; } );

	    Object.keys( this.to ).forEach( key => { this.values.push( key ); } );

	  }

	}

	window.addEventListener("touchmove", () => {});
	document.addEventListener(
	  "touchmove",
	  (event) => {
	    event.preventDefault();
	  },
	  { passive: false }
	);

	class Draggable {
	  constructor(element, options) {
	    this.position = {
	      current: new THREE.Vector2(),
	      start: new THREE.Vector2(),
	      delta: new THREE.Vector2(),
	      old: new THREE.Vector2(),
	      drag: new THREE.Vector2(),
	    };

	    this.options = Object.assign(
	      {
	        calcDelta: false,
	      },
	      options || {}
	    );

	    this.element = element;
	    this.touch = null;

	    this.drag = {
	      start: (event) => {
	        if (event.type == "mousedown" && event.which != 1) return;
	        if (event.type == "touchstart" && event.touches.length > 1) return;

	        this.getPositionCurrent(event);

	        if (this.options.calcDelta) {
	          this.position.start = this.position.current.clone();
	          this.position.delta.set(0, 0);
	          this.position.drag.set(0, 0);
	        }

	        this.touch = event.type == "touchstart";

	        this.onDragStart(this.position);

	        window.addEventListener(
	          this.touch ? "touchmove" : "mousemove",
	          this.drag.move,
	          false
	        );
	        window.addEventListener(
	          this.touch ? "touchend" : "mouseup",
	          this.drag.end,
	          false
	        );
	      },

	      move: (event) => {
	        if (this.options.calcDelta) {
	          this.position.old = this.position.current.clone();
	        }

	        this.getPositionCurrent(event);

	        if (this.options.calcDelta) {
	          this.position.delta = this.position.current
	            .clone()
	            .sub(this.position.old);
	          this.position.drag = this.position.current
	            .clone()
	            .sub(this.position.start);
	        }

	        this.onDragMove(this.position);
	      },

	      end: (event) => {
	        this.getPositionCurrent(event);

	        this.onDragEnd(this.position);

	        window.removeEventListener(
	          this.touch ? "touchmove" : "mousemove",
	          this.drag.move,
	          false
	        );
	        window.removeEventListener(
	          this.touch ? "touchend" : "mouseup",
	          this.drag.end,
	          false
	        );
	      },
	    };

	    this.onDragStart = () => {};
	    this.onDragMove = () => {};
	    this.onDragEnd = () => {};

	    this.enable();

	    return this;
	  }

	  enable() {
	    this.element.addEventListener("touchstart", this.drag.start, false);
	    this.element.addEventListener("mousedown", this.drag.start, false);

	    return this;
	  }

	  disable() {
	    this.element.removeEventListener("touchstart", this.drag.start, false);
	    this.element.removeEventListener("mousedown", this.drag.start, false);

	    return this;
	  }

	  getPositionCurrent(event) {
	    const dragEvent = event.touches
	      ? event.touches[0] || event.changedTouches[0]
	      : event;

	    this.position.current.set(dragEvent.pageX, dragEvent.pageY);
	  }

	  convertPosition(position) {
	    position.x = (position.x / this.element.offsetWidth) * 2 - 1;
	    position.y = -((position.y / this.element.offsetHeight) * 2 - 1);

	    return position;
	  }
	}

	const STILL = 0;
	const PREPARING = 1;
	const ROTATING = 2;
	const ANIMATING = 3;

	class Controls {
	  constructor(game) {
	    this.game = game;

	    this.flipConfig = 0;

	    this.flipEasings = [
	      Easing.Power.Out(3),
	      Easing.Sine.Out(),
	      Easing.Back.Out(1.5),
	    ];
	    this.flipSpeeds = [125, 200, 300];

	    this.raycaster = new THREE.Raycaster();

	    const helperMaterial = new THREE.MeshBasicMaterial({
	      depthWrite: false,
	      transparent: true,
	      opacity: 0,
	      color: 0x0033ff,
	    });

	    this.group = new THREE.Object3D();
	    this.group.name = "controls";
	    this.game.cube.object.add(this.group);

	    this.helper = new THREE.Mesh(
	      new THREE.PlaneBufferGeometry(200, 200),
	      helperMaterial.clone()
	    );

	    this.helper.rotation.set(0, Math.PI / 4, 0);
	    this.game.world.scene.add(this.helper);

	    this.edges = new THREE.Mesh(
	      new THREE.BoxBufferGeometry(1, 1, 1),
	      helperMaterial.clone()
	    );

	    this.game.world.scene.add(this.edges);

	    this.onSolved = () => {};
	    this.onMove = () => {};

	    this.momentum = [];

	    this.scramble = null;
	    this.state = STILL;
	    this.enabled = false;

	    this.initDraggable();
	  }

	  enable() {
	    this.draggable.enable();
	    this.enabled = true;
	  }

	  disable() {
	    this.draggable.disable();
	    this.enabled = false;
	  }

	  initDraggable() {
	    this.draggable = new Draggable(this.game.dom.game);

	    this.draggable.onDragStart = (position) => {
	      if (this.scramble !== null) return;
	      if (this.state === PREPARING || this.state === ROTATING) return;

	      this.gettingDrag = this.state === ANIMATING;

	      const edgeIntersect = this.getIntersect(
	        position.current,
	        this.edges,
	        false
	      );

	      if (edgeIntersect !== false) {
	        this.dragIntersect = this.getIntersect(
	          position.current,
	          this.game.cube.cubes,
	          true
	        );
	      }

	      // if (edgeIntersect !== false && this.dragIntersect !== false) {
	      //   this.dragNormal = edgeIntersect.face.normal.round();
	      //   this.flipType = "layer";

	      //   this.attach(this.helper, this.edges);

	      //   this.helper.rotation.set(0, 0, 0);
	      //   this.helper.position.set(0, 0, 0);
	      //   this.helper.lookAt(this.dragNormal);
	      //   this.helper.translateZ(0.5);
	      //   this.helper.updateMatrixWorld();

	      //   this.detach(this.helper, this.edges);
	      // } else {
	        this.dragNormal = new THREE.Vector3(0, 0, 1);
	        // this.flipType = "none"; // was 'cube'
	        this.flipType = "cube";

	        this.helper.position.set(0, 0, 0);
	        this.helper.rotation.set(0, Math.PI / 4, 0);
	        this.helper.updateMatrixWorld();
	      // }

	      let planeIntersect = this.getIntersect(
	        position.current,
	        this.helper,
	        // this.helper, 
	        false
	      );
	      if (planeIntersect === false) return;

	      this.dragCurrent = this.helper.worldToLocal(planeIntersect.point);
	      this.dragTotal = new THREE.Vector3();
	      this.state = this.state === STILL ? PREPARING : this.state;
	    };

	    this.draggable.onDragMove = (position) => {
	      // if (this.flipType === "none") return;
	      if (this.scramble !== null) return;
	      if (
	        this.state === STILL ||
	        (this.state === ANIMATING && this.gettingDrag === false)
	      )
	        return;

	      const planeIntersect = this.getIntersect(
	        position.current,
	        this.helper,
	        false
	      );
	      if (planeIntersect === false) return;

	      const point = this.helper.worldToLocal(planeIntersect.point.clone());

	      this.dragDelta = point.clone().sub(this.dragCurrent).setZ(0);
	      this.dragTotal.add(this.dragDelta);
	      this.dragCurrent = point;
	      this.addMomentumPoint(this.dragDelta);

	      if (this.state === PREPARING && this.dragTotal.length() > 0.05) {
	        this.dragDirection = this.getMainAxis(this.dragTotal);

	        if (this.flipType === "layer") {
	          const direction = new THREE.Vector3();
	          direction[this.dragDirection] = 1;

	          const worldDirection = this.helper
	            .localToWorld(direction)
	            .sub(this.helper.position);
	          const objectDirection = this.edges
	            .worldToLocal(worldDirection)
	            .round();

	          this.flipAxis = objectDirection.cross(this.dragNormal).negate();

	          this.selectLayer(this.getLayer(false));
	        } else {
	          const axis =
	            this.dragDirection != "x"
	              ? this.dragDirection == "y" &&
	                position.current.x > this.game.world.width / 2
	                ? "z"
	                : "x"
	              : "y";

	          this.flipAxis = new THREE.Vector3();
	          this.flipAxis[axis] = 1 * (axis == "x" ? -1 : 1);
	        }

	        this.flipAngle = 0;
	        this.state = ROTATING;
	      } else if (this.state === ROTATING) {
	        const rotation = this.dragDelta[this.dragDirection];

	        if (this.flipType === "layer") {
	          this.group.rotateOnAxis(this.flipAxis, rotation);
	          this.flipAngle += rotation;
	        } else {
	          this.edges.rotateOnWorldAxis(this.flipAxis, rotation);
	          this.game.cube.object.rotation.copy(this.edges.rotation);
	          this.flipAngle += rotation;
	        }
	      }
	    };

	    this.draggable.onDragEnd = (position) => {
	      // if (this.flipType === "none") return;
	      if (this.scramble !== null) return;
	      if (this.state !== ROTATING) {
	        this.gettingDrag = false;
	        this.state = STILL;
	        return;
	      }

	      this.state = ANIMATING;

	      const momentum = this.getMomentum()[this.dragDirection];
	      const flip =
	        Math.abs(momentum) > 0.05 && Math.abs(this.flipAngle) < Math.PI / 2;

	      const angle = flip
	        ? this.roundAngle(
	            this.flipAngle + Math.sign(this.flipAngle) * (Math.PI / 4)
	          )
	        : this.roundAngle(this.flipAngle);

	      const delta = angle - this.flipAngle;

	      if (this.flipType === "layer") {
	        this.rotateLayer(delta, false, (layer) => {
	          this.game.storage.saveGame();

	          this.state = this.gettingDrag ? PREPARING : STILL;
	          this.gettingDrag = false;

	          this.checkIsSolved();
	        });
	      } else {
	        this.rotateCube(delta, () => {
	          this.state = this.gettingDrag ? PREPARING : STILL;
	          this.gettingDrag = false;
	        });
	      }
	    };
	  }

	  rotateLayer(rotation, scramble, callback) {
	    const config = scramble ? 0 : this.flipConfig;

	    const easing = this.flipEasings[config];
	    const duration = this.flipSpeeds[config];
	    const bounce = config == 2 ? this.bounceCube() : () => {};

	    this.rotationTween = new Tween({
	      easing: easing,
	      duration: duration,
	      onUpdate: (tween) => {
	        let deltaAngle = tween.delta * rotation;
	        this.group.rotateOnAxis(this.flipAxis, deltaAngle);
	        bounce(tween.value, deltaAngle, rotation);
	      },
	      onComplete: () => {
	        if (!scramble) this.onMove();

	        const layer = this.flipLayer.slice(0);

	        this.game.cube.object.rotation.setFromVector3(
	          this.snapRotation(this.game.cube.object.rotation.toVector3())
	        );
	        this.group.rotation.setFromVector3(
	          this.snapRotation(this.group.rotation.toVector3())
	        );
	        this.deselectLayer(this.flipLayer);

	        callback(layer);
	      },
	    });
	  }

	  bounceCube() {
	    let fixDelta = true;

	    return (progress, delta, rotation) => {
	      if (progress >= 1) {
	        if (fixDelta) {
	          delta = (progress - 1) * rotation;
	          fixDelta = false;
	        }

	        this.game.cube.object.rotateOnAxis(this.flipAxis, delta);
	      }
	    };
	  }

	  rotateCube(rotation, callback) {
	    const config = this.flipConfig;
	    const easing = [Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2)][
	      config
	    ];
	    const duration = [100, 150, 350][config];

	    this.rotationTween = new Tween({
	      easing: easing,
	      duration: duration,
	      onUpdate: (tween) => {
	        this.edges.rotateOnWorldAxis(this.flipAxis, tween.delta * rotation);
	        this.game.cube.object.rotation.copy(this.edges.rotation);
	      },
	      onComplete: () => {
	        this.edges.rotation.setFromVector3(
	          this.snapRotation(this.edges.rotation.toVector3())
	        );
	        this.game.cube.object.rotation.copy(this.edges.rotation);
	        callback();
	      },
	    });
	  }

	  selectLayer(layer) {
	    this.group.rotation.set(0, 0, 0);
	    this.movePieces(layer, this.game.cube.object, this.group);
	    this.flipLayer = layer;
	  }

	  deselectLayer(layer) {
	    this.movePieces(layer, this.group, this.game.cube.object);
	    this.flipLayer = null;
	  }

	  movePieces(layer, from, to) {
	    from.updateMatrixWorld();
	    to.updateMatrixWorld();

	    layer.forEach((index) => {
	      const piece = this.game.cube.pieces[index];

	      piece.applyMatrix(from.matrixWorld);
	      from.remove(piece);
	      piece.applyMatrix(new THREE.Matrix4().getInverse(to.matrixWorld));
	      to.add(piece);
	    });
	  }

	  getLayer(position) {
	    const scalar = { 2: 6, 3: 3, 4: 4, 5: 3 }[this.game.cube.size];
	    const layer = [];

	    let axis;

	    if (position === false) {
	      const piece = this.dragIntersect.object.parent;

	      axis = this.getMainAxis(this.flipAxis);
	      position = piece.position.clone().multiplyScalar(scalar).round();
	    } else {
	      axis = this.getMainAxis(position);
	    }

	    this.game.cube.pieces.forEach((piece) => {
	      const piecePosition = piece.position
	        .clone()
	        .multiplyScalar(scalar)
	        .round();

	      if (piecePosition[axis] == position[axis]) layer.push(piece.name);
	    });

	    return layer;
	  }

	  keyboardMove(type, move, callback) {
	    if (this.state !== STILL) return;
	    if (this.enabled !== true) return;

	    if (type === "LAYER") {
	      const layer = this.getLayer(move.position);

	      this.flipAxis = new THREE.Vector3();
	      this.flipAxis[move.axis] = 1;
	      this.state = ROTATING;

	      this.selectLayer(layer);
	      this.rotateLayer(move.angle, false, (layer) => {
	        this.game.storage.saveGame();
	        this.state = STILL;
	        this.checkIsSolved();
	      });
	    } else if (type === "CUBE") {
	      this.flipAxis = new THREE.Vector3();
	      this.flipAxis[move.axis] = 1;
	      this.state = ROTATING;

	      this.rotateCube(move.angle, () => {
	        this.state = STILL;
	      });
	    }
	  }

	  scrambleCube(onComplete) {
	    if (this.scramble == null) {
	      this.scramble = this.game.scrambler;
	      this.onScrambleComplete = onComplete || (() => {});
	    }

	    const converted = this.scramble.converted;
	    const move = converted[0];
	    const layer = this.getLayer(move.position);
	    this.flipAxis = new THREE.Vector3();
	    this.flipAxis[move.axis] = 1;

	    this.selectLayer(layer);
	    this.rotateLayer(move.angle, true, () => {
	      converted.shift();
	      if (converted.length > 0) {
	        this.scrambleCube(this.onScrambleComplete);
	      } else {
	        this.scramble = null;
	        this.onScrambleComplete();
	      }
	    });
	  }

	  getIntersect(position, object, multiple) {
	    this.raycaster.setFromCamera(
	      this.draggable.convertPosition(position.clone()),
	      this.game.world.camera
	    );

	    const intersect = multiple
	      ? this.raycaster.intersectObjects(object)
	      : this.raycaster.intersectObject(object);

	    return intersect.length > 0 ? intersect[0] : false;
	  }

	  getMainAxis(vector) {
	    return Object.keys(vector).reduce((a, b) =>
	      Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b
	    );
	  }

	  detach(child, parent) {
	    child.applyMatrix(parent.matrixWorld);
	    parent.remove(child);
	    this.game.world.scene.add(child);
	  }

	  attach(child, parent) {
	    child.applyMatrix(new THREE.Matrix4().getInverse(parent.matrixWorld));
	    this.game.world.scene.remove(child);
	    parent.add(child);
	  }

	  addMomentumPoint(delta) {
	    const time = Date.now();

	    this.momentum = this.momentum.filter((moment) => time - moment.time < 500);

	    if (delta !== false) this.momentum.push({ delta, time });
	  }

	  getMomentum() {
	    const points = this.momentum.length;
	    const momentum = new THREE.Vector2();

	    this.addMomentumPoint(false);

	    this.momentum.forEach((point, index) => {
	      momentum.add(point.delta.multiplyScalar(index / points));
	    });

	    return momentum;
	  }

	  roundAngle(angle) {
	    const round = Math.PI / 2;
	    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round;
	  }

	  snapRotation(angle) {
	    return angle.set(
	      this.roundAngle(angle.x),
	      this.roundAngle(angle.y),
	      this.roundAngle(angle.z)
	    );
	  }

	  checkIsSolved() {
	    performance.now();

	    let solved = true;
	    const sides = {
	      "x-": [],
	      "x+": [],
	      "y-": [],
	      "y+": [],
	      "z-": [],
	      "z+": [],
	    };

	    this.game.cube.edges.forEach((edge) => {
	      const position = edge.parent
	        .localToWorld(edge.position.clone())
	        .sub(this.game.cube.object.position);

	      const mainAxis = this.getMainAxis(position);
	      const mainSign =
	        position.multiplyScalar(2).round()[mainAxis] < 1 ? "-" : "+";

	      sides[mainAxis + mainSign].push(edge.name);
	    });

	    Object.keys(sides).forEach((side) => {
	      if (!sides[side].every((value) => value === sides[side][0]))
	        solved = false;
	    });

	    if (solved) this.onSolved();
	  }
	}

	class Scrambler {
	  constructor(game) {
	    this.game = game;

	    this.dificulty = 0;

	    this.scrambleLength = {
	      2: [7, 9, 11],
	      3: [20, 25, 30],
	      4: [30, 40, 50],
	      5: [40, 60, 80],
	    };

	    this.moves = [];
	    this.conveted = [];
	    this.pring = "";
	  }

	  scramble(scramble) {
	    this.moves = typeof scramble !== "undefined" ? scramble.split(" ") : [];

	    this.callback = () => {};
	    this.convert();
	    this.print = this.moves.join(" ");

	    return this;
	  }

	  convert() {
	    this.converted = [];

	    this.moves.forEach((move) => {
	      const convertedMove = this.convertMove(move);
	      const modifier = move.charAt(1);

	      this.converted.push(convertedMove);
	      if (modifier == "2") this.converted.push(convertedMove);
	    });
	  }

	  convertMove(move) {
	    const face = move.charAt(0);
	    const modifier = move.charAt(1);

	    const axis = { D: "y", U: "y", L: "x", R: "x", F: "z", B: "z" }[
	      face.toUpperCase()
	    ];
	    let row = { D: -1, U: 1, L: -1, R: 1, F: 1, B: -1 }[face.toUpperCase()];

	    if (this.game.cube.size > 3 && face !== face.toLowerCase()) row = row * 2;

	    const position = new THREE.Vector3();
	    position[
	      { D: "y", U: "y", L: "x", R: "x", F: "z", B: "z" }[face.toUpperCase()]
	    ] = row;

	    const angle = (Math.PI / 2) * -row * (modifier == "'" ? -1 : 1);

	    return { position, axis, angle, name: move };
	  }
	}

	class Transition {
	  constructor(game) {
	    this.game = game;

	    this.tweens = {};
	    this.durations = {};
	    this.data = {
	      cubeY: -0.2,
	      cameraZoom: 0.85,
	    };

	    this.activeTransitions = 0;
	  }

	  init() {
	    this.game.controls.disable();

	    this.game.cube.object.position.y = this.data.cubeY;
	    this.game.cube.animator.position.y = 4;
	    this.game.cube.animator.rotation.x = -Math.PI / 3;
	    this.game.world.camera.zoom = this.data.cameraZoom;
	    this.game.world.camera.updateProjectionMatrix();

	    this.tweens.buttons = {};
	    this.tweens.title = [];
	    this.tweens.best = [];
	    this.tweens.complete = [];
	    this.tweens.prefs = [];
	    this.tweens.theme = [];
	  }

	  buttons(show, hide) {
	    const buttonTween = (button, show) => {
	      return new Tween({
	        target: button.style,
	        duration: 300,
	        easing: show ? Easing.Power.Out(2) : Easing.Power.In(3),
	        from: { opacity: show ? 0 : 1 },
	        to: { opacity: show ? 1 : 0 },
	        onUpdate: (tween) => {
	          const translate = show ? 1 - tween.value : tween.value;
	          button.style.transform = `translate3d(0, ${translate * 1.5}em, 0)`;
	        },
	        onComplete: () => (button.style.pointerEvents = show ? "all" : "none"),
	      });
	    };

	    hide.forEach(
	      (button) =>
	        (this.tweens.buttons[button] = buttonTween(
	          this.game.dom.buttons[button],
	          false
	        ))
	    );

	    setTimeout(
	      () =>
	        show.forEach((button) => {
	          this.tweens.buttons[button] = buttonTween(
	            this.game.dom.buttons[button],
	            true
	          );
	        }),
	      hide ? 500 : 0
	    );
	  }

	  cube(show, theming = false) {
	    this.activeTransitions++;

	    try {
	      this.tweens.cube.stop();
	    } catch (e) {}

	    const currentY = this.game.cube.animator.position.y;
	    const currentRotation = this.game.cube.animator.rotation.x;

	    this.tweens.cube = new Tween({
	      duration: show ? 3000 : 1250,
	      easing: show ? Easing.Elastic.Out(0.8, 0.6) : Easing.Back.In(1),
	      onUpdate: (tween) => {
	        this.game.cube.animator.position.y = show
	          ? theming
	            ? 0.9 + (1 - tween.value) * 3.5
	            : (1 - tween.value) * 4
	          : currentY + tween.value * 4;

	        this.game.cube.animator.rotation.x = show
	          ? ((1 - tween.value) * Math.PI) / 3
	          : currentRotation + (tween.value * -Math.PI) / 3;
	      },
	    });

	    if (theming) {
	      if (show) {
	        this.game.world.camera.zoom = 0.75;
	        this.game.world.camera.updateProjectionMatrix();
	      } else {
	        setTimeout(() => {
	          this.game.world.camera.zoom = this.data.cameraZoom;
	          this.game.world.camera.updateProjectionMatrix();
	        }, 1500);
	      }
	    }

	    this.durations.cube = show ? 1500 : 1500;

	    setTimeout(() => this.activeTransitions--, this.durations.cube);
	  }

	  float() {
	    try {
	      this.tweens.float.stop();
	    } catch (e) {}

	    this.tweens.float = new Tween({
	      duration: 1500,
	      easing: Easing.Sine.InOut(),
	      yoyo: true,
	      onUpdate: (tween) => {
	        this.game.cube.holder.position.y = -0.02 + tween.value * 0.04;
	        this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
	        this.game.cube.holder.rotation.z = -this.game.cube.holder.rotation.x;
	        this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;

	        this.game.controls.edges.position.y =
	          this.game.cube.holder.position.y + this.game.cube.object.position.y;
	      },
	    });
	  }

	  zoom(play, time) {
	    this.activeTransitions++;

	    const zoom = play ? 1 : this.data.cameraZoom;
	    const duration = time > 0 ? Math.max(time, 1500) : 1500;
	    const rotations = time > 0 ? Math.round(duration / 1500) : 1;
	    const easing = Easing.Power.InOut(time > 0 ? 2 : 3);

	    this.tweens.zoom = new Tween({
	      target: this.game.world.camera,
	      duration: duration,
	      easing: easing,
	      to: { zoom: zoom },
	      onUpdate: () => {
	        this.game.world.camera.updateProjectionMatrix();
	      },
	    });

	    this.tweens.rotate = new Tween({
	      target: this.game.cube.animator.rotation,
	      duration: duration,
	      easing: easing,
	      to: { y: -Math.PI * 2 * rotations },
	      onComplete: () => {
	        this.game.cube.animator.rotation.y = 0;
	      },
	    });

	    this.durations.zoom = duration;

	    setTimeout(() => this.activeTransitions--, this.durations.zoom);
	  }

	  elevate(complete) {
	    this.activeTransitions++;

	    (this.tweens.elevate = new Tween({
	      target: this.game.cube.object.position,
	      duration: complete ? 1500 : 0,
	      easing: Easing.Power.InOut(3),
	      to: { y: complete ? -0.05 : this.data.cubeY },
	    }));

	    this.durations.elevate = 1500;

	    setTimeout(() => this.activeTransitions--, this.durations.elevate);
	  }

	  complete(show, best) {
	    this.activeTransitions++;

	    const text = best ? this.game.dom.texts.best : this.game.dom.texts.complete;

	    if (text.querySelector("span i") === null)
	      text.querySelectorAll("span").forEach((span) => this.splitLetters(span));

	    const letters = text.querySelectorAll(".icon, i");

	    this.flipLetters(best ? "best" : "complete", letters, show);

	    text.style.opacity = 1;

	    const duration = this.durations[best ? "best" : "complete"];

	    setTimeout(() => this.activeTransitions--, duration);
	  }

	  preferences(show) {
	    this.ranges(this.game.dom.prefs.querySelectorAll(".range"), "prefs", show);
	  }

	  theming(show) {
	    this.ranges(this.game.dom.theme.querySelectorAll(".range"), "prefs", show);
	  }

	  ranges(ranges, type, show) {
	    this.activeTransitions++;

	    this.tweens[type].forEach((tween) => {
	      tween.stop();
	      tween = null;
	    });

	    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

	    let tweenId = -1;
	    let listMax = 0;

	    ranges.forEach((range, rangeIndex) => {
	      const label = range.querySelector(".range__label");
	      const track = range.querySelector(".range__track-line");
	      const handle = range.querySelector(".range__handle");
	      const list = range.querySelectorAll(".range__list div");

	      const delay = rangeIndex * (show ? 120 : 100);

	      label.style.opacity = show ? 0 : 1;
	      track.style.opacity = show ? 0 : 1;
	      handle.style.opacity = show ? 0 : 1;
	      handle.style.pointerEvents = show ? "all" : "none";

	      this.tweens[type][tweenId++] = new Tween({
	        delay: show ? delay : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: (tween) => {
	          const translate = show ? 1 - tween.value : tween.value;
	          const opacity = show ? tween.value : 1 - tween.value;

	          label.style.transform = `translate3d(0, ${translate}em, 0)`;
	          label.style.opacity = opacity;
	        },
	      });

	      this.tweens[type][tweenId++] = new Tween({
	        delay: show ? delay + 100 : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: (tween) => {
	          const translate = show ? 1 - tween.value : tween.value;
	          const scale = show ? tween.value : 1 - tween.value;
	          const opacity = scale;

	          track.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, 1, 1)`;
	          track.style.opacity = opacity;
	        },
	      });

	      this.tweens[type][tweenId++] = new Tween({
	        delay: show ? delay + 100 : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: (tween) => {
	          const translate = show ? 1 - tween.value : tween.value;
	          const opacity = 1 - translate;
	          const scale = 0.5 + opacity * 0.5;

	          handle.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, ${scale}, ${scale})`;
	          handle.style.opacity = opacity;
	        },
	      });

	      list.forEach((listItem, labelIndex) => {
	        listItem.style.opacity = show ? 0 : 1;

	        this.tweens[type][tweenId++] = new Tween({
	          delay: show ? delay + 200 + labelIndex * 50 : delay,
	          duration: 400,
	          easing: easing,
	          onUpdate: (tween) => {
	            const translate = show ? 1 - tween.value : tween.value;
	            const opacity = show ? tween.value : 1 - tween.value;

	            listItem.style.transform = `translate3d(0, ${translate}em, 0)`;
	            listItem.style.opacity = opacity;
	          },
	        });
	      });

	      listMax = list.length > listMax ? list.length - 1 : listMax;

	      range.style.opacity = 1;
	    });

	    this.durations[type] = show
	      ? (ranges.length - 1) * 100 + 200 + listMax * 50 + 400
	      : (ranges.length - 1) * 100 + 400;

	    setTimeout(() => this.activeTransitions--, this.durations[type]);
	  }

	  title(show) {
	    this.activeTransitions++;

	    const title = this.game.dom.texts.title;

	    if (title.querySelector("span i") === null)
	      title.querySelectorAll("span").forEach((span) => this.splitLetters(span));

	    const letters = title.querySelectorAll("i");

	    this.flipLetters("title", letters, show);

	    title.style.opacity = 1;

	    const note = this.game.dom.texts.note;

	    this.tweens.title[letters.length] = new Tween({
	      target: note.style,
	      easing: Easing.Sine.InOut(),
	      duration: show ? 800 : 400,
	      yoyo: show ? true : null,
	      from: { opacity: show ? 0 : parseFloat(getComputedStyle(note).opacity) },
	      to: { opacity: show ? 1 : 0 },
	    });

	    setTimeout(() => this.activeTransitions--, this.durations.title);
	  }

	  splitLetters(element) {
	    const text = element.innerHTML;

	    element.innerHTML = "";

	    text.split("").forEach((letter) => {
	      const i = document.createElement("i");

	      i.innerHTML = letter;

	      element.appendChild(i);
	    });
	  }

	  flipLetters(type, letters, show) {
	    try {
	      this.tweens[type].forEach((tween) => tween.stop());
	    } catch (e) {}

	    letters.forEach((letter, index) => {
	      letter.style.opacity = show ? 0 : 1;

	      this.tweens[type][index] = new Tween({
	        easing: Easing.Sine.Out(),
	        duration: show ? 800 : 400,
	        delay: index * 50,
	        onUpdate: (tween) => {
	          const rotation = show ? (1 - tween.value) * -80 : tween.value * 80;

	          letter.style.transform = `rotate3d(0, 1, 0, ${rotation}deg)`;
	          letter.style.opacity = show ? tween.value : 1 - tween.value;
	        },
	      });
	    });

	    this.durations[type] = (letters.length - 1) * 50 + (show ? 800 : 400);
	  }
	}

	const RangeHTML = [

	  '<div class="range">',
	    '<div class="range__label"></div>',
	    '<div class="range__track">',
	      '<div class="range__track-line"></div>',
	      '<div class="range__handle"><div></div></div>',
	    '</div>',
	    '<div class="range__list"></div>',
	  '</div>',

	].join( '\n' );

	document.querySelectorAll( 'range' ).forEach( el => {

	  const temp = document.createElement( 'div' );
	  temp.innerHTML = RangeHTML;

	  const range = temp.querySelector( '.range' );
	  const rangeLabel = range.querySelector( '.range__label' );
	  const rangeList = range.querySelector( '.range__list' );

	  range.setAttribute( 'name', el.getAttribute( 'name' ) );
	  rangeLabel.innerHTML = el.getAttribute( 'title' );

	  if ( el.hasAttribute( 'color' ) ) {

	    range.classList.add( 'range--type-color' );
	    range.classList.add( 'range--color-' + el.getAttribute( 'name' ) );

	  }

	  if ( el.hasAttribute( 'list' ) ) {

	    el.getAttribute( 'list' ).split( ',' ).forEach( listItemText => {

	      const listItem = document.createElement( 'div' );
	      listItem.innerHTML = listItemText;
	      rangeList.appendChild( listItem );

	    } );

	  }

	  el.parentNode.replaceChild( range, el );

	} );

	class Range {

	  constructor( name, options ) {

	    options = Object.assign( {
	      range: [ 0, 1 ],
	      value: 0,
	      step: 0,
	      onUpdate: () => {},
	      onComplete: () => {},
	    }, options || {} );

	    this.element = document.querySelector( '.range[name="' + name + '"]' );
	    this.track = this.element.querySelector( '.range__track' );
	    this.handle = this.element.querySelector( '.range__handle' );
	    this.list = [].slice.call( this.element.querySelectorAll( '.range__list div' ) );

	    this.value = options.value;
	    this.min = options.range[0];
	    this.max = options.range[1];
	    this.step = options.step;

	    this.onUpdate = options.onUpdate;
	    this.onComplete = options.onComplete;

	    this.setValue( this.value );

	    this.initDraggable();

	  }

	  setValue( value ) {

	    this.value = this.round( this.limitValue( value ) );
	    this.setHandlePosition();

	  }

	  initDraggable() {

	    let current;

	    this.draggable = new Draggable( this.handle, { calcDelta: true } );

	    this.draggable.onDragStart = position => {

	      current = this.positionFromValue( this.value );
	      this.handle.style.left = current + 'px';

	    };

	    this.draggable.onDragMove = position => {

	      current = this.limitPosition( current + position.delta.x );
	      this.value = this.round( this.valueFromPosition( current ) );
	      this.setHandlePosition();
	      
	      this.onUpdate( this.value );

	    };

	    this.draggable.onDragEnd = position => {

	      this.onComplete( this.value );

	    };

	  }

	  round( value ) {

	    if ( this.step < 1 ) return value;

	    return Math.round( ( value - this.min ) / this.step ) * this.step + this.min;

	  }

	  limitValue( value ) {

	    const max = Math.max( this.max, this.min );
	    const min = Math.min( this.max, this.min );

	    return Math.min( Math.max( value, min ), max );

	  }

	  limitPosition( position ) {

	    return Math.min( Math.max( position, 0 ), this.track.offsetWidth );

	  }

	  percentsFromValue( value ) {

	    return ( value - this.min ) / ( this.max - this.min );

	  }

	  valueFromPosition( position ) {

	    return this.min + ( this.max - this.min ) * ( position / this.track.offsetWidth );

	  }

	  positionFromValue( value ) {

	    return this.percentsFromValue( value ) * this.track.offsetWidth;

	  }

	  setHandlePosition() {

	    this.handle.style.left = this.percentsFromValue( this.value ) * 100 + '%';

	  }

	}

	class Preferences {

	  constructor( game ) {

	    this.game = game;

	  }

	  init() {

	    this.ranges = {

	      size: new Range( 'size', {
	        value: this.game.cube.size,
	        range: [ 2, 5 ],
	        step: 1,
	        onUpdate: value => {

	          this.game.cube.size = value;

	          this.game.preferences.ranges.scramble.list.forEach( ( item, i ) => {

	            item.innerHTML = this.game.scrambler.scrambleLength[ this.game.cube.size ][ i ];

	          } );

	        },
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      flip: new Range( 'flip', {
	        value: this.game.controls.flipConfig,
	        range: [ 0, 2 ],
	        step: 1,
	        onUpdate: value => {

	          this.game.controls.flipConfig = value;

	        },
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      scramble: new Range( 'scramble', {
	        value: this.game.scrambler.dificulty,
	        range: [ 0, 2 ],
	        step: 1,
	        onUpdate: value => {

	          this.game.scrambler.dificulty = value;

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      fov: new Range( 'fov', {
	        value: this.game.world.fov,
	        range: [ 2, 45 ],
	        onUpdate: value => {

	          this.game.world.fov = value;
	          this.game.world.resize();

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      theme: new Range( 'theme', {
	        value: { cube: 0, erno: 1, dust: 2, camo: 3, rain: 4 }[ this.game.themes.theme ],
	        range: [ 0, 4 ],
	        step: 1,
	        onUpdate: value => {

	          const theme = [ 'cube', 'erno', 'dust', 'camo', 'rain' ][ value ];
	          this.game.themes.setTheme( theme );

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      hue: new Range( 'hue', {
	        value: 0,
	        range: [ 0, 360 ],
	        onUpdate: value => this.game.themeEditor.updateHSL(),
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      saturation: new Range( 'saturation', {
	        value: 100,
	        range: [ 0, 100 ],
	        onUpdate: value => this.game.themeEditor.updateHSL(),
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      lightness: new Range( 'lightness', {
	        value: 50,
	        range: [ 0, 100 ],
	        onUpdate: value => this.game.themeEditor.updateHSL(),
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	    };

	    this.ranges.scramble.list.forEach( ( item, i ) => {

	      item.innerHTML = this.game.scrambler.scrambleLength[ this.game.cube.size ][ i ];

	    } );
	    
	  }

	}

	class Confetti {

	  constructor( game ) {

	    this.game = game;
	    this.started = 0;

	    this.options = {
	      speed: { min: 0.0011, max: 0.0022 },
	      revolution: { min: 0.01, max: 0.05 },
	      size: { min: 0.1, max: 0.15 },
	      colors: [ 0x41aac8, 0x82ca38, 0xffef48, 0xef3923, 0xff8c0a ],
	    };

	    this.geometry = new THREE.PlaneGeometry( 1, 1 );
	    this.material = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide } );

	    this.holders = [
	      new ConfettiStage( this.game, this, 1, 20 ),
	      new ConfettiStage( this.game, this, -1, 30 ),
	    ];

	  }

	  start() {

	    if ( this.started > 0 ) return;

	    this.holders.forEach( holder => {

	      this.game.world.scene.add( holder.holder );
	      holder.start();
	      this.started ++;

	    } );

	  }

	  stop() {

	    if ( this.started == 0 ) return;

	    this.holders.forEach( holder => {

	      holder.stop( () => {

	        this.game.world.scene.remove( holder.holder );
	        this.started --;

	      } );

	    } );

	  }

	  updateColors( colors ) {

	    this.holders.forEach( holder => {

	      holder.options.colors.forEach( ( color, index ) => {

	        holder.options.colors[ index ] = colors[ [ 'D', 'F', 'R', 'B', 'L' ][ index ] ];

	      } );

	    } );

	  }

	}

	class ConfettiStage extends Animation {

	  constructor( game, parent, distance, count ) {

	    super( false );

	    this.game = game;
	    this.parent = parent;

	    this.distanceFromCube = distance;

	    this.count = count;
	    this.particles = [];

	    this.holder = new THREE.Object3D();
	    this.holder.rotation.copy( this.game.world.camera.rotation );

	    this.object = new THREE.Object3D();
	    this.holder.add( this.object );

	    this.resizeViewport = this.resizeViewport.bind( this );
	    this.game.world.onResize.push( this.resizeViewport );
	    this.resizeViewport();    

	    this.geometry = this.parent.geometry;
	    this.material = this.parent.material;

	    this.options = this.parent.options;

	    let i = this.count;
	    while ( i-- ) this.particles.push( new Particle( this ) );

	  }

	  start() {

	    this.time = performance.now();
	    this.playing = true;

	    let i = this.count;
	    while ( i-- ) this.particles[ i ].reset();

	    super.start();

	  }

	  stop( callback ) {

	    this.playing = false;
	    this.completed = 0;
	    this.callback = callback;

	  }

	  reset() {

	    super.stop();

	    this.callback();

	  }

	  update() {

	    const now = performance.now();
	    const delta = now - this.time;
	    this.time = now;

	    let i = this.count;

	    while ( i-- )
	      if ( ! this.particles[ i ].completed ) this.particles[ i ].update( delta );

	    if ( ! this.playing && this.completed == this.count ) this.reset();

	  }

	  resizeViewport() {

	    const fovRad = this.game.world.camera.fov * THREE.Math.DEG2RAD;

	    this.height = 2 * Math.tan( fovRad / 2 ) * ( this.game.world.camera.position.length() - this.distanceFromCube );
	    this.width = this.height * this.game.world.camera.aspect;

	    const scale = 1 / this.game.transition.data.cameraZoom;

	    this.width *= scale;
	    this.height *= scale;

	    this.object.position.z = this.distanceFromCube;
	    this.object.position.y = this.height / 2;

	  }
	  
	}

	class Particle {

	  constructor( confetti ) {

	    this.confetti = confetti;
	    this.options = this.confetti.options;

	    this.velocity = new THREE.Vector3();
	    this.force = new THREE.Vector3();

	    this.mesh = new THREE.Mesh( this.confetti.geometry, this.confetti.material.clone() );
	    this.confetti.object.add( this.mesh );

	    this.size = THREE.Math.randFloat( this.options.size.min, this.options.size.max );
	    this.mesh.scale.set( this.size, this.size, this.size );

	    return this;

	  }

	  reset( randomHeight = true ) {

	    this.completed = false;

	    this.color = new THREE.Color( this.options.colors[ Math.floor( Math.random() * this.options.colors.length ) ] );
	    this.mesh.material.color.set( this.color );

	    this.speed = THREE.Math.randFloat( this.options.speed.min, this.options.speed.max ) * -1;
	    this.mesh.position.x = THREE.Math.randFloat( - this.confetti.width / 2, this.confetti.width / 2 );
	    this.mesh.position.y = ( randomHeight )
	      ? THREE.Math.randFloat( this.size, this.confetti.height + this.size )
	      : this.size;

	    this.revolutionSpeed = THREE.Math.randFloat( this.options.revolution.min, this.options.revolution.max );
	    this.revolutionAxis = [ 'x', 'y', 'z' ][ Math.floor( Math.random() * 3 ) ];
	    this.mesh.rotation.set( Math.random() * Math.PI / 3, Math.random() * Math.PI / 3, Math.random() * Math.PI / 3 );

	  }

	  stop() {

	    this.completed = true;
	    this.confetti.completed ++;

	  }

	  update( delta ) {

	    this.mesh.position.y += this.speed * delta;
	    this.mesh.rotation[ this.revolutionAxis ] += this.revolutionSpeed;

	    if ( this.mesh.position.y < - this.confetti.height - this.size )
	      ( this.confetti.playing ) ? this.reset( false ) : this.stop();

	  }

	}

	class Storage {
	  constructor(game) {
	    this.game = game;
	      this.clearGame();
	      this.clearPreferences();
	  }

	  init() {
	    this.loadPreferences();
	  }

	  loadGame() {
	    return;
	  }

	  saveGame() {
	    return;
	  }

	  clearGame() {
	    localStorage.removeItem("theCube_playing");
	    localStorage.removeItem("theCube_savedState");
	    localStorage.removeItem("theCube_time");
	  }

	  loadPreferences() {
	    try {
	      const preferences = JSON.parse(
	        localStorage.getItem("theCube_preferences")
	      );

	      if (!preferences) throw new Error();

	      this.game.cube.size = parseInt(preferences.cubeSize);
	      this.game.controls.flipConfig = parseInt(preferences.flipConfig);
	      this.game.scrambler.dificulty = parseInt(preferences.dificulty);

	      this.game.world.fov = parseFloat(preferences.fov);
	      this.game.world.resize();

	      this.game.themes.colors = preferences.colors;
	      this.game.themes.setTheme(preferences.theme);

	      return true;
	    } catch (e) {
	      this.game.cube.size = 3;
	      this.game.controls.flipConfig = 0;
	      this.game.scrambler.dificulty = 1;

	      this.game.world.fov = 10;
	      this.game.world.resize();

	      this.game.themes.setTheme("cube");

	      this.savePreferences();

	      return false;
	    }
	  }

	  savePreferences() {
	    ({
	      cubeSize: this.game.cube.size,
	      flipConfig: this.game.controls.flipConfig,
	      dificulty: this.game.scrambler.dificulty,
	      fov: this.game.world.fov,
	      theme: this.game.themes.theme,
	      colors: this.game.themes.colors,
	    });

	    // localStorage.setItem("theCube_preferences", JSON.stringify(preferences));
	  }

	  clearPreferences() {
	    localStorage.removeItem("theCube_preferences");
	  }
	}

	class Themes {

	  constructor( game ) {

	    this.game = game;
	    this.theme = null;

	    this.defaults = {
	      cube: {
	        U: 0xfff7ff, // white
	        D: 0xffef48, // yellow
	        F: 0xef3923, // red
	        R: 0x41aac8, // blue
	        B: 0xff8c0a, // orange
	        L: 0x82ca38, // green
	        P: 0x08101a, // piece
	        G: 0xd1d5db, // background
	      },
	      erno: {
	        U: 0xffffff,
	        D: 0xffd500,
	        F: 0xc41e3a,
	        R: 0x0051ba,
	        B: 0xff5800,
	        L: 0x009e60,
	        P: 0x08101a,
	        G: 0x8abdff,
	      },
	      dust: {
	        U: 0xfff6eb,
	        D: 0xe7c48d,
	        F: 0x8f253e,
	        R: 0x607e69,
	        B: 0xbe6f62,
	        L: 0x849f5d,
	        P: 0x08101a,
	        G: 0xE7C48D,
	      },
	      camo: {
	        U: 0xfff6eb,
	        D: 0xbfb672,
	        F: 0x37241c,
	        R: 0x718456,
	        B: 0x805831,
	        L: 0x37431d,
	        P: 0x08101a,
	        G: 0xBFB672,
	      },
	      rain: {
	        U: 0xfafaff,
	        D: 0xedb92d,
	        F: 0xce2135,
	        R: 0x449a89,
	        B: 0xec582f,
	        L: 0xa3a947,
	        P: 0x08101a,
	        G: 0x87b9ac,
	      },
	    };

	    this.colors = JSON.parse( JSON.stringify( this.defaults ) );

	  }

	  getColors() {

	    return this.colors[ this.theme ];

	  }

	  setTheme( theme = false, force = false ) {

	    if ( theme === this.theme && force === false ) return;
	    if ( theme !== false ) this.theme = theme;

	    const colors = this.getColors();

	    this.game.dom.prefs.querySelectorAll( '.range__handle div' ).forEach( range => {

	      range.style.background = '#' + colors.R.toString(16).padStart(6, '0');

	    } );

	    this.game.cube.updateColors( colors );

	    this.game.confetti.updateColors( colors );

	    this.game.dom.back.style.background = '#' + colors.G.toString(16).padStart(6, '0');

	  }

	}

	class ThemeEditor {

	  constructor( game ) {

	    this.game = game;

	    this.editColor = 'R';

	    this.getPieceColor = this.getPieceColor.bind( this );

	  }

	  colorFromHSL( h, s, l ) {

	    h = Math.round( h );
	    s = Math.round( s );
	    l = Math.round( l );

	    return new THREE.Color( `hsl(${h}, ${s}%, ${l}%)` );

	  }

	  setHSL( color = null, animate = false ) {

	    this.editColor = ( color === null) ? 'R' : color;

	    const hsl = new THREE.Color( this.game.themes.getColors()[ this.editColor ] );

	    const { h, s, l } = hsl.getHSL( hsl );
	    const { hue, saturation, lightness } = this.game.preferences.ranges;

	    if ( animate ) {

	      const ho = hue.value / 360;
	      const so = saturation.value / 100;
	      const lo = lightness.value / 100;

	      const colorOld = this.colorFromHSL( hue.value, saturation.value, lightness.value );

	      if ( this.tweenHSL ) this.tweenHSL.stop();

	      this.tweenHSL = new Tween( {
	        duration: 200,
	        easing: Easing.Sine.Out(),
	        onUpdate: tween => {

	          hue.setValue( ( ho + ( h - ho ) * tween.value ) * 360 );
	          saturation.setValue( ( so + ( s - so ) * tween.value ) * 100 );
	          lightness.setValue( ( lo + ( l - lo ) * tween.value ) * 100 );

	          const colorTween = colorOld.clone().lerp( hsl, tween.value );

	          const colorTweenStyle = colorTween.getStyle();
	          const colorTweenHex = colorTween.getHSL( colorTween );

	          hue.handle.style.color = colorTweenStyle;
	          saturation.handle.style.color = colorTweenStyle;
	          lightness.handle.style.color = colorTweenStyle;

	          saturation.track.style.color =
	            this.colorFromHSL( colorTweenHex.h * 360, 100, 50 ).getStyle();
	          lightness.track.style.color =
	            this.colorFromHSL( colorTweenHex.h * 360, colorTweenHex.s * 100, 50 ).getStyle();

	          this.game.dom.theme.style.display = 'none';
	          this.game.dom.theme.offsetHeight;
	          this.game.dom.theme.style.display = '';

	        },
	        onComplete: () => {

	          this.updateHSL();
	          this.game.storage.savePreferences();

	        },
	      } );

	    } else {

	      hue.setValue( h * 360 );
	      saturation.setValue( s * 100 );
	      lightness.setValue( l * 100 );

	      this.updateHSL();
	      this.game.storage.savePreferences();

	    }

	  }

	  updateHSL() {

	    const { hue, saturation, lightness } = this.game.preferences.ranges;

	    const h = hue.value;
	    const s = saturation.value;
	    const l = lightness.value;

	    const color = this.colorFromHSL( h, s, l ).getStyle();

	    hue.handle.style.color = color;
	    saturation.handle.style.color = color;
	    lightness.handle.style.color = color;

	    saturation.track.style.color = this.colorFromHSL( h, 100, 50 ).getStyle();
	    lightness.track.style.color = this.colorFromHSL( h, s, 50 ).getStyle();

	    this.game.dom.theme.style.display = 'none';
	    this.game.dom.theme.offsetHeight;
	    this.game.dom.theme.style.display = '';

	    const theme = this.game.themes.theme;

	    this.game.themes.colors[ theme ][ this.editColor ] = this.colorFromHSL( h, s, l ).getHex();
	    this.game.themes.setTheme();

	  }

	  colorPicker( enable ) {

	    if ( enable ) {

	      this.game.dom.game.addEventListener( 'click', this.getPieceColor, false );

	    } else {

	      this.game.dom.game.removeEventListener( 'click', this.getPieceColor, false );

	    }

	  }

	  getPieceColor( event ) {

	    const clickEvent = event.touches
	      ? ( event.touches[ 0 ] || event.changedTouches[ 0 ] )
	      : event;

	    const clickPosition = new THREE.Vector2( clickEvent.pageX, clickEvent.pageY );

	    let edgeIntersect = this.game.controls.getIntersect( clickPosition, this.game.cube.edges, true );
	    let pieceIntersect = this.game.controls.getIntersect( clickPosition, this.game.cube.cubes, true );

	    if ( edgeIntersect !== false ) {

	      const edge = edgeIntersect.object;

	      const position = edge.parent
	        .localToWorld( edge.position.clone() )
	        .sub( this.game.cube.object.position )
	        .sub( this.game.cube.animator.position );

	      const mainAxis = this.game.controls.getMainAxis( position );
	      if ( position.multiplyScalar( 2 ).round()[ mainAxis ] < 1 ) edgeIntersect = false;

	    }

	    const name = edgeIntersect ? edgeIntersect.object.name : pieceIntersect ? 'P' : 'G';

	    this.setHSL( name, true );

	  }

	  resetTheme() {

	    this.game.themes.colors[ this.game.themes.theme ] =
	      JSON.parse( JSON.stringify( this.game.themes.defaults[ this.game.themes.theme ] ) );

	    this.game.themes.setTheme();

	    this.setHSL( this.editColor, true );

	  }

	}

	const States = {
	  3: {
	    checkerboard: {
	      names: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 ],
	      positions: [
	        { "x": 2/3, "y": -1/3, "z": 1/3 },
	        { "x": -1/3, "y": 1/3, "z": 0 },
	        { "x": 1/3, "y": -1/3, "z": -1/3 },
	        { "x": -1/3, "y": 0, "z": -1/3 },
	        { "x": 1/3, "y": 0, "z": 0 },
	        { "x": -1/3, "y": 0, "z": 1/3 },
	        { "x": 1/3, "y": 1/3, "z": 1/3 },
	        { "x": -1/3, "y": -1/3, "z": 0 },
	        { "x": 1/3, "y": 1/3, "z": -1/3 },
	        { "x": 0, "y": 1/3, "z": -1/3 },
	        { "x": 0, "y": -1/3, "z": 0 },
	        { "x": 0, "y": 1/3, "z": 1/3 },
	        { "x": 0, "y": 0, "z": 1/3 },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": -1/3 },
	        { "x": 0, "y": -1/3, "z": -1/3 },
	        { "x": 0, "y": 1/3, "z": 0 },
	        { "x": 0, "y": -1/3, "z": 1/3 },
	        { "x": -1/3, "y": -1/3, "z": 1/3 },
	        { "x": 1/3, "y": 1/3, "z": 0 },
	        { "x": -1/3, "y": -1/3, "z": -1/3 },
	        { "x": 1/3, "y": 0, "z": -1/3 },
	        { "x": -1/3, "y": 0, "z": 0 },
	        { "x": 1/3, "y": 0, "z": 1/3 },
	        { "x": -1/3, "y": 1/3, "z": 1/3 },
	        { "x": 1/3, "y": -1/3, "z": 0 },
	        { "x": -1/3, "y": 1/3, "z": -1/3 }
	      ],
	      rotations: [
	        { "x": -Math.PI, "y": 0, "z": Math.PI, },
	        { "x": Math.PI, "y": 0, "z": 0 },
	        { "x": -Math.PI, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": -Math.PI, "y": 0, "z": Math.PI },
	        { "x": Math.PI, "y": 0, "z": 0 },
	        { "x": -Math.PI, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": -Math.PI, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": Math.PI, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": -Math.PI, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": -Math.PI, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI }
	      ],
	      size: 3,
	    },
	  }
	};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var cube$1 = {exports: {}};

	var cube = cube$1.exports;

	var hasRequiredCube;

	function requireCube () {
		if (hasRequiredCube) return cube$1.exports;
		hasRequiredCube = 1;
		(function (module) {
			(function() {
			  // Centers
			  var B, BL, BR, Cube, D, DB, DBL, DF, DFR, DL, DLF, DR, DRB, F, FL, FR, L, R, U, UB, UBR, UF, UFL, UL, ULB, UR, URF, centerColor, centerFacelet, cornerColor, cornerFacelet, edgeColor, edgeFacelet;

			  [U, R, F, D, L, B] = [0, 1, 2, 3, 4, 5];

			  // Corners
			  [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB] = [0, 1, 2, 3, 4, 5, 6, 7];

			  // Edges
			  [UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

			  [centerFacelet, cornerFacelet, edgeFacelet] = (function() {
			    var _B, _D, _F, _L, _R, _U;
			    _U = function(x) {
			      return x - 1;
			    };
			    _R = function(x) {
			      return _U(9) + x;
			    };
			    _F = function(x) {
			      return _R(9) + x;
			    };
			    _D = function(x) {
			      return _F(9) + x;
			    };
			    _L = function(x) {
			      return _D(9) + x;
			    };
			    _B = function(x) {
			      return _L(9) + x;
			    };
			    return [
			      // Centers
			      [4,
			      13,
			      22,
			      31,
			      40,
			      49],
			      // Corners
			      [[_U(9),
			      _R(1),
			      _F(3)],
			      [_U(7),
			      _F(1),
			      _L(3)],
			      [_U(1),
			      _L(1),
			      _B(3)],
			      [_U(3),
			      _B(1),
			      _R(3)],
			      [_D(3),
			      _F(9),
			      _R(7)],
			      [_D(1),
			      _L(9),
			      _F(7)],
			      [_D(7),
			      _B(9),
			      _L(7)],
			      [_D(9),
			      _R(9),
			      _B(7)]],
			      // Edges
			      [[_U(6),
			      _R(2)],
			      [_U(8),
			      _F(2)],
			      [_U(4),
			      _L(2)],
			      [_U(2),
			      _B(2)],
			      [_D(6),
			      _R(8)],
			      [_D(2),
			      _F(8)],
			      [_D(4),
			      _L(8)],
			      [_D(8),
			      _B(8)],
			      [_F(6),
			      _R(4)],
			      [_F(4),
			      _L(6)],
			      [_B(6),
			      _L(4)],
			      [_B(4),
			      _R(6)]]
			    ];
			  })();

			  centerColor = ['U', 'R', 'F', 'D', 'L', 'B'];

			  cornerColor = [['U', 'R', 'F'], ['U', 'F', 'L'], ['U', 'L', 'B'], ['U', 'B', 'R'], ['D', 'F', 'R'], ['D', 'L', 'F'], ['D', 'B', 'L'], ['D', 'R', 'B']];

			  edgeColor = [['U', 'R'], ['U', 'F'], ['U', 'L'], ['U', 'B'], ['D', 'R'], ['D', 'F'], ['D', 'L'], ['D', 'B'], ['F', 'R'], ['F', 'L'], ['B', 'L'], ['B', 'R']];

			  Cube = (function() {
			    var faceNames, faceNums, parseAlg;

			    class Cube {
			      constructor(other) {
			        if (other != null) {
			          this.init(other);
			        } else {
			          this.identity();
			        }
			        // For moves to avoid allocating new objects each time
			        this.newCenter = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 5; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			        this.newCp = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 7; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			        this.newEp = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 11; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			        this.newCo = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 7; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			        this.newEo = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 11; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			      }

			      init(state) {
			        this.center = state.center.slice(0);
			        this.co = state.co.slice(0);
			        this.ep = state.ep.slice(0);
			        this.cp = state.cp.slice(0);
			        return this.eo = state.eo.slice(0);
			      }

			      identity() {
			        // Initialize to the identity cube
			        this.center = [0, 1, 2, 3, 4, 5];
			        this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
			        this.co = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 7; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			        this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
			        return this.eo = (function() {
			          var k, results;
			          results = [];
			          for (k = 0; k <= 11; ++k) {
			            results.push(0);
			          }
			          return results;
			        })();
			      }

			      toJSON() {
			        return {
			          center: this.center,
			          cp: this.cp,
			          co: this.co,
			          ep: this.ep,
			          eo: this.eo
			        };
			      }

			      asString() {
			        var corner, edge, i, k, l, m, n, o, ori, p, result;
			        result = [];
			        for (i = k = 0; k <= 5; i = ++k) {
			          result[9 * i + 4] = centerColor[this.center[i]];
			        }
			        for (i = l = 0; l <= 7; i = ++l) {
			          corner = this.cp[i];
			          ori = this.co[i];
			          for (n = m = 0; m <= 2; n = ++m) {
			            result[cornerFacelet[i][(n + ori) % 3]] = cornerColor[corner][n];
			          }
			        }
			        for (i = o = 0; o <= 11; i = ++o) {
			          edge = this.ep[i];
			          ori = this.eo[i];
			          for (n = p = 0; p <= 1; n = ++p) {
			            result[edgeFacelet[i][(n + ori) % 2]] = edgeColor[edge][n];
			          }
			        }
			        return result.join('');
			      }

			      static fromString(str) {
			        var col1, col2, cube, i, j, k, l, m, o, ori, p, q, r, ref;
			        cube = new Cube;
			        for (i = k = 0; k <= 5; i = ++k) {
			          for (j = l = 0; l <= 5; j = ++l) {
			            if (str[9 * i + 4] === centerColor[j]) {
			              cube.center[i] = j;
			            }
			          }
			        }
			        for (i = m = 0; m <= 7; i = ++m) {
			          for (ori = o = 0; o <= 2; ori = ++o) {
			            if ((ref = str[cornerFacelet[i][ori]]) === 'U' || ref === 'D') {
			              break;
			            }
			          }
			          col1 = str[cornerFacelet[i][(ori + 1) % 3]];
			          col2 = str[cornerFacelet[i][(ori + 2) % 3]];
			          for (j = p = 0; p <= 7; j = ++p) {
			            if (col1 === cornerColor[j][1] && col2 === cornerColor[j][2]) {
			              cube.cp[i] = j;
			              cube.co[i] = ori % 3;
			            }
			          }
			        }
			        for (i = q = 0; q <= 11; i = ++q) {
			          for (j = r = 0; r <= 11; j = ++r) {
			            if (str[edgeFacelet[i][0]] === edgeColor[j][0] && str[edgeFacelet[i][1]] === edgeColor[j][1]) {
			              cube.ep[i] = j;
			              cube.eo[i] = 0;
			              break;
			            }
			            if (str[edgeFacelet[i][0]] === edgeColor[j][1] && str[edgeFacelet[i][1]] === edgeColor[j][0]) {
			              cube.ep[i] = j;
			              cube.eo[i] = 1;
			              break;
			            }
			          }
			        }
			        return cube;
			      }

			      clone() {
			        return new Cube(this.toJSON());
			      }

			      // A class method returning a new random cube
			      static random() {
			        return new Cube().randomize();
			      }

			      isSolved() {
			        var c, cent, clone, e, k, l, m;
			        clone = this.clone();
			        clone.move(clone.upright());
			        for (cent = k = 0; k <= 5; cent = ++k) {
			          if (clone.center[cent] !== cent) {
			            return false;
			          }
			        }
			        for (c = l = 0; l <= 7; c = ++l) {
			          if (clone.cp[c] !== c) {
			            return false;
			          }
			          if (clone.co[c] !== 0) {
			            return false;
			          }
			        }
			        for (e = m = 0; m <= 11; e = ++m) {
			          if (clone.ep[e] !== e) {
			            return false;
			          }
			          if (clone.eo[e] !== 0) {
			            return false;
			          }
			        }
			        return true;
			      }

			      // Multiply this Cube with another Cube, restricted to centers.
			      centerMultiply(other) {
			        var from, k, to;
			        for (to = k = 0; k <= 5; to = ++k) {
			          from = other.center[to];
			          this.newCenter[to] = this.center[from];
			        }
			        [this.center, this.newCenter] = [this.newCenter, this.center];
			        return this;
			      }

			      // Multiply this Cube with another Cube, restricted to corners.
			      cornerMultiply(other) {
			        var from, k, to;
			        for (to = k = 0; k <= 7; to = ++k) {
			          from = other.cp[to];
			          this.newCp[to] = this.cp[from];
			          this.newCo[to] = (this.co[from] + other.co[to]) % 3;
			        }
			        [this.cp, this.newCp] = [this.newCp, this.cp];
			        [this.co, this.newCo] = [this.newCo, this.co];
			        return this;
			      }

			      // Multiply this Cube with another Cube, restricted to edges
			      edgeMultiply(other) {
			        var from, k, to;
			        for (to = k = 0; k <= 11; to = ++k) {
			          from = other.ep[to];
			          this.newEp[to] = this.ep[from];
			          this.newEo[to] = (this.eo[from] + other.eo[to]) % 2;
			        }
			        [this.ep, this.newEp] = [this.newEp, this.ep];
			        [this.eo, this.newEo] = [this.newEo, this.eo];
			        return this;
			      }

			      // Multiply this cube with another Cube
			      multiply(other) {
			        this.centerMultiply(other);
			        this.cornerMultiply(other);
			        this.edgeMultiply(other);
			        return this;
			      }

			      move(arg) {
			        var face, k, l, len, move, power, ref, ref1;
			        ref = parseAlg(arg);
			        for (k = 0, len = ref.length; k < len; k++) {
			          move = ref[k];
			          face = move / 3 | 0;
			          power = move % 3;
			          for (l = 0, ref1 = power; (0 <= ref1 ? l <= ref1 : l >= ref1); 0 <= ref1 ? ++l : --l) {
			            this.multiply(Cube.moves[face]);
			          }
			        }
			        return this;
			      }

			      upright() {
			        var clone, i, j, k, l, result;
			        clone = this.clone();
			        result = [];
			        for (i = k = 0; k <= 5; i = ++k) {
			          if (clone.center[i] === F) {
			            break;
			          }
			        }
			        switch (i) {
			          case D:
			            result.push("x");
			            break;
			          case U:
			            result.push("x'");
			            break;
			          case B:
			            result.push("x2");
			            break;
			          case R:
			            result.push("y");
			            break;
			          case L:
			            result.push("y'");
			        }
			        if (result.length) {
			          clone.move(result[0]);
			        }
			        for (j = l = 0; l <= 5; j = ++l) {
			          if (clone.center[j] === U) {
			            break;
			          }
			        }
			        switch (j) {
			          case L:
			            result.push("z");
			            break;
			          case R:
			            result.push("z'");
			            break;
			          case D:
			            result.push("z2");
			        }
			        return result.join(' ');
			      }

			      static inverse(arg) {
			        var face, k, len, move, power, result, str;
			        result = (function() {
			          var k, len, ref, results;
			          ref = parseAlg(arg);
			          results = [];
			          for (k = 0, len = ref.length; k < len; k++) {
			            move = ref[k];
			            face = move / 3 | 0;
			            power = move % 3;
			            results.push(face * 3 + -(power - 1) + 1);
			          }
			          return results;
			        })();
			        result.reverse();
			        if (typeof arg === 'string') {
			          str = '';
			          for (k = 0, len = result.length; k < len; k++) {
			            move = result[k];
			            face = move / 3 | 0;
			            power = move % 3;
			            str += faceNames[face];
			            if (power === 1) {
			              str += '2';
			            } else if (power === 2) {
			              str += "'";
			            }
			            str += ' ';
			          }
			          return str.substring(0, str.length - 1);
			        } else if (arg.length != null) {
			          return result;
			        } else {
			          return result[0];
			        }
			      }

			    }
			    Cube.prototype.randomize = (function() {
			      var arePermutationsValid, generateValidRandomOrientation, generateValidRandomPermutation, getNumSwaps, isOrientationValid, randint, randomizeOrientation, result, shuffle;
			      randint = function(min, max) {
			        return min + Math.floor(Math.random() * (max - min + 1));
			      };
			      // Fisher-Yates shuffle adapted from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
			      shuffle = function(array) {
			        var currentIndex, randomIndex;
			        currentIndex = array.length;
			        // While there remain elements to shuffle...
			        while (currentIndex !== 0) {
			          // Pick a remaining element...
			          randomIndex = randint(0, currentIndex - 1);
			          currentIndex -= 1;
			          // And swap it with the current element.
			          array[currentIndex];
			          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
			        }
			      };
			      getNumSwaps = function(arr) {
			        var cur, cycleLength, i, k, numSwaps, ref, seen;
			        numSwaps = 0;
			        seen = (function() {
			          var k, ref, results;
			          results = [];
			          for (k = 0, ref = arr.length - 1; (0 <= ref ? k <= ref : k >= ref); 0 <= ref ? ++k : --k) {
			            results.push(false);
			          }
			          return results;
			        })();
			        while (true) {
			          // We compute the cycle decomposition
			          cur = -1;
			          for (i = k = 0, ref = arr.length - 1; (0 <= ref ? k <= ref : k >= ref); i = 0 <= ref ? ++k : --k) {
			            if (!seen[i]) {
			              cur = i;
			              break;
			            }
			          }
			          if (cur === -1) {
			            break;
			          }
			          cycleLength = 0;
			          while (!seen[cur]) {
			            seen[cur] = true;
			            cycleLength++;
			            cur = arr[cur];
			          }
			          // A cycle is equivalent to cycleLength + 1 swaps
			          numSwaps += cycleLength + 1;
			        }
			        return numSwaps;
			      };
			      arePermutationsValid = function(cp, ep) {
			        var numSwaps;
			        numSwaps = getNumSwaps(ep) + getNumSwaps(cp);
			        return numSwaps % 2 === 0;
			      };
			      generateValidRandomPermutation = function(cp, ep) {
			        // Each shuffle only takes around 12 operations and there's a 50%
			        // chance of a valid permutation so it'll finish in very good time
			        shuffle(ep);
			        shuffle(cp);
			        while (!arePermutationsValid(cp, ep)) {
			          shuffle(ep);
			          shuffle(cp);
			        }
			      };
			      randomizeOrientation = function(arr, numOrientations) {
			        var i, k, ori, ref;
			        ori = 0;
			        for (i = k = 0, ref = arr.length - 1; (0 <= ref ? k <= ref : k >= ref); i = 0 <= ref ? ++k : --k) {
			          ori += (arr[i] = randint(0, numOrientations - 1));
			        }
			      };
			      isOrientationValid = function(arr, numOrientations) {
			        return arr.reduce(function(a, b) {
			          return a + b;
			        }) % numOrientations === 0;
			      };
			      generateValidRandomOrientation = function(co, eo) {
			        // There is a 1/2 and 1/3 probably respectively of each of these
			        // succeeding so the probability of them running 10 times before
			        // success is already only 1% and only gets exponentially lower
			        // and each generation is only in the 10s of operations which is nothing
			        randomizeOrientation(co, 3);
			        while (!isOrientationValid(co, 3)) {
			          randomizeOrientation(co, 3);
			        }
			        randomizeOrientation(eo, 2);
			        while (!isOrientationValid(eo, 2)) {
			          randomizeOrientation(eo, 2);
			        }
			      };
			      result = function() {
			        generateValidRandomPermutation(this.cp, this.ep);
			        generateValidRandomOrientation(this.co, this.eo);
			        return this;
			      };
			      return result;
			    })();

			    Cube.moves = [
			      {
			        // U
			        center: [0, 1, 2, 3, 4, 5],
			        cp: [UBR,
			      URF,
			      UFL,
			      ULB,
			      DFR,
			      DLF,
			      DBL,
			      DRB],
			        co: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0],
			        ep: [UB,
			      UR,
			      UF,
			      UL,
			      DR,
			      DF,
			      DL,
			      DB,
			      FR,
			      FL,
			      BL,
			      BR],
			        eo: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0]
			      },
			      {
			        // R
			        center: [0, 1, 2, 3, 4, 5],
			        cp: [DFR,
			      UFL,
			      ULB,
			      URF,
			      DRB,
			      DLF,
			      DBL,
			      UBR],
			        co: [2,
			      0,
			      0,
			      1,
			      1,
			      0,
			      0,
			      2],
			        ep: [FR,
			      UF,
			      UL,
			      UB,
			      BR,
			      DF,
			      DL,
			      DB,
			      DR,
			      FL,
			      BL,
			      UR],
			        eo: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0]
			      },
			      {
			        // F
			        center: [0, 1, 2, 3, 4, 5],
			        cp: [UFL,
			      DLF,
			      ULB,
			      UBR,
			      URF,
			      DFR,
			      DBL,
			      DRB],
			        co: [1,
			      2,
			      0,
			      0,
			      2,
			      1,
			      0,
			      0],
			        ep: [UR,
			      FL,
			      UL,
			      UB,
			      DR,
			      FR,
			      DL,
			      DB,
			      UF,
			      DF,
			      BL,
			      BR],
			        eo: [0,
			      1,
			      0,
			      0,
			      0,
			      1,
			      0,
			      0,
			      1,
			      1,
			      0,
			      0]
			      },
			      {
			        // D
			        center: [0, 1, 2, 3, 4, 5],
			        cp: [URF,
			      UFL,
			      ULB,
			      UBR,
			      DLF,
			      DBL,
			      DRB,
			      DFR],
			        co: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0],
			        ep: [UR,
			      UF,
			      UL,
			      UB,
			      DF,
			      DL,
			      DB,
			      DR,
			      FR,
			      FL,
			      BL,
			      BR],
			        eo: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0]
			      },
			      {
			        // L
			        center: [0, 1, 2, 3, 4, 5],
			        cp: [URF,
			      ULB,
			      DBL,
			      UBR,
			      DFR,
			      UFL,
			      DLF,
			      DRB],
			        co: [0,
			      1,
			      2,
			      0,
			      0,
			      2,
			      1,
			      0],
			        ep: [UR,
			      UF,
			      BL,
			      UB,
			      DR,
			      DF,
			      FL,
			      DB,
			      FR,
			      UL,
			      DL,
			      BR],
			        eo: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0]
			      },
			      {
			        // B
			        center: [0, 1, 2, 3, 4, 5],
			        cp: [URF,
			      UFL,
			      UBR,
			      DRB,
			      DFR,
			      DLF,
			      ULB,
			      DBL],
			        co: [0,
			      0,
			      1,
			      2,
			      0,
			      0,
			      2,
			      1],
			        ep: [UR,
			      UF,
			      UL,
			      BR,
			      DR,
			      DF,
			      DL,
			      BL,
			      FR,
			      FL,
			      UB,
			      DB],
			        eo: [0,
			      0,
			      0,
			      1,
			      0,
			      0,
			      0,
			      1,
			      0,
			      0,
			      1,
			      1]
			      },
			      {
			        // E
			        center: [U,
			      F,
			      L,
			      D,
			      B,
			      R],
			        cp: [URF,
			      UFL,
			      ULB,
			      UBR,
			      DFR,
			      DLF,
			      DBL,
			      DRB],
			        co: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0],
			        ep: [UR,
			      UF,
			      UL,
			      UB,
			      DR,
			      DF,
			      DL,
			      DB,
			      FL,
			      BL,
			      BR,
			      FR],
			        eo: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      1,
			      1,
			      1,
			      1]
			      },
			      {
			        // M
			        center: [B,
			      R,
			      U,
			      F,
			      L,
			      D],
			        cp: [URF,
			      UFL,
			      ULB,
			      UBR,
			      DFR,
			      DLF,
			      DBL,
			      DRB],
			        co: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0],
			        ep: [UR,
			      UB,
			      UL,
			      DB,
			      DR,
			      UF,
			      DL,
			      DF,
			      FR,
			      FL,
			      BL,
			      BR],
			        eo: [0,
			      1,
			      0,
			      1,
			      0,
			      1,
			      0,
			      1,
			      0,
			      0,
			      0,
			      0]
			      },
			      {
			        // S
			        center: [L,
			      U,
			      F,
			      R,
			      D,
			      B],
			        cp: [URF,
			      UFL,
			      ULB,
			      UBR,
			      DFR,
			      DLF,
			      DBL,
			      DRB],
			        co: [0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0,
			      0],
			        ep: [UL,
			      UF,
			      DL,
			      UB,
			      UR,
			      DF,
			      DR,
			      DB,
			      FR,
			      FL,
			      BL,
			      BR],
			        eo: [1,
			      0,
			      1,
			      0,
			      1,
			      0,
			      1,
			      0,
			      0,
			      0,
			      0,
			      0]
			      }
			    ];

			    faceNums = {
			      U: 0,
			      R: 1,
			      F: 2,
			      D: 3,
			      L: 4,
			      B: 5,
			      E: 6,
			      M: 7,
			      S: 8,
			      x: 9,
			      y: 10,
			      z: 11,
			      u: 12,
			      r: 13,
			      f: 14,
			      d: 15,
			      l: 16,
			      b: 17
			    };

			    faceNames = {
			      0: 'U',
			      1: 'R',
			      2: 'F',
			      3: 'D',
			      4: 'L',
			      5: 'B',
			      6: 'E',
			      7: 'M',
			      8: 'S',
			      9: 'x',
			      10: 'y',
			      11: 'z',
			      12: 'u',
			      13: 'r',
			      14: 'f',
			      15: 'd',
			      16: 'l',
			      17: 'b'
			    };

			    parseAlg = function(arg) {
			      var k, len, move, part, power, ref, results;
			      if (typeof arg === 'string') {
			        ref = arg.split(/\s+/);
			        // String
			        results = [];
			        for (k = 0, len = ref.length; k < len; k++) {
			          part = ref[k];
			          if (part.length === 0) {
			            // First and last can be empty
			            continue;
			          }
			          if (part.length > 2) {
			            throw new Error(`Invalid move: ${part}`);
			          }
			          move = faceNums[part[0]];
			          if (move === void 0) {
			            throw new Error(`Invalid move: ${part}`);
			          }
			          if (part.length === 1) {
			            power = 0;
			          } else {
			            if (part[1] === '2') {
			              power = 1;
			            } else if (part[1] === "'") {
			              power = 2;
			            } else {
			              throw new Error(`Invalid move: ${part}`);
			            }
			          }
			          results.push(move * 3 + power);
			        }
			        return results;
			      } else if (arg.length != null) {
			        // Already an array
			        return arg;
			      } else {
			        // A single move
			        return [arg];
			      }
			    };

			    // x
			    Cube.moves.push(new Cube().move("R M' L'").toJSON());

			    // y
			    Cube.moves.push(new Cube().move("U E' D'").toJSON());

			    // z
			    Cube.moves.push(new Cube().move("F S B'").toJSON());

			    // u
			    Cube.moves.push(new Cube().move("U E'").toJSON());

			    // r
			    Cube.moves.push(new Cube().move("R M'").toJSON());

			    // f
			    Cube.moves.push(new Cube().move("F S").toJSON());

			    // d
			    Cube.moves.push(new Cube().move("D E").toJSON());

			    // l
			    Cube.moves.push(new Cube().move("L M").toJSON());

			    // b
			    Cube.moves.push(new Cube().move("B S'").toJSON());

			    return Cube;

			  }).call(this);

			  //# Globals
			  if (module !== null) {
			    module.exports = Cube;
			  } else {
			    this.Cube = Cube;
			  }

			}).call(cube); 
		} (cube$1));
		return cube$1.exports;
	}

	var solve = {};

	var hasRequiredSolve;

	function requireSolve () {
		if (hasRequiredSolve) return solve;
		hasRequiredSolve = 1;
		(function() {
		  var BL, BR, Cnk, Cube, DB, DBL, DF, DFR, DL, DLF, DR, DRB, FL, FR, Include, N_FLIP, N_FRtoBR, N_PARITY, N_SLICE1, N_SLICE2, N_TWIST, N_UBtoDF, N_URFtoDLF, N_URtoDF, N_URtoUL, UB, UBR, UF, UFL, UL, ULB, UR, URF, allMoves1, allMoves2, computeMoveTable, computePruningTable, faceNames, faceNums, factorial, key, max, mergeURtoDF, moveTableParams, nextMoves1, nextMoves2, permutationIndex, pruning, pruningTableParams, rotateLeft, rotateRight, value,
		    indexOf = [].indexOf;

		  Cube = this.Cube || requireCube();

		  // Corners
		  [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB] = [0, 1, 2, 3, 4, 5, 6, 7];

		  // Edges
		  [UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

		  //# Helpers

		  // n choose k, i.e. the binomial coeffiecient
		  Cnk = function(n, k) {
		    var i, j, s;
		    if (n < k) {
		      return 0;
		    }
		    if (k > n / 2) {
		      k = n - k;
		    }
		    s = 1;
		    i = n;
		    j = 1;
		    while (i !== n - k) {
		      s *= i;
		      s /= j;
		      i--;
		      j++;
		    }
		    return s;
		  };

		  // n!
		  factorial = function(n) {
		    var f, i, m, ref;
		    f = 1;
		    for (i = m = 2, ref = n; (2 <= ref ? m <= ref : m >= ref); i = 2 <= ref ? ++m : --m) {
		      f *= i;
		    }
		    return f;
		  };

		  // Maximum of two values
		  max = function(a, b) {
		    if (a > b) {
		      return a;
		    } else {
		      return b;
		    }
		  };

		  // Rotate elements between l and r left by one place
		  rotateLeft = function(array, l, r) {
		    var i, m, ref, ref1, tmp;
		    tmp = array[l];
		    for (i = m = ref = l, ref1 = r - 1; (ref <= ref1 ? m <= ref1 : m >= ref1); i = ref <= ref1 ? ++m : --m) {
		      array[i] = array[i + 1];
		    }
		    return array[r] = tmp;
		  };

		  // Rotate elements between l and r right by one place
		  rotateRight = function(array, l, r) {
		    var i, m, ref, ref1, tmp;
		    tmp = array[r];
		    for (i = m = ref = r, ref1 = l + 1; (ref <= ref1 ? m <= ref1 : m >= ref1); i = ref <= ref1 ? ++m : --m) {
		      array[i] = array[i - 1];
		    }
		    return array[l] = tmp;
		  };

		  // Generate a function that computes permutation indices.

		  // The permutation index actually encodes two indices: Combination,
		  // i.e. positions of the cubies start..end (A) and their respective
		  // permutation (B). The maximum value for B is

		  //   maxB = (end - start + 1)!

		  // and the index is A * maxB + B
		  permutationIndex = function(context, start, end, fromEnd = false) {
		    var i, maxAll, maxB, maxOur, our, permName;
		    maxOur = end - start;
		    maxB = factorial(maxOur + 1);
		    if (context === 'corners') {
		      maxAll = 7;
		      permName = 'cp';
		    } else {
		      maxAll = 11;
		      permName = 'ep';
		    }
		    our = (function() {
		      var m, ref, results;
		      results = [];
		      for (i = m = 0, ref = maxOur; (0 <= ref ? m <= ref : m >= ref); i = 0 <= ref ? ++m : --m) {
		        results.push(0);
		      }
		      return results;
		    })();
		    return function(index) {
		      var a, b, c, j, k, m, o, p, perm, q, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, t, u, w, x, y, z;
		      if (index != null) {
		        for (i = m = 0, ref = maxOur; (0 <= ref ? m <= ref : m >= ref); i = 0 <= ref ? ++m : --m) {
		          // Reset our to [start..end]
		          our[i] = i + start;
		        }
		        b = index % maxB; // permutation
		        a = index / maxB | 0; // combination
		        
		        // Invalidate all edges
		        perm = this[permName];
		        for (i = o = 0, ref1 = maxAll; (0 <= ref1 ? o <= ref1 : o >= ref1); i = 0 <= ref1 ? ++o : --o) {
		          perm[i] = -1;
		        }
		// Generate permutation from index b
		        for (j = p = 1, ref2 = maxOur; (1 <= ref2 ? p <= ref2 : p >= ref2); j = 1 <= ref2 ? ++p : --p) {
		          k = b % (j + 1);
		          b = b / (j + 1) | 0;
		          // TODO: Implement rotateRightBy(our, 0, j, k)
		          while (k > 0) {
		            rotateRight(our, 0, j);
		            k--;
		          }
		        }
		        // Generate combination and set our edges
		        x = maxOur;
		        if (fromEnd) {
		          for (j = q = 0, ref3 = maxAll; (0 <= ref3 ? q <= ref3 : q >= ref3); j = 0 <= ref3 ? ++q : --q) {
		            c = Cnk(maxAll - j, x + 1);
		            if (a - c >= 0) {
		              perm[j] = our[maxOur - x];
		              a -= c;
		              x--;
		            }
		          }
		        } else {
		          for (j = t = ref4 = maxAll; (ref4 <= 0 ? t <= 0 : t >= 0); j = ref4 <= 0 ? ++t : --t) {
		            c = Cnk(j, x + 1);
		            if (a - c >= 0) {
		              perm[j] = our[x];
		              a -= c;
		              x--;
		            }
		          }
		        }
		        return this;
		      } else {
		        perm = this[permName];
		        for (i = u = 0, ref5 = maxOur; (0 <= ref5 ? u <= ref5 : u >= ref5); i = 0 <= ref5 ? ++u : --u) {
		          our[i] = -1;
		        }
		        a = b = x = 0;
		        // Compute the index a < ((maxAll + 1) choose (maxOur + 1)) and
		        // the permutation
		        if (fromEnd) {
		          for (j = w = ref6 = maxAll; (ref6 <= 0 ? w <= 0 : w >= 0); j = ref6 <= 0 ? ++w : --w) {
		            if ((start <= (ref7 = perm[j]) && ref7 <= end)) {
		              a += Cnk(maxAll - j, x + 1);
		              our[maxOur - x] = perm[j];
		              x++;
		            }
		          }
		        } else {
		          for (j = y = 0, ref8 = maxAll; (0 <= ref8 ? y <= ref8 : y >= ref8); j = 0 <= ref8 ? ++y : --y) {
		            if ((start <= (ref9 = perm[j]) && ref9 <= end)) {
		              a += Cnk(j, x + 1);
		              our[x] = perm[j];
		              x++;
		            }
		          }
		        }
		// Compute the index b < (maxOur + 1)! for the permutation
		        for (j = z = ref10 = maxOur; (ref10 <= 0 ? z <= 0 : z >= 0); j = ref10 <= 0 ? ++z : --z) {
		          k = 0;
		          while (our[j] !== start + j) {
		            rotateLeft(our, 0, j);
		            k++;
		          }
		          b = (j + 1) * b + k;
		        }
		        return a * maxB + b;
		      }
		    };
		  };

		  Include = {
		    // The twist of the 8 corners, 0 <= twist < 3^7. The orientation of
		    // the DRB corner is fully determined by the orientation of the other
		    // corners.
		    twist: function(twist) {
		      var i, m, o, ori, parity, v;
		      if (twist != null) {
		        parity = 0;
		        for (i = m = 6; m >= 0; i = --m) {
		          ori = twist % 3;
		          twist = (twist / 3) | 0;
		          this.co[i] = ori;
		          parity += ori;
		        }
		        this.co[7] = (3 - parity % 3) % 3;
		        return this;
		      } else {
		        v = 0;
		        for (i = o = 0; o <= 6; i = ++o) {
		          v = 3 * v + this.co[i];
		        }
		        return v;
		      }
		    },
		    // The flip of the 12 edges, 0 <= flip < 2^11. The orientation of the
		    // BR edge is fully determined by the orientation of the other edges.
		    flip: function(flip) {
		      var i, m, o, ori, parity, v;
		      if (flip != null) {
		        parity = 0;
		        for (i = m = 10; m >= 0; i = --m) {
		          ori = flip % 2;
		          flip = flip / 2 | 0;
		          this.eo[i] = ori;
		          parity += ori;
		        }
		        this.eo[11] = (2 - parity % 2) % 2;
		        return this;
		      } else {
		        v = 0;
		        for (i = o = 0; o <= 10; i = ++o) {
		          v = 2 * v + this.eo[i];
		        }
		        return v;
		      }
		    },
		    // Parity of the corner permutation
		    cornerParity: function() {
		      var i, j, m, o, ref, ref1, ref2, ref3, s;
		      s = 0;
		      for (i = m = ref = DRB, ref1 = URF + 1; (ref <= ref1 ? m <= ref1 : m >= ref1); i = ref <= ref1 ? ++m : --m) {
		        for (j = o = ref2 = i - 1, ref3 = URF; (ref2 <= ref3 ? o <= ref3 : o >= ref3); j = ref2 <= ref3 ? ++o : --o) {
		          if (this.cp[j] > this.cp[i]) {
		            s++;
		          }
		        }
		      }
		      return s % 2;
		    },
		    // Parity of the edges permutation. Parity of corners and edges are
		    // the same if the cube is solvable.
		    edgeParity: function() {
		      var i, j, m, o, ref, ref1, ref2, ref3, s;
		      s = 0;
		      for (i = m = ref = BR, ref1 = UR + 1; (ref <= ref1 ? m <= ref1 : m >= ref1); i = ref <= ref1 ? ++m : --m) {
		        for (j = o = ref2 = i - 1, ref3 = UR; (ref2 <= ref3 ? o <= ref3 : o >= ref3); j = ref2 <= ref3 ? ++o : --o) {
		          if (this.ep[j] > this.ep[i]) {
		            s++;
		          }
		        }
		      }
		      return s % 2;
		    },
		    // Permutation of the six corners URF, UFL, ULB, UBR, DFR, DLF
		    URFtoDLF: permutationIndex('corners', URF, DLF),
		    // Permutation of the three edges UR, UF, UL
		    URtoUL: permutationIndex('edges', UR, UL),
		    // Permutation of the three edges UB, DR, DF
		    UBtoDF: permutationIndex('edges', UB, DF),
		    // Permutation of the six edges UR, UF, UL, UB, DR, DF
		    URtoDF: permutationIndex('edges', UR, DF),
		    // Permutation of the equator slice edges FR, FL, BL and BR
		    FRtoBR: permutationIndex('edges', FR, BR, true)
		  };

		  for (key in Include) {
		    value = Include[key];
		    Cube.prototype[key] = value;
		  }

		  computeMoveTable = function(context, coord, size) {
		    var apply, cube, i, inner, j, m, move, o, p, ref, results;
		    // Loop through all valid values for the coordinate, setting cube's
		    // state in each iteration. Then apply each of the 18 moves to the
		    // cube, and compute the resulting coordinate.
		    apply = context === 'corners' ? 'cornerMultiply' : 'edgeMultiply';
		    cube = new Cube;
		    results = [];
		    for (i = m = 0, ref = size - 1; (0 <= ref ? m <= ref : m >= ref); i = 0 <= ref ? ++m : --m) {
		      cube[coord](i);
		      inner = [];
		      for (j = o = 0; o <= 5; j = ++o) {
		        move = Cube.moves[j];
		        for (p = 0; p <= 2; ++p) {
		          cube[apply](move);
		          inner.push(cube[coord]());
		        }
		        // 4th face turn restores the cube
		        cube[apply](move);
		      }
		      results.push(inner);
		    }
		    return results;
		  };

		  // Because we only have the phase 2 URtoDF coordinates, we need to
		  // merge the URtoUL and UBtoDF coordinates to URtoDF in the beginning
		  // of phase 2.
		  mergeURtoDF = (function() {
		    var a, b;
		    a = new Cube;
		    b = new Cube;
		    return function(URtoUL, UBtoDF) {
		      var i, m;
		      // Collisions can be found because unset are set to -1
		      a.URtoUL(URtoUL);
		      b.UBtoDF(UBtoDF);
		      for (i = m = 0; m <= 7; i = ++m) {
		        if (a.ep[i] !== -1) {
		          if (b.ep[i] !== -1) {
		            return -1; // collision
		          } else {
		            b.ep[i] = a.ep[i];
		          }
		        }
		      }
		      return b.URtoDF();
		    };
		  })();

		  N_TWIST = 2187; // 3^7 corner orientations

		  N_FLIP = 2048; // 2^11 possible edge flips

		  N_PARITY = 2; // 2 possible parities

		  N_FRtoBR = 11880; // 12!/(12-4)! permutations of FR..BR edges

		  N_SLICE1 = 495; // (12 choose 4) possible positions of FR..BR edges

		  N_SLICE2 = 24; // 4! permutations of FR..BR edges in phase 2

		  N_URFtoDLF = 20160; // 8!/(8-6)! permutations of URF..DLF corners

		  
		  // The URtoDF move table is only computed for phase 2 because the full
		  // table would have >650000 entries
		  N_URtoDF = 20160; // 8!/(8-6)! permutation of UR..DF edges in phase 2

		  N_URtoUL = 1320; // 12!/(12-3)! permutations of UR..UL edges

		  N_UBtoDF = 1320; // 12!/(12-3)! permutations of UB..DF edges

		  
		  // The move table for parity is so small that it's included here
		  Cube.moveTables = {
		    parity: [[1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1], [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]],
		    twist: null,
		    flip: null,
		    FRtoBR: null,
		    URFtoDLF: null,
		    URtoDF: null,
		    URtoUL: null,
		    UBtoDF: null,
		    mergeURtoDF: null
		  };

		  // Other move tables are computed on the fly
		  moveTableParams = {
		    // name: [scope, size]
		    twist: ['corners', N_TWIST],
		    flip: ['edges', N_FLIP],
		    FRtoBR: ['edges', N_FRtoBR],
		    URFtoDLF: ['corners', N_URFtoDLF],
		    URtoDF: ['edges', N_URtoDF],
		    URtoUL: ['edges', N_URtoUL],
		    UBtoDF: ['edges', N_UBtoDF],
		    mergeURtoDF: []
		  };

		  Cube.computeMoveTables = function(...tables) {
		    var len, m, name, scope, size, tableName;
		    if (tables.length === 0) {
		      tables = (function() {
		        var results;
		        results = [];
		        for (name in moveTableParams) {
		          results.push(name);
		        }
		        return results;
		      })();
		    }
		    for (m = 0, len = tables.length; m < len; m++) {
		      tableName = tables[m];
		      if (this.moveTables[tableName] !== null) {
		        // Already computed
		        continue;
		      }
		      if (tableName === 'mergeURtoDF') {
		        this.moveTables.mergeURtoDF = (function() {
		          var UBtoDF, URtoUL, o, results;
		          results = [];
		          for (URtoUL = o = 0; o <= 335; URtoUL = ++o) {
		            results.push((function() {
		              var p, results1;
		              results1 = [];
		              for (UBtoDF = p = 0; p <= 335; UBtoDF = ++p) {
		                results1.push(mergeURtoDF(URtoUL, UBtoDF));
		              }
		              return results1;
		            })());
		          }
		          return results;
		        })();
		      } else {
		        [scope, size] = moveTableParams[tableName];
		        this.moveTables[tableName] = computeMoveTable(scope, tableName, size);
		      }
		    }
		    return this;
		  };

		  // Phase 1: All moves are valid
		  allMoves1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

		  // The list of next valid phase 1 moves when the given face was turned
		  // in the last move
		  nextMoves1 = (function() {
		    var face, lastFace, m, next, o, p, power, results;
		    results = [];
		    for (lastFace = m = 0; m <= 5; lastFace = ++m) {
		      next = [];
		// Don't allow commuting moves, e.g. U U'. Also make sure that
		// opposite faces are always moved in the same order, i.e. allow
		// U D but no D U. This avoids sequences like U D U'.
		      for (face = o = 0; o <= 5; face = ++o) {
		        if (face !== lastFace && face !== lastFace - 3) {
		// single, double or inverse move
		          for (power = p = 0; p <= 2; power = ++p) {
		            next.push(face * 3 + power);
		          }
		        }
		      }
		      results.push(next);
		    }
		    return results;
		  })();

		  // Phase 2: Double moves of all faces plus quarter moves of U and D
		  allMoves2 = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

		  nextMoves2 = (function() {
		    var face, lastFace, len, m, next, o, p, power, powers, results;
		    results = [];
		    for (lastFace = m = 0; m <= 5; lastFace = ++m) {
		      next = [];
		      for (face = o = 0; o <= 5; face = ++o) {
		        if (!(face !== lastFace && face !== lastFace - 3)) {
		          continue;
		        }
		        // Allow all moves of U and D and double moves of others
		        powers = face === 0 || face === 3 ? [0, 1, 2] : [1];
		        for (p = 0, len = powers.length; p < len; p++) {
		          power = powers[p];
		          next.push(face * 3 + power);
		        }
		      }
		      results.push(next);
		    }
		    return results;
		  })();

		  // 8 values are encoded in one number
		  pruning = function(table, index, value) {
		    var pos, shift, slot;
		    pos = index % 8;
		    slot = index >> 3;
		    shift = pos << 2;
		    if (value != null) {
		      // Set
		      table[slot] &= ~(0xF << shift);
		      table[slot] |= value << shift;
		      return value;
		    } else {
		      // Get
		      return (table[slot] & (0xF << shift)) >>> shift;
		    }
		  };

		  computePruningTable = function(phase, size, currentCoords, nextIndex) {
		    var current, depth, done, index, len, m, move, moves, next, o, ref, table;
		    // Initialize all values to 0xF
		    table = (function() {
		      var m, ref, results;
		      results = [];
		      for (m = 0, ref = Math.ceil(size / 8) - 1; (0 <= ref ? m <= ref : m >= ref); 0 <= ref ? ++m : --m) {
		        results.push(0xFFFFFFFF);
		      }
		      return results;
		    })();
		    if (phase === 1) {
		      moves = allMoves1;
		    } else {
		      moves = allMoves2;
		    }
		    depth = 0;
		    pruning(table, 0, depth);
		    done = 1;
		    // In each iteration, take each state found in the previous depth and
		    // compute the next state. Stop when all states have been assigned a
		    // depth.
		    while (done !== size) {
		      for (index = m = 0, ref = size - 1; (0 <= ref ? m <= ref : m >= ref); index = 0 <= ref ? ++m : --m) {
		        if (!(pruning(table, index) === depth)) {
		          continue;
		        }
		        current = currentCoords(index);
		        for (o = 0, len = moves.length; o < len; o++) {
		          move = moves[o];
		          next = nextIndex(current, move);
		          if (pruning(table, next) === 0xF) {
		            pruning(table, next, depth + 1);
		            done++;
		          }
		        }
		      }
		      depth++;
		    }
		    return table;
		  };

		  Cube.pruningTables = {
		    sliceTwist: null,
		    sliceFlip: null,
		    sliceURFtoDLFParity: null,
		    sliceURtoDFParity: null
		  };

		  pruningTableParams = {
		    // name: [phase, size, currentCoords, nextIndex]
		    sliceTwist: [
		      1,
		      N_SLICE1 * N_TWIST,
		      function(index) {
		        return [index % N_SLICE1,
		      index / N_SLICE1 | 0];
		      },
		      function(current,
		      move) {
		        var newSlice,
		      newTwist,
		      slice,
		      twist;
		        [slice,
		      twist] = current;
		        newSlice = Cube.moveTables.FRtoBR[slice * 24][move] / 24 | 0;
		        newTwist = Cube.moveTables.twist[twist][move];
		        return newTwist * N_SLICE1 + newSlice;
		      }
		    ],
		    sliceFlip: [
		      1,
		      N_SLICE1 * N_FLIP,
		      function(index) {
		        return [index % N_SLICE1,
		      index / N_SLICE1 | 0];
		      },
		      function(current,
		      move) {
		        var flip,
		      newFlip,
		      newSlice,
		      slice;
		        [slice,
		      flip] = current;
		        newSlice = Cube.moveTables.FRtoBR[slice * 24][move] / 24 | 0;
		        newFlip = Cube.moveTables.flip[flip][move];
		        return newFlip * N_SLICE1 + newSlice;
		      }
		    ],
		    sliceURFtoDLFParity: [
		      2,
		      N_SLICE2 * N_URFtoDLF * N_PARITY,
		      function(index) {
		        return [index % 2,
		      (index / 2 | 0) % N_SLICE2,
		      (index / 2 | 0) / N_SLICE2 | 0];
		      },
		      function(current,
		      move) {
		        var URFtoDLF,
		      newParity,
		      newSlice,
		      newURFtoDLF,
		      parity,
		      slice;
		        [parity,
		      slice,
		      URFtoDLF] = current;
		        newParity = Cube.moveTables.parity[parity][move];
		        newSlice = Cube.moveTables.FRtoBR[slice][move];
		        newURFtoDLF = Cube.moveTables.URFtoDLF[URFtoDLF][move];
		        return (newURFtoDLF * N_SLICE2 + newSlice) * 2 + newParity;
		      }
		    ],
		    sliceURtoDFParity: [
		      2,
		      N_SLICE2 * N_URtoDF * N_PARITY,
		      function(index) {
		        return [index % 2,
		      (index / 2 | 0) % N_SLICE2,
		      (index / 2 | 0) / N_SLICE2 | 0];
		      },
		      function(current,
		      move) {
		        var URtoDF,
		      newParity,
		      newSlice,
		      newURtoDF,
		      parity,
		      slice;
		        [parity,
		      slice,
		      URtoDF] = current;
		        newParity = Cube.moveTables.parity[parity][move];
		        newSlice = Cube.moveTables.FRtoBR[slice][move];
		        newURtoDF = Cube.moveTables.URtoDF[URtoDF][move];
		        return (newURtoDF * N_SLICE2 + newSlice) * 2 + newParity;
		      }
		    ]
		  };

		  Cube.computePruningTables = function(...tables) {
		    var len, m, name, params, tableName;
		    if (tables.length === 0) {
		      tables = (function() {
		        var results;
		        results = [];
		        for (name in pruningTableParams) {
		          results.push(name);
		        }
		        return results;
		      })();
		    }
		    for (m = 0, len = tables.length; m < len; m++) {
		      tableName = tables[m];
		      if (this.pruningTables[tableName] !== null) {
		        // Already computed
		        continue;
		      }
		      params = pruningTableParams[tableName];
		      this.pruningTables[tableName] = computePruningTable(...params);
		    }
		    return this;
		  };

		  Cube.initSolver = function() {
		    Cube.computeMoveTables();
		    return Cube.computePruningTables();
		  };

		  Cube.prototype.solveUpright = function(maxDepth = 22) {
		    var State, freeStates, moveNames, phase1, phase1search, phase2, phase2search, solution, state;
		    // Names for all moves, i.e. U, U2, U', F, F2, ...
		    moveNames = (function() {
		      var face, faceName, m, o, power, powerName, result;
		      faceName = ['U', 'R', 'F', 'D', 'L', 'B'];
		      powerName = ['', '2', "'"];
		      result = [];
		      for (face = m = 0; m <= 5; face = ++m) {
		        for (power = o = 0; o <= 2; power = ++o) {
		          result.push(faceName[face] + powerName[power]);
		        }
		      }
		      return result;
		    })();
		    State = class State {
		      constructor(cube) {
		        this.parent = null;
		        this.lastMove = null;
		        this.depth = 0;
		        if (cube) {
		          this.init(cube);
		        }
		      }

		      init(cube) {
		        // Phase 1 coordinates
		        this.flip = cube.flip();
		        this.twist = cube.twist();
		        this.slice = cube.FRtoBR() / N_SLICE2 | 0;
		        // Phase 2 coordinates
		        this.parity = cube.cornerParity();
		        this.URFtoDLF = cube.URFtoDLF();
		        this.FRtoBR = cube.FRtoBR();
		        // These are later merged to URtoDF when phase 2 begins
		        this.URtoUL = cube.URtoUL();
		        this.UBtoDF = cube.UBtoDF();
		        return this;
		      }

		      solution() {
		        if (this.parent) {
		          return this.parent.solution() + moveNames[this.lastMove] + ' ';
		        } else {
		          return '';
		        }
		      }

		      //# Helpers
		      move(table, index, move) {
		        return Cube.moveTables[table][index][move];
		      }

		      pruning(table, index) {
		        return pruning(Cube.pruningTables[table], index);
		      }

		      //# Phase 1

		      // Return the next valid phase 1 moves for this state
		      moves1() {
		        if (this.lastMove !== null) {
		          return nextMoves1[this.lastMove / 3 | 0];
		        } else {
		          return allMoves1;
		        }
		      }

		      // Compute the minimum number of moves to the end of phase 1
		      minDist1() {
		        var d1, d2;
		        // The maximum number of moves to the end of phase 1 wrt. the
		        // combination flip and slice coordinates only
		        d1 = this.pruning('sliceFlip', N_SLICE1 * this.flip + this.slice);
		        // The combination of twist and slice coordinates
		        d2 = this.pruning('sliceTwist', N_SLICE1 * this.twist + this.slice);
		        // The true minimal distance is the maximum of these two
		        return max(d1, d2);
		      }

		      // Compute the next phase 1 state for the given move
		      next1(move) {
		        var next;
		        next = freeStates.pop();
		        next.parent = this;
		        next.lastMove = move;
		        next.depth = this.depth + 1;
		        next.flip = this.move('flip', this.flip, move);
		        next.twist = this.move('twist', this.twist, move);
		        next.slice = this.move('FRtoBR', this.slice * 24, move) / 24 | 0;
		        return next;
		      }

		      //# Phase 2

		      // Return the next valid phase 2 moves for this state
		      moves2() {
		        if (this.lastMove !== null) {
		          return nextMoves2[this.lastMove / 3 | 0];
		        } else {
		          return allMoves2;
		        }
		      }

		      // Compute the minimum number of moves to the solved cube
		      minDist2() {
		        var d1, d2, index1, index2;
		        index1 = (N_SLICE2 * this.URtoDF + this.FRtoBR) * N_PARITY + this.parity;
		        d1 = this.pruning('sliceURtoDFParity', index1);
		        index2 = (N_SLICE2 * this.URFtoDLF + this.FRtoBR) * N_PARITY + this.parity;
		        d2 = this.pruning('sliceURFtoDLFParity', index2);
		        return max(d1, d2);
		      }

		      // Initialize phase 2 coordinates
		      init2(top = true) {
		        if (this.parent === null) {
		          return;
		        }
		        // For other states, the phase 2 state is computed based on
		        // parent's state.
		        // Already assigned for the initial state
		        this.parent.init2(false);
		        this.URFtoDLF = this.move('URFtoDLF', this.parent.URFtoDLF, this.lastMove);
		        this.FRtoBR = this.move('FRtoBR', this.parent.FRtoBR, this.lastMove);
		        this.parity = this.move('parity', this.parent.parity, this.lastMove);
		        this.URtoUL = this.move('URtoUL', this.parent.URtoUL, this.lastMove);
		        this.UBtoDF = this.move('UBtoDF', this.parent.UBtoDF, this.lastMove);
		        if (top) {
		          // This is the initial phase 2 state. Get the URtoDF coordinate
		          // by merging URtoUL and UBtoDF
		          return this.URtoDF = this.move('mergeURtoDF', this.URtoUL, this.UBtoDF);
		        }
		      }

		      // Compute the next phase 2 state for the given move
		      next2(move) {
		        var next;
		        next = freeStates.pop();
		        next.parent = this;
		        next.lastMove = move;
		        next.depth = this.depth + 1;
		        next.URFtoDLF = this.move('URFtoDLF', this.URFtoDLF, move);
		        next.FRtoBR = this.move('FRtoBR', this.FRtoBR, move);
		        next.parity = this.move('parity', this.parity, move);
		        next.URtoDF = this.move('URtoDF', this.URtoDF, move);
		        return next;
		      }

		    };
		    solution = null;
		    phase1search = function(state) {
		      var depth, m, ref, results;
		      depth = 0;
		      results = [];
		      for (depth = m = 1, ref = maxDepth; (1 <= ref ? m <= ref : m >= ref); depth = 1 <= ref ? ++m : --m) {
		        phase1(state, depth);
		        if (solution !== null) {
		          break;
		        }
		        results.push(depth++);
		      }
		      return results;
		    };
		    phase1 = function(state, depth) {
		      var len, m, move, next, ref, ref1, results;
		      if (depth === 0) {
		        if (state.minDist1() === 0) {
		          // Make sure we don't start phase 2 with a phase 2 move as the
		          // last move in phase 1, because phase 2 would then repeat the
		          // same move.
		          if (state.lastMove === null || (ref = state.lastMove, indexOf.call(allMoves2, ref) < 0)) {
		            return phase2search(state);
		          }
		        }
		      } else if (depth > 0) {
		        if (state.minDist1() <= depth) {
		          ref1 = state.moves1();
		          results = [];
		          for (m = 0, len = ref1.length; m < len; m++) {
		            move = ref1[m];
		            next = state.next1(move);
		            phase1(next, depth - 1);
		            freeStates.push(next);
		            if (solution !== null) {
		              break;
		            } else {
		              results.push(void 0);
		            }
		          }
		          return results;
		        }
		      }
		    };
		    phase2search = function(state) {
		      var depth, m, ref, results;
		      // Initialize phase 2 coordinates
		      state.init2();
		      results = [];
		      for (depth = m = 1, ref = maxDepth - state.depth; (1 <= ref ? m <= ref : m >= ref); depth = 1 <= ref ? ++m : --m) {
		        phase2(state, depth);
		        if (solution !== null) {
		          break;
		        }
		        results.push(depth++);
		      }
		      return results;
		    };
		    phase2 = function(state, depth) {
		      var len, m, move, next, ref, results;
		      if (depth === 0) {
		        if (state.minDist2() === 0) {
		          return solution = state.solution();
		        }
		      } else if (depth > 0) {
		        if (state.minDist2() <= depth) {
		          ref = state.moves2();
		          results = [];
		          for (m = 0, len = ref.length; m < len; m++) {
		            move = ref[m];
		            next = state.next2(move);
		            phase2(next, depth - 1);
		            freeStates.push(next);
		            if (solution !== null) {
		              break;
		            } else {
		              results.push(void 0);
		            }
		          }
		          return results;
		        }
		      }
		    };
		    freeStates = (function() {
		      var m, ref, results;
		      results = [];
		      for (m = 0, ref = maxDepth + 1; (0 <= ref ? m <= ref : m >= ref); 0 <= ref ? ++m : --m) {
		        results.push(new State);
		      }
		      return results;
		    })();
		    state = freeStates.pop().init(this);
		    phase1search(state);
		    freeStates.push(state);
		    // Trim the trailing space
		    if (solution.length > 0) {
		      solution = solution.substring(0, solution.length - 1);
		    }
		    return solution;
		  };

		  faceNums = {
		    U: 0,
		    R: 1,
		    F: 2,
		    D: 3,
		    L: 4,
		    B: 5
		  };

		  faceNames = {
		    0: 'U',
		    1: 'R',
		    2: 'F',
		    3: 'D',
		    4: 'L',
		    5: 'B'
		  };

		  Cube.prototype.solve = function(maxDepth = 22) {
		    var clone, len, m, move, ref, rotation, solution, upright, uprightSolution;
		    clone = this.clone();
		    upright = clone.upright();
		    clone.move(upright);
		    rotation = new Cube().move(upright).center;
		    uprightSolution = clone.solveUpright(maxDepth);
		    solution = [];
		    ref = uprightSolution.split(' ');
		    for (m = 0, len = ref.length; m < len; m++) {
		      move = ref[m];
		      solution.push(faceNames[rotation[faceNums[move[0]]]]);
		      if (move.length > 1) {
		        solution[solution.length - 1] += move[1];
		      }
		    }
		    return solution.join(' ');
		  };

		  Cube.scramble = function() {
		    return Cube.inverse(Cube.random().solve());
		  };

		}).call(solve);
		return solve;
	}

	var cubejs;
	var hasRequiredCubejs;

	function requireCubejs () {
		if (hasRequiredCubejs) return cubejs;
		hasRequiredCubejs = 1;
		cubejs = requireCube();
		requireSolve();
		return cubejs;
	}

	var cubejsExports = requireCubejs();
	var Cube = /*@__PURE__*/getDefaultExportFromCjs(cubejsExports);

	var WorkerClass = null;

	try {
	    var WorkerThreads =
	        typeof module !== 'undefined' && typeof module.require === 'function' && module.require('worker_threads') ||
	        typeof __non_webpack_require__ === 'function' && __non_webpack_require__('worker_threads') ||
	        typeof require === 'function' && require('worker_threads');
	    WorkerClass = WorkerThreads.Worker;
	} catch(e) {} // eslint-disable-line

	function decodeBase64$1(base64, enableUnicode) {
	    return Buffer.from(base64, 'base64').toString('utf8');
	}

	function createBase64WorkerFactory$2(base64, sourcemapArg, enableUnicodeArg) {
	    var source = decodeBase64$1(base64);
	    var start = source.indexOf('\n', 10) + 1;
	    var body = source.substring(start) + ('');
	    return function WorkerFactory(options) {
	        return new WorkerClass(body, Object.assign({}, options, { eval: true }));
	    };
	}

	function decodeBase64(base64, enableUnicode) {
	    var binaryString = atob(base64);
	    return binaryString;
	}

	function createURL(base64, sourcemapArg, enableUnicodeArg) {
	    var source = decodeBase64(base64);
	    var start = source.indexOf('\n', 10) + 1;
	    var body = source.substring(start) + ('');
	    var blob = new Blob([body], { type: 'application/javascript' });
	    return URL.createObjectURL(blob);
	}

	function createBase64WorkerFactory$1(base64, sourcemapArg, enableUnicodeArg) {
	    var url;
	    return function WorkerFactory(options) {
	        url = url || createURL(base64);
	        return new Worker(url, options);
	    };
	}

	var kIsNodeJS = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';

	function isNodeJS() {
	    return kIsNodeJS;
	}

	function createBase64WorkerFactory(base64, sourcemapArg, enableUnicodeArg) {
	    if (isNodeJS()) {
	        return createBase64WorkerFactory$2(base64);
	    }
	    return createBase64WorkerFactory$1(base64);
	}

	var WorkerFactory = /*#__PURE__*/createBase64WorkerFactory('Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwooZnVuY3Rpb24gKCkgewoJJ3VzZSBzdHJpY3QnOwoKCWZ1bmN0aW9uIGdldERlZmF1bHRFeHBvcnRGcm9tQ2pzICh4KSB7CgkJcmV0dXJuIHggJiYgeC5fX2VzTW9kdWxlICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh4LCAnZGVmYXVsdCcpID8geFsnZGVmYXVsdCddIDogeDsKCX0KCgl2YXIgY3ViZSQxID0ge2V4cG9ydHM6IHt9fTsKCgl2YXIgY3ViZSA9IGN1YmUkMS5leHBvcnRzOwoKCXZhciBoYXNSZXF1aXJlZEN1YmU7CgoJZnVuY3Rpb24gcmVxdWlyZUN1YmUgKCkgewoJCWlmIChoYXNSZXF1aXJlZEN1YmUpIHJldHVybiBjdWJlJDEuZXhwb3J0czsKCQloYXNSZXF1aXJlZEN1YmUgPSAxOwoJCShmdW5jdGlvbiAobW9kdWxlKSB7CgkJCShmdW5jdGlvbigpIHsKCQkJICAvLyBDZW50ZXJzCgkJCSAgdmFyIEIsIEJMLCBCUiwgQ3ViZSwgRCwgREIsIERCTCwgREYsIERGUiwgREwsIERMRiwgRFIsIERSQiwgRiwgRkwsIEZSLCBMLCBSLCBVLCBVQiwgVUJSLCBVRiwgVUZMLCBVTCwgVUxCLCBVUiwgVVJGLCBjZW50ZXJDb2xvciwgY2VudGVyRmFjZWxldCwgY29ybmVyQ29sb3IsIGNvcm5lckZhY2VsZXQsIGVkZ2VDb2xvciwgZWRnZUZhY2VsZXQ7CgoJCQkgIFtVLCBSLCBGLCBELCBMLCBCXSA9IFswLCAxLCAyLCAzLCA0LCA1XTsKCgkJCSAgLy8gQ29ybmVycwoJCQkgIFtVUkYsIFVGTCwgVUxCLCBVQlIsIERGUiwgRExGLCBEQkwsIERSQl0gPSBbMCwgMSwgMiwgMywgNCwgNSwgNiwgN107CgoJCQkgIC8vIEVkZ2VzCgkJCSAgW1VSLCBVRiwgVUwsIFVCLCBEUiwgREYsIERMLCBEQiwgRlIsIEZMLCBCTCwgQlJdID0gWzAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMV07CgoJCQkgIFtjZW50ZXJGYWNlbGV0LCBjb3JuZXJGYWNlbGV0LCBlZGdlRmFjZWxldF0gPSAoZnVuY3Rpb24oKSB7CgkJCSAgICB2YXIgX0IsIF9ELCBfRiwgX0wsIF9SLCBfVTsKCQkJICAgIF9VID0gZnVuY3Rpb24oeCkgewoJCQkgICAgICByZXR1cm4geCAtIDE7CgkJCSAgICB9OwoJCQkgICAgX1IgPSBmdW5jdGlvbih4KSB7CgkJCSAgICAgIHJldHVybiBfVSg5KSArIHg7CgkJCSAgICB9OwoJCQkgICAgX0YgPSBmdW5jdGlvbih4KSB7CgkJCSAgICAgIHJldHVybiBfUig5KSArIHg7CgkJCSAgICB9OwoJCQkgICAgX0QgPSBmdW5jdGlvbih4KSB7CgkJCSAgICAgIHJldHVybiBfRig5KSArIHg7CgkJCSAgICB9OwoJCQkgICAgX0wgPSBmdW5jdGlvbih4KSB7CgkJCSAgICAgIHJldHVybiBfRCg5KSArIHg7CgkJCSAgICB9OwoJCQkgICAgX0IgPSBmdW5jdGlvbih4KSB7CgkJCSAgICAgIHJldHVybiBfTCg5KSArIHg7CgkJCSAgICB9OwoJCQkgICAgcmV0dXJuIFsKCQkJICAgICAgLy8gQ2VudGVycwoJCQkgICAgICBbNCwKCQkJICAgICAgMTMsCgkJCSAgICAgIDIyLAoJCQkgICAgICAzMSwKCQkJICAgICAgNDAsCgkJCSAgICAgIDQ5XSwKCQkJICAgICAgLy8gQ29ybmVycwoJCQkgICAgICBbW19VKDkpLAoJCQkgICAgICBfUigxKSwKCQkJICAgICAgX0YoMyldLAoJCQkgICAgICBbX1UoNyksCgkJCSAgICAgIF9GKDEpLAoJCQkgICAgICBfTCgzKV0sCgkJCSAgICAgIFtfVSgxKSwKCQkJICAgICAgX0woMSksCgkJCSAgICAgIF9CKDMpXSwKCQkJICAgICAgW19VKDMpLAoJCQkgICAgICBfQigxKSwKCQkJICAgICAgX1IoMyldLAoJCQkgICAgICBbX0QoMyksCgkJCSAgICAgIF9GKDkpLAoJCQkgICAgICBfUig3KV0sCgkJCSAgICAgIFtfRCgxKSwKCQkJICAgICAgX0woOSksCgkJCSAgICAgIF9GKDcpXSwKCQkJICAgICAgW19EKDcpLAoJCQkgICAgICBfQig5KSwKCQkJICAgICAgX0woNyldLAoJCQkgICAgICBbX0QoOSksCgkJCSAgICAgIF9SKDkpLAoJCQkgICAgICBfQig3KV1dLAoJCQkgICAgICAvLyBFZGdlcwoJCQkgICAgICBbW19VKDYpLAoJCQkgICAgICBfUigyKV0sCgkJCSAgICAgIFtfVSg4KSwKCQkJICAgICAgX0YoMildLAoJCQkgICAgICBbX1UoNCksCgkJCSAgICAgIF9MKDIpXSwKCQkJICAgICAgW19VKDIpLAoJCQkgICAgICBfQigyKV0sCgkJCSAgICAgIFtfRCg2KSwKCQkJICAgICAgX1IoOCldLAoJCQkgICAgICBbX0QoMiksCgkJCSAgICAgIF9GKDgpXSwKCQkJICAgICAgW19EKDQpLAoJCQkgICAgICBfTCg4KV0sCgkJCSAgICAgIFtfRCg4KSwKCQkJICAgICAgX0IoOCldLAoJCQkgICAgICBbX0YoNiksCgkJCSAgICAgIF9SKDQpXSwKCQkJICAgICAgW19GKDQpLAoJCQkgICAgICBfTCg2KV0sCgkJCSAgICAgIFtfQig2KSwKCQkJICAgICAgX0woNCldLAoJCQkgICAgICBbX0IoNCksCgkJCSAgICAgIF9SKDYpXV0KCQkJICAgIF07CgkJCSAgfSkoKTsKCgkJCSAgY2VudGVyQ29sb3IgPSBbJ1UnLCAnUicsICdGJywgJ0QnLCAnTCcsICdCJ107CgoJCQkgIGNvcm5lckNvbG9yID0gW1snVScsICdSJywgJ0YnXSwgWydVJywgJ0YnLCAnTCddLCBbJ1UnLCAnTCcsICdCJ10sIFsnVScsICdCJywgJ1InXSwgWydEJywgJ0YnLCAnUiddLCBbJ0QnLCAnTCcsICdGJ10sIFsnRCcsICdCJywgJ0wnXSwgWydEJywgJ1InLCAnQiddXTsKCgkJCSAgZWRnZUNvbG9yID0gW1snVScsICdSJ10sIFsnVScsICdGJ10sIFsnVScsICdMJ10sIFsnVScsICdCJ10sIFsnRCcsICdSJ10sIFsnRCcsICdGJ10sIFsnRCcsICdMJ10sIFsnRCcsICdCJ10sIFsnRicsICdSJ10sIFsnRicsICdMJ10sIFsnQicsICdMJ10sIFsnQicsICdSJ11dOwoKCQkJICBDdWJlID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgdmFyIGZhY2VOYW1lcywgZmFjZU51bXMsIHBhcnNlQWxnOwoKCQkJICAgIGNsYXNzIEN1YmUgewoJCQkgICAgICBjb25zdHJ1Y3RvcihvdGhlcikgewoJCQkgICAgICAgIGlmIChvdGhlciAhPSBudWxsKSB7CgkJCSAgICAgICAgICB0aGlzLmluaXQob3RoZXIpOwoJCQkgICAgICAgIH0gZWxzZSB7CgkJCSAgICAgICAgICB0aGlzLmlkZW50aXR5KCk7CgkJCSAgICAgICAgfQoJCQkgICAgICAgIC8vIEZvciBtb3ZlcyB0byBhdm9pZCBhbGxvY2F0aW5nIG5ldyBvYmplY3RzIGVhY2ggdGltZQoJCQkgICAgICAgIHRoaXMubmV3Q2VudGVyID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgICAgICAgdmFyIGssIHJlc3VsdHM7CgkJCSAgICAgICAgICByZXN1bHRzID0gW107CgkJCSAgICAgICAgICBmb3IgKGsgPSAwOyBrIDw9IDU7ICsraykgewoJCQkgICAgICAgICAgICByZXN1bHRzLnB1c2goMCk7CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgICByZXR1cm4gcmVzdWx0czsKCQkJICAgICAgICB9KSgpOwoJCQkgICAgICAgIHRoaXMubmV3Q3AgPSAoZnVuY3Rpb24oKSB7CgkJCSAgICAgICAgICB2YXIgaywgcmVzdWx0czsKCQkJICAgICAgICAgIHJlc3VsdHMgPSBbXTsKCQkJICAgICAgICAgIGZvciAoayA9IDA7IGsgPD0gNzsgKytrKSB7CgkJCSAgICAgICAgICAgIHJlc3VsdHMucHVzaCgwKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIHJldHVybiByZXN1bHRzOwoJCQkgICAgICAgIH0pKCk7CgkJCSAgICAgICAgdGhpcy5uZXdFcCA9IChmdW5jdGlvbigpIHsKCQkJICAgICAgICAgIHZhciBrLCByZXN1bHRzOwoJCQkgICAgICAgICAgcmVzdWx0cyA9IFtdOwoJCQkgICAgICAgICAgZm9yIChrID0gMDsgayA8PSAxMTsgKytrKSB7CgkJCSAgICAgICAgICAgIHJlc3VsdHMucHVzaCgwKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIHJldHVybiByZXN1bHRzOwoJCQkgICAgICAgIH0pKCk7CgkJCSAgICAgICAgdGhpcy5uZXdDbyA9IChmdW5jdGlvbigpIHsKCQkJICAgICAgICAgIHZhciBrLCByZXN1bHRzOwoJCQkgICAgICAgICAgcmVzdWx0cyA9IFtdOwoJCQkgICAgICAgICAgZm9yIChrID0gMDsgayA8PSA3OyArK2spIHsKCQkJICAgICAgICAgICAgcmVzdWx0cy5wdXNoKDApOwoJCQkgICAgICAgICAgfQoJCQkgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7CgkJCSAgICAgICAgfSkoKTsKCQkJICAgICAgICB0aGlzLm5ld0VvID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgICAgICAgdmFyIGssIHJlc3VsdHM7CgkJCSAgICAgICAgICByZXN1bHRzID0gW107CgkJCSAgICAgICAgICBmb3IgKGsgPSAwOyBrIDw9IDExOyArK2spIHsKCQkJICAgICAgICAgICAgcmVzdWx0cy5wdXNoKDApOwoJCQkgICAgICAgICAgfQoJCQkgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7CgkJCSAgICAgICAgfSkoKTsKCQkJICAgICAgfQoKCQkJICAgICAgaW5pdChzdGF0ZSkgewoJCQkgICAgICAgIHRoaXMuY2VudGVyID0gc3RhdGUuY2VudGVyLnNsaWNlKDApOwoJCQkgICAgICAgIHRoaXMuY28gPSBzdGF0ZS5jby5zbGljZSgwKTsKCQkJICAgICAgICB0aGlzLmVwID0gc3RhdGUuZXAuc2xpY2UoMCk7CgkJCSAgICAgICAgdGhpcy5jcCA9IHN0YXRlLmNwLnNsaWNlKDApOwoJCQkgICAgICAgIHJldHVybiB0aGlzLmVvID0gc3RhdGUuZW8uc2xpY2UoMCk7CgkJCSAgICAgIH0KCgkJCSAgICAgIGlkZW50aXR5KCkgewoJCQkgICAgICAgIC8vIEluaXRpYWxpemUgdG8gdGhlIGlkZW50aXR5IGN1YmUKCQkJICAgICAgICB0aGlzLmNlbnRlciA9IFswLCAxLCAyLCAzLCA0LCA1XTsKCQkJICAgICAgICB0aGlzLmNwID0gWzAsIDEsIDIsIDMsIDQsIDUsIDYsIDddOwoJCQkgICAgICAgIHRoaXMuY28gPSAoZnVuY3Rpb24oKSB7CgkJCSAgICAgICAgICB2YXIgaywgcmVzdWx0czsKCQkJICAgICAgICAgIHJlc3VsdHMgPSBbXTsKCQkJICAgICAgICAgIGZvciAoayA9IDA7IGsgPD0gNzsgKytrKSB7CgkJCSAgICAgICAgICAgIHJlc3VsdHMucHVzaCgwKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIHJldHVybiByZXN1bHRzOwoJCQkgICAgICAgIH0pKCk7CgkJCSAgICAgICAgdGhpcy5lcCA9IFswLCAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgMTFdOwoJCQkgICAgICAgIHJldHVybiB0aGlzLmVvID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgICAgICAgdmFyIGssIHJlc3VsdHM7CgkJCSAgICAgICAgICByZXN1bHRzID0gW107CgkJCSAgICAgICAgICBmb3IgKGsgPSAwOyBrIDw9IDExOyArK2spIHsKCQkJICAgICAgICAgICAgcmVzdWx0cy5wdXNoKDApOwoJCQkgICAgICAgICAgfQoJCQkgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7CgkJCSAgICAgICAgfSkoKTsKCQkJICAgICAgfQoKCQkJICAgICAgdG9KU09OKCkgewoJCQkgICAgICAgIHJldHVybiB7CgkJCSAgICAgICAgICBjZW50ZXI6IHRoaXMuY2VudGVyLAoJCQkgICAgICAgICAgY3A6IHRoaXMuY3AsCgkJCSAgICAgICAgICBjbzogdGhpcy5jbywKCQkJICAgICAgICAgIGVwOiB0aGlzLmVwLAoJCQkgICAgICAgICAgZW86IHRoaXMuZW8KCQkJICAgICAgICB9OwoJCQkgICAgICB9CgoJCQkgICAgICBhc1N0cmluZygpIHsKCQkJICAgICAgICB2YXIgY29ybmVyLCBlZGdlLCBpLCBrLCBsLCBtLCBuLCBvLCBvcmksIHAsIHJlc3VsdDsKCQkJICAgICAgICByZXN1bHQgPSBbXTsKCQkJICAgICAgICBmb3IgKGkgPSBrID0gMDsgayA8PSA1OyBpID0gKytrKSB7CgkJCSAgICAgICAgICByZXN1bHRbOSAqIGkgKyA0XSA9IGNlbnRlckNvbG9yW3RoaXMuY2VudGVyW2ldXTsKCQkJICAgICAgICB9CgkJCSAgICAgICAgZm9yIChpID0gbCA9IDA7IGwgPD0gNzsgaSA9ICsrbCkgewoJCQkgICAgICAgICAgY29ybmVyID0gdGhpcy5jcFtpXTsKCQkJICAgICAgICAgIG9yaSA9IHRoaXMuY29baV07CgkJCSAgICAgICAgICBmb3IgKG4gPSBtID0gMDsgbSA8PSAyOyBuID0gKyttKSB7CgkJCSAgICAgICAgICAgIHJlc3VsdFtjb3JuZXJGYWNlbGV0W2ldWyhuICsgb3JpKSAlIDNdXSA9IGNvcm5lckNvbG9yW2Nvcm5lcl1bbl07CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgfQoJCQkgICAgICAgIGZvciAoaSA9IG8gPSAwOyBvIDw9IDExOyBpID0gKytvKSB7CgkJCSAgICAgICAgICBlZGdlID0gdGhpcy5lcFtpXTsKCQkJICAgICAgICAgIG9yaSA9IHRoaXMuZW9baV07CgkJCSAgICAgICAgICBmb3IgKG4gPSBwID0gMDsgcCA8PSAxOyBuID0gKytwKSB7CgkJCSAgICAgICAgICAgIHJlc3VsdFtlZGdlRmFjZWxldFtpXVsobiArIG9yaSkgJSAyXV0gPSBlZGdlQ29sb3JbZWRnZV1bbl07CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgfQoJCQkgICAgICAgIHJldHVybiByZXN1bHQuam9pbignJyk7CgkJCSAgICAgIH0KCgkJCSAgICAgIHN0YXRpYyBmcm9tU3RyaW5nKHN0cikgewoJCQkgICAgICAgIHZhciBjb2wxLCBjb2wyLCBjdWJlLCBpLCBqLCBrLCBsLCBtLCBvLCBvcmksIHAsIHEsIHIsIHJlZjsKCQkJICAgICAgICBjdWJlID0gbmV3IEN1YmU7CgkJCSAgICAgICAgZm9yIChpID0gayA9IDA7IGsgPD0gNTsgaSA9ICsraykgewoJCQkgICAgICAgICAgZm9yIChqID0gbCA9IDA7IGwgPD0gNTsgaiA9ICsrbCkgewoJCQkgICAgICAgICAgICBpZiAoc3RyWzkgKiBpICsgNF0gPT09IGNlbnRlckNvbG9yW2pdKSB7CgkJCSAgICAgICAgICAgICAgY3ViZS5jZW50ZXJbaV0gPSBqOwoJCQkgICAgICAgICAgICB9CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgfQoJCQkgICAgICAgIGZvciAoaSA9IG0gPSAwOyBtIDw9IDc7IGkgPSArK20pIHsKCQkJICAgICAgICAgIGZvciAob3JpID0gbyA9IDA7IG8gPD0gMjsgb3JpID0gKytvKSB7CgkJCSAgICAgICAgICAgIGlmICgocmVmID0gc3RyW2Nvcm5lckZhY2VsZXRbaV1bb3JpXV0pID09PSAnVScgfHwgcmVmID09PSAnRCcpIHsKCQkJICAgICAgICAgICAgICBicmVhazsKCQkJICAgICAgICAgICAgfQoJCQkgICAgICAgICAgfQoJCQkgICAgICAgICAgY29sMSA9IHN0cltjb3JuZXJGYWNlbGV0W2ldWyhvcmkgKyAxKSAlIDNdXTsKCQkJICAgICAgICAgIGNvbDIgPSBzdHJbY29ybmVyRmFjZWxldFtpXVsob3JpICsgMikgJSAzXV07CgkJCSAgICAgICAgICBmb3IgKGogPSBwID0gMDsgcCA8PSA3OyBqID0gKytwKSB7CgkJCSAgICAgICAgICAgIGlmIChjb2wxID09PSBjb3JuZXJDb2xvcltqXVsxXSAmJiBjb2wyID09PSBjb3JuZXJDb2xvcltqXVsyXSkgewoJCQkgICAgICAgICAgICAgIGN1YmUuY3BbaV0gPSBqOwoJCQkgICAgICAgICAgICAgIGN1YmUuY29baV0gPSBvcmkgJSAzOwoJCQkgICAgICAgICAgICB9CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgfQoJCQkgICAgICAgIGZvciAoaSA9IHEgPSAwOyBxIDw9IDExOyBpID0gKytxKSB7CgkJCSAgICAgICAgICBmb3IgKGogPSByID0gMDsgciA8PSAxMTsgaiA9ICsrcikgewoJCQkgICAgICAgICAgICBpZiAoc3RyW2VkZ2VGYWNlbGV0W2ldWzBdXSA9PT0gZWRnZUNvbG9yW2pdWzBdICYmIHN0cltlZGdlRmFjZWxldFtpXVsxXV0gPT09IGVkZ2VDb2xvcltqXVsxXSkgewoJCQkgICAgICAgICAgICAgIGN1YmUuZXBbaV0gPSBqOwoJCQkgICAgICAgICAgICAgIGN1YmUuZW9baV0gPSAwOwoJCQkgICAgICAgICAgICAgIGJyZWFrOwoJCQkgICAgICAgICAgICB9CgkJCSAgICAgICAgICAgIGlmIChzdHJbZWRnZUZhY2VsZXRbaV1bMF1dID09PSBlZGdlQ29sb3Jbal1bMV0gJiYgc3RyW2VkZ2VGYWNlbGV0W2ldWzFdXSA9PT0gZWRnZUNvbG9yW2pdWzBdKSB7CgkJCSAgICAgICAgICAgICAgY3ViZS5lcFtpXSA9IGo7CgkJCSAgICAgICAgICAgICAgY3ViZS5lb1tpXSA9IDE7CgkJCSAgICAgICAgICAgICAgYnJlYWs7CgkJCSAgICAgICAgICAgIH0KCQkJICAgICAgICAgIH0KCQkJICAgICAgICB9CgkJCSAgICAgICAgcmV0dXJuIGN1YmU7CgkJCSAgICAgIH0KCgkJCSAgICAgIGNsb25lKCkgewoJCQkgICAgICAgIHJldHVybiBuZXcgQ3ViZSh0aGlzLnRvSlNPTigpKTsKCQkJICAgICAgfQoKCQkJICAgICAgLy8gQSBjbGFzcyBtZXRob2QgcmV0dXJuaW5nIGEgbmV3IHJhbmRvbSBjdWJlCgkJCSAgICAgIHN0YXRpYyByYW5kb20oKSB7CgkJCSAgICAgICAgcmV0dXJuIG5ldyBDdWJlKCkucmFuZG9taXplKCk7CgkJCSAgICAgIH0KCgkJCSAgICAgIGlzU29sdmVkKCkgewoJCQkgICAgICAgIHZhciBjLCBjZW50LCBjbG9uZSwgZSwgaywgbCwgbTsKCQkJICAgICAgICBjbG9uZSA9IHRoaXMuY2xvbmUoKTsKCQkJICAgICAgICBjbG9uZS5tb3ZlKGNsb25lLnVwcmlnaHQoKSk7CgkJCSAgICAgICAgZm9yIChjZW50ID0gayA9IDA7IGsgPD0gNTsgY2VudCA9ICsraykgewoJCQkgICAgICAgICAgaWYgKGNsb25lLmNlbnRlcltjZW50XSAhPT0gY2VudCkgewoJCQkgICAgICAgICAgICByZXR1cm4gZmFsc2U7CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgfQoJCQkgICAgICAgIGZvciAoYyA9IGwgPSAwOyBsIDw9IDc7IGMgPSArK2wpIHsKCQkJICAgICAgICAgIGlmIChjbG9uZS5jcFtjXSAhPT0gYykgewoJCQkgICAgICAgICAgICByZXR1cm4gZmFsc2U7CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgICBpZiAoY2xvbmUuY29bY10gIT09IDApIHsKCQkJICAgICAgICAgICAgcmV0dXJuIGZhbHNlOwoJCQkgICAgICAgICAgfQoJCQkgICAgICAgIH0KCQkJICAgICAgICBmb3IgKGUgPSBtID0gMDsgbSA8PSAxMTsgZSA9ICsrbSkgewoJCQkgICAgICAgICAgaWYgKGNsb25lLmVwW2VdICE9PSBlKSB7CgkJCSAgICAgICAgICAgIHJldHVybiBmYWxzZTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIGlmIChjbG9uZS5lb1tlXSAhPT0gMCkgewoJCQkgICAgICAgICAgICByZXR1cm4gZmFsc2U7CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgfQoJCQkgICAgICAgIHJldHVybiB0cnVlOwoJCQkgICAgICB9CgoJCQkgICAgICAvLyBNdWx0aXBseSB0aGlzIEN1YmUgd2l0aCBhbm90aGVyIEN1YmUsIHJlc3RyaWN0ZWQgdG8gY2VudGVycy4KCQkJICAgICAgY2VudGVyTXVsdGlwbHkob3RoZXIpIHsKCQkJICAgICAgICB2YXIgZnJvbSwgaywgdG87CgkJCSAgICAgICAgZm9yICh0byA9IGsgPSAwOyBrIDw9IDU7IHRvID0gKytrKSB7CgkJCSAgICAgICAgICBmcm9tID0gb3RoZXIuY2VudGVyW3RvXTsKCQkJICAgICAgICAgIHRoaXMubmV3Q2VudGVyW3RvXSA9IHRoaXMuY2VudGVyW2Zyb21dOwoJCQkgICAgICAgIH0KCQkJICAgICAgICBbdGhpcy5jZW50ZXIsIHRoaXMubmV3Q2VudGVyXSA9IFt0aGlzLm5ld0NlbnRlciwgdGhpcy5jZW50ZXJdOwoJCQkgICAgICAgIHJldHVybiB0aGlzOwoJCQkgICAgICB9CgoJCQkgICAgICAvLyBNdWx0aXBseSB0aGlzIEN1YmUgd2l0aCBhbm90aGVyIEN1YmUsIHJlc3RyaWN0ZWQgdG8gY29ybmVycy4KCQkJICAgICAgY29ybmVyTXVsdGlwbHkob3RoZXIpIHsKCQkJICAgICAgICB2YXIgZnJvbSwgaywgdG87CgkJCSAgICAgICAgZm9yICh0byA9IGsgPSAwOyBrIDw9IDc7IHRvID0gKytrKSB7CgkJCSAgICAgICAgICBmcm9tID0gb3RoZXIuY3BbdG9dOwoJCQkgICAgICAgICAgdGhpcy5uZXdDcFt0b10gPSB0aGlzLmNwW2Zyb21dOwoJCQkgICAgICAgICAgdGhpcy5uZXdDb1t0b10gPSAodGhpcy5jb1tmcm9tXSArIG90aGVyLmNvW3RvXSkgJSAzOwoJCQkgICAgICAgIH0KCQkJICAgICAgICBbdGhpcy5jcCwgdGhpcy5uZXdDcF0gPSBbdGhpcy5uZXdDcCwgdGhpcy5jcF07CgkJCSAgICAgICAgW3RoaXMuY28sIHRoaXMubmV3Q29dID0gW3RoaXMubmV3Q28sIHRoaXMuY29dOwoJCQkgICAgICAgIHJldHVybiB0aGlzOwoJCQkgICAgICB9CgoJCQkgICAgICAvLyBNdWx0aXBseSB0aGlzIEN1YmUgd2l0aCBhbm90aGVyIEN1YmUsIHJlc3RyaWN0ZWQgdG8gZWRnZXMKCQkJICAgICAgZWRnZU11bHRpcGx5KG90aGVyKSB7CgkJCSAgICAgICAgdmFyIGZyb20sIGssIHRvOwoJCQkgICAgICAgIGZvciAodG8gPSBrID0gMDsgayA8PSAxMTsgdG8gPSArK2spIHsKCQkJICAgICAgICAgIGZyb20gPSBvdGhlci5lcFt0b107CgkJCSAgICAgICAgICB0aGlzLm5ld0VwW3RvXSA9IHRoaXMuZXBbZnJvbV07CgkJCSAgICAgICAgICB0aGlzLm5ld0VvW3RvXSA9ICh0aGlzLmVvW2Zyb21dICsgb3RoZXIuZW9bdG9dKSAlIDI7CgkJCSAgICAgICAgfQoJCQkgICAgICAgIFt0aGlzLmVwLCB0aGlzLm5ld0VwXSA9IFt0aGlzLm5ld0VwLCB0aGlzLmVwXTsKCQkJICAgICAgICBbdGhpcy5lbywgdGhpcy5uZXdFb10gPSBbdGhpcy5uZXdFbywgdGhpcy5lb107CgkJCSAgICAgICAgcmV0dXJuIHRoaXM7CgkJCSAgICAgIH0KCgkJCSAgICAgIC8vIE11bHRpcGx5IHRoaXMgY3ViZSB3aXRoIGFub3RoZXIgQ3ViZQoJCQkgICAgICBtdWx0aXBseShvdGhlcikgewoJCQkgICAgICAgIHRoaXMuY2VudGVyTXVsdGlwbHkob3RoZXIpOwoJCQkgICAgICAgIHRoaXMuY29ybmVyTXVsdGlwbHkob3RoZXIpOwoJCQkgICAgICAgIHRoaXMuZWRnZU11bHRpcGx5KG90aGVyKTsKCQkJICAgICAgICByZXR1cm4gdGhpczsKCQkJICAgICAgfQoKCQkJICAgICAgbW92ZShhcmcpIHsKCQkJICAgICAgICB2YXIgZmFjZSwgaywgbCwgbGVuLCBtb3ZlLCBwb3dlciwgcmVmLCByZWYxOwoJCQkgICAgICAgIHJlZiA9IHBhcnNlQWxnKGFyZyk7CgkJCSAgICAgICAgZm9yIChrID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgayA8IGxlbjsgaysrKSB7CgkJCSAgICAgICAgICBtb3ZlID0gcmVmW2tdOwoJCQkgICAgICAgICAgZmFjZSA9IG1vdmUgLyAzIHwgMDsKCQkJICAgICAgICAgIHBvd2VyID0gbW92ZSAlIDM7CgkJCSAgICAgICAgICBmb3IgKGwgPSAwLCByZWYxID0gcG93ZXI7ICgwIDw9IHJlZjEgPyBsIDw9IHJlZjEgOiBsID49IHJlZjEpOyAwIDw9IHJlZjEgPyArK2wgOiAtLWwpIHsKCQkJICAgICAgICAgICAgdGhpcy5tdWx0aXBseShDdWJlLm1vdmVzW2ZhY2VdKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICB9CgkJCSAgICAgICAgcmV0dXJuIHRoaXM7CgkJCSAgICAgIH0KCgkJCSAgICAgIHVwcmlnaHQoKSB7CgkJCSAgICAgICAgdmFyIGNsb25lLCBpLCBqLCBrLCBsLCByZXN1bHQ7CgkJCSAgICAgICAgY2xvbmUgPSB0aGlzLmNsb25lKCk7CgkJCSAgICAgICAgcmVzdWx0ID0gW107CgkJCSAgICAgICAgZm9yIChpID0gayA9IDA7IGsgPD0gNTsgaSA9ICsraykgewoJCQkgICAgICAgICAgaWYgKGNsb25lLmNlbnRlcltpXSA9PT0gRikgewoJCQkgICAgICAgICAgICBicmVhazsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICB9CgkJCSAgICAgICAgc3dpdGNoIChpKSB7CgkJCSAgICAgICAgICBjYXNlIEQ6CgkJCSAgICAgICAgICAgIHJlc3VsdC5wdXNoKCJ4Iik7CgkJCSAgICAgICAgICAgIGJyZWFrOwoJCQkgICAgICAgICAgY2FzZSBVOgoJCQkgICAgICAgICAgICByZXN1bHQucHVzaCgieCciKTsKCQkJICAgICAgICAgICAgYnJlYWs7CgkJCSAgICAgICAgICBjYXNlIEI6CgkJCSAgICAgICAgICAgIHJlc3VsdC5wdXNoKCJ4MiIpOwoJCQkgICAgICAgICAgICBicmVhazsKCQkJICAgICAgICAgIGNhc2UgUjoKCQkJICAgICAgICAgICAgcmVzdWx0LnB1c2goInkiKTsKCQkJICAgICAgICAgICAgYnJlYWs7CgkJCSAgICAgICAgICBjYXNlIEw6CgkJCSAgICAgICAgICAgIHJlc3VsdC5wdXNoKCJ5JyIpOwoJCQkgICAgICAgIH0KCQkJICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCkgewoJCQkgICAgICAgICAgY2xvbmUubW92ZShyZXN1bHRbMF0pOwoJCQkgICAgICAgIH0KCQkJICAgICAgICBmb3IgKGogPSBsID0gMDsgbCA8PSA1OyBqID0gKytsKSB7CgkJCSAgICAgICAgICBpZiAoY2xvbmUuY2VudGVyW2pdID09PSBVKSB7CgkJCSAgICAgICAgICAgIGJyZWFrOwoJCQkgICAgICAgICAgfQoJCQkgICAgICAgIH0KCQkJICAgICAgICBzd2l0Y2ggKGopIHsKCQkJICAgICAgICAgIGNhc2UgTDoKCQkJICAgICAgICAgICAgcmVzdWx0LnB1c2goInoiKTsKCQkJICAgICAgICAgICAgYnJlYWs7CgkJCSAgICAgICAgICBjYXNlIFI6CgkJCSAgICAgICAgICAgIHJlc3VsdC5wdXNoKCJ6JyIpOwoJCQkgICAgICAgICAgICBicmVhazsKCQkJICAgICAgICAgIGNhc2UgRDoKCQkJICAgICAgICAgICAgcmVzdWx0LnB1c2goInoyIik7CgkJCSAgICAgICAgfQoJCQkgICAgICAgIHJldHVybiByZXN1bHQuam9pbignICcpOwoJCQkgICAgICB9CgoJCQkgICAgICBzdGF0aWMgaW52ZXJzZShhcmcpIHsKCQkJICAgICAgICB2YXIgZmFjZSwgaywgbGVuLCBtb3ZlLCBwb3dlciwgcmVzdWx0LCBzdHI7CgkJCSAgICAgICAgcmVzdWx0ID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgICAgICAgdmFyIGssIGxlbiwgcmVmLCByZXN1bHRzOwoJCQkgICAgICAgICAgcmVmID0gcGFyc2VBbGcoYXJnKTsKCQkJICAgICAgICAgIHJlc3VsdHMgPSBbXTsKCQkJICAgICAgICAgIGZvciAoayA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGsgPCBsZW47IGsrKykgewoJCQkgICAgICAgICAgICBtb3ZlID0gcmVmW2tdOwoJCQkgICAgICAgICAgICBmYWNlID0gbW92ZSAvIDMgfCAwOwoJCQkgICAgICAgICAgICBwb3dlciA9IG1vdmUgJSAzOwoJCQkgICAgICAgICAgICByZXN1bHRzLnB1c2goZmFjZSAqIDMgKyAtKHBvd2VyIC0gMSkgKyAxKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIHJldHVybiByZXN1bHRzOwoJCQkgICAgICAgIH0pKCk7CgkJCSAgICAgICAgcmVzdWx0LnJldmVyc2UoKTsKCQkJICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHsKCQkJICAgICAgICAgIHN0ciA9ICcnOwoJCQkgICAgICAgICAgZm9yIChrID0gMCwgbGVuID0gcmVzdWx0Lmxlbmd0aDsgayA8IGxlbjsgaysrKSB7CgkJCSAgICAgICAgICAgIG1vdmUgPSByZXN1bHRba107CgkJCSAgICAgICAgICAgIGZhY2UgPSBtb3ZlIC8gMyB8IDA7CgkJCSAgICAgICAgICAgIHBvd2VyID0gbW92ZSAlIDM7CgkJCSAgICAgICAgICAgIHN0ciArPSBmYWNlTmFtZXNbZmFjZV07CgkJCSAgICAgICAgICAgIGlmIChwb3dlciA9PT0gMSkgewoJCQkgICAgICAgICAgICAgIHN0ciArPSAnMic7CgkJCSAgICAgICAgICAgIH0gZWxzZSBpZiAocG93ZXIgPT09IDIpIHsKCQkJICAgICAgICAgICAgICBzdHIgKz0gIiciOwoJCQkgICAgICAgICAgICB9CgkJCSAgICAgICAgICAgIHN0ciArPSAnICc7CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgICByZXR1cm4gc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSk7CgkJCSAgICAgICAgfSBlbHNlIGlmIChhcmcubGVuZ3RoICE9IG51bGwpIHsKCQkJICAgICAgICAgIHJldHVybiByZXN1bHQ7CgkJCSAgICAgICAgfSBlbHNlIHsKCQkJICAgICAgICAgIHJldHVybiByZXN1bHRbMF07CgkJCSAgICAgICAgfQoJCQkgICAgICB9CgoJCQkgICAgfQoJCQkgICAgQ3ViZS5wcm90b3R5cGUucmFuZG9taXplID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgICB2YXIgYXJlUGVybXV0YXRpb25zVmFsaWQsIGdlbmVyYXRlVmFsaWRSYW5kb21PcmllbnRhdGlvbiwgZ2VuZXJhdGVWYWxpZFJhbmRvbVBlcm11dGF0aW9uLCBnZXROdW1Td2FwcywgaXNPcmllbnRhdGlvblZhbGlkLCByYW5kaW50LCByYW5kb21pemVPcmllbnRhdGlvbiwgcmVzdWx0LCBzaHVmZmxlOwoJCQkgICAgICByYW5kaW50ID0gZnVuY3Rpb24obWluLCBtYXgpIHsKCQkJICAgICAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTsKCQkJICAgICAgfTsKCQkJICAgICAgLy8gRmlzaGVyLVlhdGVzIHNodWZmbGUgYWRhcHRlZCBmcm9tIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0NTA5NTQvaG93LXRvLXJhbmRvbWl6ZS1zaHVmZmxlLWEtamF2YXNjcmlwdC1hcnJheQoJCQkgICAgICBzaHVmZmxlID0gZnVuY3Rpb24oYXJyYXkpIHsKCQkJICAgICAgICB2YXIgY3VycmVudEluZGV4LCByYW5kb21JbmRleDsKCQkJICAgICAgICBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGg7CgkJCSAgICAgICAgLy8gV2hpbGUgdGhlcmUgcmVtYWluIGVsZW1lbnRzIHRvIHNodWZmbGUuLi4KCQkJICAgICAgICB3aGlsZSAoY3VycmVudEluZGV4ICE9PSAwKSB7CgkJCSAgICAgICAgICAvLyBQaWNrIGEgcmVtYWluaW5nIGVsZW1lbnQuLi4KCQkJICAgICAgICAgIHJhbmRvbUluZGV4ID0gcmFuZGludCgwLCBjdXJyZW50SW5kZXggLSAxKTsKCQkJICAgICAgICAgIGN1cnJlbnRJbmRleCAtPSAxOwoJCQkgICAgICAgICAgLy8gQW5kIHN3YXAgaXQgd2l0aCB0aGUgY3VycmVudCBlbGVtZW50LgoJCQkgICAgICAgICAgYXJyYXlbY3VycmVudEluZGV4XTsKCQkJICAgICAgICAgIFthcnJheVtjdXJyZW50SW5kZXhdLCBhcnJheVtyYW5kb21JbmRleF1dID0gW2FycmF5W3JhbmRvbUluZGV4XSwgYXJyYXlbY3VycmVudEluZGV4XV07CgkJCSAgICAgICAgfQoJCQkgICAgICB9OwoJCQkgICAgICBnZXROdW1Td2FwcyA9IGZ1bmN0aW9uKGFycikgewoJCQkgICAgICAgIHZhciBjdXIsIGN5Y2xlTGVuZ3RoLCBpLCBrLCBudW1Td2FwcywgcmVmLCBzZWVuOwoJCQkgICAgICAgIG51bVN3YXBzID0gMDsKCQkJICAgICAgICBzZWVuID0gKGZ1bmN0aW9uKCkgewoJCQkgICAgICAgICAgdmFyIGssIHJlZiwgcmVzdWx0czsKCQkJICAgICAgICAgIHJlc3VsdHMgPSBbXTsKCQkJICAgICAgICAgIGZvciAoayA9IDAsIHJlZiA9IGFyci5sZW5ndGggLSAxOyAoMCA8PSByZWYgPyBrIDw9IHJlZiA6IGsgPj0gcmVmKTsgMCA8PSByZWYgPyArK2sgOiAtLWspIHsKCQkJICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZhbHNlKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIHJldHVybiByZXN1bHRzOwoJCQkgICAgICAgIH0pKCk7CgkJCSAgICAgICAgd2hpbGUgKHRydWUpIHsKCQkJICAgICAgICAgIC8vIFdlIGNvbXB1dGUgdGhlIGN5Y2xlIGRlY29tcG9zaXRpb24KCQkJICAgICAgICAgIGN1ciA9IC0xOwoJCQkgICAgICAgICAgZm9yIChpID0gayA9IDAsIHJlZiA9IGFyci5sZW5ndGggLSAxOyAoMCA8PSByZWYgPyBrIDw9IHJlZiA6IGsgPj0gcmVmKTsgaSA9IDAgPD0gcmVmID8gKytrIDogLS1rKSB7CgkJCSAgICAgICAgICAgIGlmICghc2VlbltpXSkgewoJCQkgICAgICAgICAgICAgIGN1ciA9IGk7CgkJCSAgICAgICAgICAgICAgYnJlYWs7CgkJCSAgICAgICAgICAgIH0KCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIGlmIChjdXIgPT09IC0xKSB7CgkJCSAgICAgICAgICAgIGJyZWFrOwoJCQkgICAgICAgICAgfQoJCQkgICAgICAgICAgY3ljbGVMZW5ndGggPSAwOwoJCQkgICAgICAgICAgd2hpbGUgKCFzZWVuW2N1cl0pIHsKCQkJICAgICAgICAgICAgc2VlbltjdXJdID0gdHJ1ZTsKCQkJICAgICAgICAgICAgY3ljbGVMZW5ndGgrKzsKCQkJICAgICAgICAgICAgY3VyID0gYXJyW2N1cl07CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgICAvLyBBIGN5Y2xlIGlzIGVxdWl2YWxlbnQgdG8gY3ljbGVMZW5ndGggKyAxIHN3YXBzCgkJCSAgICAgICAgICBudW1Td2FwcyArPSBjeWNsZUxlbmd0aCArIDE7CgkJCSAgICAgICAgfQoJCQkgICAgICAgIHJldHVybiBudW1Td2FwczsKCQkJICAgICAgfTsKCQkJICAgICAgYXJlUGVybXV0YXRpb25zVmFsaWQgPSBmdW5jdGlvbihjcCwgZXApIHsKCQkJICAgICAgICB2YXIgbnVtU3dhcHM7CgkJCSAgICAgICAgbnVtU3dhcHMgPSBnZXROdW1Td2FwcyhlcCkgKyBnZXROdW1Td2FwcyhjcCk7CgkJCSAgICAgICAgcmV0dXJuIG51bVN3YXBzICUgMiA9PT0gMDsKCQkJICAgICAgfTsKCQkJICAgICAgZ2VuZXJhdGVWYWxpZFJhbmRvbVBlcm11dGF0aW9uID0gZnVuY3Rpb24oY3AsIGVwKSB7CgkJCSAgICAgICAgLy8gRWFjaCBzaHVmZmxlIG9ubHkgdGFrZXMgYXJvdW5kIDEyIG9wZXJhdGlvbnMgYW5kIHRoZXJlJ3MgYSA1MCUKCQkJICAgICAgICAvLyBjaGFuY2Ugb2YgYSB2YWxpZCBwZXJtdXRhdGlvbiBzbyBpdCdsbCBmaW5pc2ggaW4gdmVyeSBnb29kIHRpbWUKCQkJICAgICAgICBzaHVmZmxlKGVwKTsKCQkJICAgICAgICBzaHVmZmxlKGNwKTsKCQkJICAgICAgICB3aGlsZSAoIWFyZVBlcm11dGF0aW9uc1ZhbGlkKGNwLCBlcCkpIHsKCQkJICAgICAgICAgIHNodWZmbGUoZXApOwoJCQkgICAgICAgICAgc2h1ZmZsZShjcCk7CgkJCSAgICAgICAgfQoJCQkgICAgICB9OwoJCQkgICAgICByYW5kb21pemVPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKGFyciwgbnVtT3JpZW50YXRpb25zKSB7CgkJCSAgICAgICAgdmFyIGksIGssIG9yaSwgcmVmOwoJCQkgICAgICAgIG9yaSA9IDA7CgkJCSAgICAgICAgZm9yIChpID0gayA9IDAsIHJlZiA9IGFyci5sZW5ndGggLSAxOyAoMCA8PSByZWYgPyBrIDw9IHJlZiA6IGsgPj0gcmVmKTsgaSA9IDAgPD0gcmVmID8gKytrIDogLS1rKSB7CgkJCSAgICAgICAgICBvcmkgKz0gKGFycltpXSA9IHJhbmRpbnQoMCwgbnVtT3JpZW50YXRpb25zIC0gMSkpOwoJCQkgICAgICAgIH0KCQkJICAgICAgfTsKCQkJICAgICAgaXNPcmllbnRhdGlvblZhbGlkID0gZnVuY3Rpb24oYXJyLCBudW1PcmllbnRhdGlvbnMpIHsKCQkJICAgICAgICByZXR1cm4gYXJyLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7CgkJCSAgICAgICAgICByZXR1cm4gYSArIGI7CgkJCSAgICAgICAgfSkgJSBudW1PcmllbnRhdGlvbnMgPT09IDA7CgkJCSAgICAgIH07CgkJCSAgICAgIGdlbmVyYXRlVmFsaWRSYW5kb21PcmllbnRhdGlvbiA9IGZ1bmN0aW9uKGNvLCBlbykgewoJCQkgICAgICAgIC8vIFRoZXJlIGlzIGEgMS8yIGFuZCAxLzMgcHJvYmFibHkgcmVzcGVjdGl2ZWx5IG9mIGVhY2ggb2YgdGhlc2UKCQkJICAgICAgICAvLyBzdWNjZWVkaW5nIHNvIHRoZSBwcm9iYWJpbGl0eSBvZiB0aGVtIHJ1bm5pbmcgMTAgdGltZXMgYmVmb3JlCgkJCSAgICAgICAgLy8gc3VjY2VzcyBpcyBhbHJlYWR5IG9ubHkgMSUgYW5kIG9ubHkgZ2V0cyBleHBvbmVudGlhbGx5IGxvd2VyCgkJCSAgICAgICAgLy8gYW5kIGVhY2ggZ2VuZXJhdGlvbiBpcyBvbmx5IGluIHRoZSAxMHMgb2Ygb3BlcmF0aW9ucyB3aGljaCBpcyBub3RoaW5nCgkJCSAgICAgICAgcmFuZG9taXplT3JpZW50YXRpb24oY28sIDMpOwoJCQkgICAgICAgIHdoaWxlICghaXNPcmllbnRhdGlvblZhbGlkKGNvLCAzKSkgewoJCQkgICAgICAgICAgcmFuZG9taXplT3JpZW50YXRpb24oY28sIDMpOwoJCQkgICAgICAgIH0KCQkJICAgICAgICByYW5kb21pemVPcmllbnRhdGlvbihlbywgMik7CgkJCSAgICAgICAgd2hpbGUgKCFpc09yaWVudGF0aW9uVmFsaWQoZW8sIDIpKSB7CgkJCSAgICAgICAgICByYW5kb21pemVPcmllbnRhdGlvbihlbywgMik7CgkJCSAgICAgICAgfQoJCQkgICAgICB9OwoJCQkgICAgICByZXN1bHQgPSBmdW5jdGlvbigpIHsKCQkJICAgICAgICBnZW5lcmF0ZVZhbGlkUmFuZG9tUGVybXV0YXRpb24odGhpcy5jcCwgdGhpcy5lcCk7CgkJCSAgICAgICAgZ2VuZXJhdGVWYWxpZFJhbmRvbU9yaWVudGF0aW9uKHRoaXMuY28sIHRoaXMuZW8pOwoJCQkgICAgICAgIHJldHVybiB0aGlzOwoJCQkgICAgICB9OwoJCQkgICAgICByZXR1cm4gcmVzdWx0OwoJCQkgICAgfSkoKTsKCgkJCSAgICBDdWJlLm1vdmVzID0gWwoJCQkgICAgICB7CgkJCSAgICAgICAgLy8gVQoJCQkgICAgICAgIGNlbnRlcjogWzAsIDEsIDIsIDMsIDQsIDVdLAoJCQkgICAgICAgIGNwOiBbVUJSLAoJCQkgICAgICBVUkYsCgkJCSAgICAgIFVGTCwKCQkJICAgICAgVUxCLAoJCQkgICAgICBERlIsCgkJCSAgICAgIERMRiwKCQkJICAgICAgREJMLAoJCQkgICAgICBEUkJdLAoJCQkgICAgICAgIGNvOiBbMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMF0sCgkJCSAgICAgICAgZXA6IFtVQiwKCQkJICAgICAgVVIsCgkJCSAgICAgIFVGLAoJCQkgICAgICBVTCwKCQkJICAgICAgRFIsCgkJCSAgICAgIERGLAoJCQkgICAgICBETCwKCQkJICAgICAgREIsCgkJCSAgICAgIEZSLAoJCQkgICAgICBGTCwKCQkJICAgICAgQkwsCgkJCSAgICAgIEJSXSwKCQkJICAgICAgICBlbzogWzAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDBdCgkJCSAgICAgIH0sCgkJCSAgICAgIHsKCQkJICAgICAgICAvLyBSCgkJCSAgICAgICAgY2VudGVyOiBbMCwgMSwgMiwgMywgNCwgNV0sCgkJCSAgICAgICAgY3A6IFtERlIsCgkJCSAgICAgIFVGTCwKCQkJICAgICAgVUxCLAoJCQkgICAgICBVUkYsCgkJCSAgICAgIERSQiwKCQkJICAgICAgRExGLAoJCQkgICAgICBEQkwsCgkJCSAgICAgIFVCUl0sCgkJCSAgICAgICAgY286IFsyLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAyXSwKCQkJICAgICAgICBlcDogW0ZSLAoJCQkgICAgICBVRiwKCQkJICAgICAgVUwsCgkJCSAgICAgIFVCLAoJCQkgICAgICBCUiwKCQkJICAgICAgREYsCgkJCSAgICAgIERMLAoJCQkgICAgICBEQiwKCQkJICAgICAgRFIsCgkJCSAgICAgIEZMLAoJCQkgICAgICBCTCwKCQkJICAgICAgVVJdLAoJCQkgICAgICAgIGVvOiBbMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMF0KCQkJICAgICAgfSwKCQkJICAgICAgewoJCQkgICAgICAgIC8vIEYKCQkJICAgICAgICBjZW50ZXI6IFswLCAxLCAyLCAzLCA0LCA1XSwKCQkJICAgICAgICBjcDogW1VGTCwKCQkJICAgICAgRExGLAoJCQkgICAgICBVTEIsCgkJCSAgICAgIFVCUiwKCQkJICAgICAgVVJGLAoJCQkgICAgICBERlIsCgkJCSAgICAgIERCTCwKCQkJICAgICAgRFJCXSwKCQkJICAgICAgICBjbzogWzEsCgkJCSAgICAgIDIsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDIsCgkJCSAgICAgIDEsCgkJCSAgICAgIDAsCgkJCSAgICAgIDBdLAoJCQkgICAgICAgIGVwOiBbVVIsCgkJCSAgICAgIEZMLAoJCQkgICAgICBVTCwKCQkJICAgICAgVUIsCgkJCSAgICAgIERSLAoJCQkgICAgICBGUiwKCQkJICAgICAgREwsCgkJCSAgICAgIERCLAoJCQkgICAgICBVRiwKCQkJICAgICAgREYsCgkJCSAgICAgIEJMLAoJCQkgICAgICBCUl0sCgkJCSAgICAgICAgZW86IFswLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwXQoJCQkgICAgICB9LAoJCQkgICAgICB7CgkJCSAgICAgICAgLy8gRAoJCQkgICAgICAgIGNlbnRlcjogWzAsIDEsIDIsIDMsIDQsIDVdLAoJCQkgICAgICAgIGNwOiBbVVJGLAoJCQkgICAgICBVRkwsCgkJCSAgICAgIFVMQiwKCQkJICAgICAgVUJSLAoJCQkgICAgICBETEYsCgkJCSAgICAgIERCTCwKCQkJICAgICAgRFJCLAoJCQkgICAgICBERlJdLAoJCQkgICAgICAgIGNvOiBbMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMF0sCgkJCSAgICAgICAgZXA6IFtVUiwKCQkJICAgICAgVUYsCgkJCSAgICAgIFVMLAoJCQkgICAgICBVQiwKCQkJICAgICAgREYsCgkJCSAgICAgIERMLAoJCQkgICAgICBEQiwKCQkJICAgICAgRFIsCgkJCSAgICAgIEZSLAoJCQkgICAgICBGTCwKCQkJICAgICAgQkwsCgkJCSAgICAgIEJSXSwKCQkJICAgICAgICBlbzogWzAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDBdCgkJCSAgICAgIH0sCgkJCSAgICAgIHsKCQkJICAgICAgICAvLyBMCgkJCSAgICAgICAgY2VudGVyOiBbMCwgMSwgMiwgMywgNCwgNV0sCgkJCSAgICAgICAgY3A6IFtVUkYsCgkJCSAgICAgIFVMQiwKCQkJICAgICAgREJMLAoJCQkgICAgICBVQlIsCgkJCSAgICAgIERGUiwKCQkJICAgICAgVUZMLAoJCQkgICAgICBETEYsCgkJCSAgICAgIERSQl0sCgkJCSAgICAgICAgY286IFswLAoJCQkgICAgICAxLAoJCQkgICAgICAyLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAyLAoJCQkgICAgICAxLAoJCQkgICAgICAwXSwKCQkJICAgICAgICBlcDogW1VSLAoJCQkgICAgICBVRiwKCQkJICAgICAgQkwsCgkJCSAgICAgIFVCLAoJCQkgICAgICBEUiwKCQkJICAgICAgREYsCgkJCSAgICAgIEZMLAoJCQkgICAgICBEQiwKCQkJICAgICAgRlIsCgkJCSAgICAgIFVMLAoJCQkgICAgICBETCwKCQkJICAgICAgQlJdLAoJCQkgICAgICAgIGVvOiBbMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMF0KCQkJICAgICAgfSwKCQkJICAgICAgewoJCQkgICAgICAgIC8vIEIKCQkJICAgICAgICBjZW50ZXI6IFswLCAxLCAyLCAzLCA0LCA1XSwKCQkJICAgICAgICBjcDogW1VSRiwKCQkJICAgICAgVUZMLAoJCQkgICAgICBVQlIsCgkJCSAgICAgIERSQiwKCQkJICAgICAgREZSLAoJCQkgICAgICBETEYsCgkJCSAgICAgIFVMQiwKCQkJICAgICAgREJMXSwKCQkJICAgICAgICBjbzogWzAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDEsCgkJCSAgICAgIDIsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDIsCgkJCSAgICAgIDFdLAoJCQkgICAgICAgIGVwOiBbVVIsCgkJCSAgICAgIFVGLAoJCQkgICAgICBVTCwKCQkJICAgICAgQlIsCgkJCSAgICAgIERSLAoJCQkgICAgICBERiwKCQkJICAgICAgREwsCgkJCSAgICAgIEJMLAoJCQkgICAgICBGUiwKCQkJICAgICAgRkwsCgkJCSAgICAgIFVCLAoJCQkgICAgICBEQl0sCgkJCSAgICAgICAgZW86IFswLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAxXQoJCQkgICAgICB9LAoJCQkgICAgICB7CgkJCSAgICAgICAgLy8gRQoJCQkgICAgICAgIGNlbnRlcjogW1UsCgkJCSAgICAgIEYsCgkJCSAgICAgIEwsCgkJCSAgICAgIEQsCgkJCSAgICAgIEIsCgkJCSAgICAgIFJdLAoJCQkgICAgICAgIGNwOiBbVVJGLAoJCQkgICAgICBVRkwsCgkJCSAgICAgIFVMQiwKCQkJICAgICAgVUJSLAoJCQkgICAgICBERlIsCgkJCSAgICAgIERMRiwKCQkJICAgICAgREJMLAoJCQkgICAgICBEUkJdLAoJCQkgICAgICAgIGNvOiBbMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMF0sCgkJCSAgICAgICAgZXA6IFtVUiwKCQkJICAgICAgVUYsCgkJCSAgICAgIFVMLAoJCQkgICAgICBVQiwKCQkJICAgICAgRFIsCgkJCSAgICAgIERGLAoJCQkgICAgICBETCwKCQkJICAgICAgREIsCgkJCSAgICAgIEZMLAoJCQkgICAgICBCTCwKCQkJICAgICAgQlIsCgkJCSAgICAgIEZSXSwKCQkJICAgICAgICBlbzogWzAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDEsCgkJCSAgICAgIDEsCgkJCSAgICAgIDEsCgkJCSAgICAgIDFdCgkJCSAgICAgIH0sCgkJCSAgICAgIHsKCQkJICAgICAgICAvLyBNCgkJCSAgICAgICAgY2VudGVyOiBbQiwKCQkJICAgICAgUiwKCQkJICAgICAgVSwKCQkJICAgICAgRiwKCQkJICAgICAgTCwKCQkJICAgICAgRF0sCgkJCSAgICAgICAgY3A6IFtVUkYsCgkJCSAgICAgIFVGTCwKCQkJICAgICAgVUxCLAoJCQkgICAgICBVQlIsCgkJCSAgICAgIERGUiwKCQkJICAgICAgRExGLAoJCQkgICAgICBEQkwsCgkJCSAgICAgIERSQl0sCgkJCSAgICAgICAgY286IFswLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwXSwKCQkJICAgICAgICBlcDogW1VSLAoJCQkgICAgICBVQiwKCQkJICAgICAgVUwsCgkJCSAgICAgIERCLAoJCQkgICAgICBEUiwKCQkJICAgICAgVUYsCgkJCSAgICAgIERMLAoJCQkgICAgICBERiwKCQkJICAgICAgRlIsCgkJCSAgICAgIEZMLAoJCQkgICAgICBCTCwKCQkJICAgICAgQlJdLAoJCQkgICAgICAgIGVvOiBbMCwKCQkJICAgICAgMSwKCQkJICAgICAgMCwKCQkJICAgICAgMSwKCQkJICAgICAgMCwKCQkJICAgICAgMSwKCQkJICAgICAgMCwKCQkJICAgICAgMSwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMCwKCQkJICAgICAgMF0KCQkJICAgICAgfSwKCQkJICAgICAgewoJCQkgICAgICAgIC8vIFMKCQkJICAgICAgICBjZW50ZXI6IFtMLAoJCQkgICAgICBVLAoJCQkgICAgICBGLAoJCQkgICAgICBSLAoJCQkgICAgICBELAoJCQkgICAgICBCXSwKCQkJICAgICAgICBjcDogW1VSRiwKCQkJICAgICAgVUZMLAoJCQkgICAgICBVTEIsCgkJCSAgICAgIFVCUiwKCQkJICAgICAgREZSLAoJCQkgICAgICBETEYsCgkJCSAgICAgIERCTCwKCQkJICAgICAgRFJCXSwKCQkJICAgICAgICBjbzogWzAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDAsCgkJCSAgICAgIDBdLAoJCQkgICAgICAgIGVwOiBbVUwsCgkJCSAgICAgIFVGLAoJCQkgICAgICBETCwKCQkJICAgICAgVUIsCgkJCSAgICAgIFVSLAoJCQkgICAgICBERiwKCQkJICAgICAgRFIsCgkJCSAgICAgIERCLAoJCQkgICAgICBGUiwKCQkJICAgICAgRkwsCgkJCSAgICAgIEJMLAoJCQkgICAgICBCUl0sCgkJCSAgICAgICAgZW86IFsxLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAxLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwLAoJCQkgICAgICAwXQoJCQkgICAgICB9CgkJCSAgICBdOwoKCQkJICAgIGZhY2VOdW1zID0gewoJCQkgICAgICBVOiAwLAoJCQkgICAgICBSOiAxLAoJCQkgICAgICBGOiAyLAoJCQkgICAgICBEOiAzLAoJCQkgICAgICBMOiA0LAoJCQkgICAgICBCOiA1LAoJCQkgICAgICBFOiA2LAoJCQkgICAgICBNOiA3LAoJCQkgICAgICBTOiA4LAoJCQkgICAgICB4OiA5LAoJCQkgICAgICB5OiAxMCwKCQkJICAgICAgejogMTEsCgkJCSAgICAgIHU6IDEyLAoJCQkgICAgICByOiAxMywKCQkJICAgICAgZjogMTQsCgkJCSAgICAgIGQ6IDE1LAoJCQkgICAgICBsOiAxNiwKCQkJICAgICAgYjogMTcKCQkJICAgIH07CgoJCQkgICAgZmFjZU5hbWVzID0gewoJCQkgICAgICAwOiAnVScsCgkJCSAgICAgIDE6ICdSJywKCQkJICAgICAgMjogJ0YnLAoJCQkgICAgICAzOiAnRCcsCgkJCSAgICAgIDQ6ICdMJywKCQkJICAgICAgNTogJ0InLAoJCQkgICAgICA2OiAnRScsCgkJCSAgICAgIDc6ICdNJywKCQkJICAgICAgODogJ1MnLAoJCQkgICAgICA5OiAneCcsCgkJCSAgICAgIDEwOiAneScsCgkJCSAgICAgIDExOiAneicsCgkJCSAgICAgIDEyOiAndScsCgkJCSAgICAgIDEzOiAncicsCgkJCSAgICAgIDE0OiAnZicsCgkJCSAgICAgIDE1OiAnZCcsCgkJCSAgICAgIDE2OiAnbCcsCgkJCSAgICAgIDE3OiAnYicKCQkJICAgIH07CgoJCQkgICAgcGFyc2VBbGcgPSBmdW5jdGlvbihhcmcpIHsKCQkJICAgICAgdmFyIGssIGxlbiwgbW92ZSwgcGFydCwgcG93ZXIsIHJlZiwgcmVzdWx0czsKCQkJICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7CgkJCSAgICAgICAgcmVmID0gYXJnLnNwbGl0KC9ccysvKTsKCQkJICAgICAgICAvLyBTdHJpbmcKCQkJICAgICAgICByZXN1bHRzID0gW107CgkJCSAgICAgICAgZm9yIChrID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgayA8IGxlbjsgaysrKSB7CgkJCSAgICAgICAgICBwYXJ0ID0gcmVmW2tdOwoJCQkgICAgICAgICAgaWYgKHBhcnQubGVuZ3RoID09PSAwKSB7CgkJCSAgICAgICAgICAgIC8vIEZpcnN0IGFuZCBsYXN0IGNhbiBiZSBlbXB0eQoJCQkgICAgICAgICAgICBjb250aW51ZTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIGlmIChwYXJ0Lmxlbmd0aCA+IDIpIHsKCQkJICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG1vdmU6ICR7cGFydH1gKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIG1vdmUgPSBmYWNlTnVtc1twYXJ0WzBdXTsKCQkJICAgICAgICAgIGlmIChtb3ZlID09PSB2b2lkIDApIHsKCQkJICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG1vdmU6ICR7cGFydH1gKTsKCQkJICAgICAgICAgIH0KCQkJICAgICAgICAgIGlmIChwYXJ0Lmxlbmd0aCA9PT0gMSkgewoJCQkgICAgICAgICAgICBwb3dlciA9IDA7CgkJCSAgICAgICAgICB9IGVsc2UgewoJCQkgICAgICAgICAgICBpZiAocGFydFsxXSA9PT0gJzInKSB7CgkJCSAgICAgICAgICAgICAgcG93ZXIgPSAxOwoJCQkgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRbMV0gPT09ICInIikgewoJCQkgICAgICAgICAgICAgIHBvd2VyID0gMjsKCQkJICAgICAgICAgICAgfSBlbHNlIHsKCQkJICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbW92ZTogJHtwYXJ0fWApOwoJCQkgICAgICAgICAgICB9CgkJCSAgICAgICAgICB9CgkJCSAgICAgICAgICByZXN1bHRzLnB1c2gobW92ZSAqIDMgKyBwb3dlcik7CgkJCSAgICAgICAgfQoJCQkgICAgICAgIHJldHVybiByZXN1bHRzOwoJCQkgICAgICB9IGVsc2UgaWYgKGFyZy5sZW5ndGggIT0gbnVsbCkgewoJCQkgICAgICAgIC8vIEFscmVhZHkgYW4gYXJyYXkKCQkJICAgICAgICByZXR1cm4gYXJnOwoJCQkgICAgICB9IGVsc2UgewoJCQkgICAgICAgIC8vIEEgc2luZ2xlIG1vdmUKCQkJICAgICAgICByZXR1cm4gW2FyZ107CgkJCSAgICAgIH0KCQkJICAgIH07CgoJCQkgICAgLy8geAoJCQkgICAgQ3ViZS5tb3Zlcy5wdXNoKG5ldyBDdWJlKCkubW92ZSgiUiBNJyBMJyIpLnRvSlNPTigpKTsKCgkJCSAgICAvLyB5CgkJCSAgICBDdWJlLm1vdmVzLnB1c2gobmV3IEN1YmUoKS5tb3ZlKCJVIEUnIEQnIikudG9KU09OKCkpOwoKCQkJICAgIC8vIHoKCQkJICAgIEN1YmUubW92ZXMucHVzaChuZXcgQ3ViZSgpLm1vdmUoIkYgUyBCJyIpLnRvSlNPTigpKTsKCgkJCSAgICAvLyB1CgkJCSAgICBDdWJlLm1vdmVzLnB1c2gobmV3IEN1YmUoKS5tb3ZlKCJVIEUnIikudG9KU09OKCkpOwoKCQkJICAgIC8vIHIKCQkJICAgIEN1YmUubW92ZXMucHVzaChuZXcgQ3ViZSgpLm1vdmUoIlIgTSciKS50b0pTT04oKSk7CgoJCQkgICAgLy8gZgoJCQkgICAgQ3ViZS5tb3Zlcy5wdXNoKG5ldyBDdWJlKCkubW92ZSgiRiBTIikudG9KU09OKCkpOwoKCQkJICAgIC8vIGQKCQkJICAgIEN1YmUubW92ZXMucHVzaChuZXcgQ3ViZSgpLm1vdmUoIkQgRSIpLnRvSlNPTigpKTsKCgkJCSAgICAvLyBsCgkJCSAgICBDdWJlLm1vdmVzLnB1c2gobmV3IEN1YmUoKS5tb3ZlKCJMIE0iKS50b0pTT04oKSk7CgoJCQkgICAgLy8gYgoJCQkgICAgQ3ViZS5tb3Zlcy5wdXNoKG5ldyBDdWJlKCkubW92ZSgiQiBTJyIpLnRvSlNPTigpKTsKCgkJCSAgICByZXR1cm4gQ3ViZTsKCgkJCSAgfSkuY2FsbCh0aGlzKTsKCgkJCSAgLy8jIEdsb2JhbHMKCQkJICBpZiAobW9kdWxlICE9PSBudWxsKSB7CgkJCSAgICBtb2R1bGUuZXhwb3J0cyA9IEN1YmU7CgkJCSAgfSBlbHNlIHsKCQkJICAgIHRoaXMuQ3ViZSA9IEN1YmU7CgkJCSAgfQoKCQkJfSkuY2FsbChjdWJlKTsgCgkJfSAoY3ViZSQxKSk7CgkJcmV0dXJuIGN1YmUkMS5leHBvcnRzOwoJfQoKCXZhciBzb2x2ZSA9IHt9OwoKCXZhciBoYXNSZXF1aXJlZFNvbHZlOwoKCWZ1bmN0aW9uIHJlcXVpcmVTb2x2ZSAoKSB7CgkJaWYgKGhhc1JlcXVpcmVkU29sdmUpIHJldHVybiBzb2x2ZTsKCQloYXNSZXF1aXJlZFNvbHZlID0gMTsKCQkoZnVuY3Rpb24oKSB7CgkJICB2YXIgQkwsIEJSLCBDbmssIEN1YmUsIERCLCBEQkwsIERGLCBERlIsIERMLCBETEYsIERSLCBEUkIsIEZMLCBGUiwgSW5jbHVkZSwgTl9GTElQLCBOX0ZSdG9CUiwgTl9QQVJJVFksIE5fU0xJQ0UxLCBOX1NMSUNFMiwgTl9UV0lTVCwgTl9VQnRvREYsIE5fVVJGdG9ETEYsIE5fVVJ0b0RGLCBOX1VSdG9VTCwgVUIsIFVCUiwgVUYsIFVGTCwgVUwsIFVMQiwgVVIsIFVSRiwgYWxsTW92ZXMxLCBhbGxNb3ZlczIsIGNvbXB1dGVNb3ZlVGFibGUsIGNvbXB1dGVQcnVuaW5nVGFibGUsIGZhY2VOYW1lcywgZmFjZU51bXMsIGZhY3RvcmlhbCwga2V5LCBtYXgsIG1lcmdlVVJ0b0RGLCBtb3ZlVGFibGVQYXJhbXMsIG5leHRNb3ZlczEsIG5leHRNb3ZlczIsIHBlcm11dGF0aW9uSW5kZXgsIHBydW5pbmcsIHBydW5pbmdUYWJsZVBhcmFtcywgcm90YXRlTGVmdCwgcm90YXRlUmlnaHQsIHZhbHVlLAoJCSAgICBpbmRleE9mID0gW10uaW5kZXhPZjsKCgkJICBDdWJlID0gdGhpcy5DdWJlIHx8IHJlcXVpcmVDdWJlKCk7CgoJCSAgLy8gQ29ybmVycwoJCSAgW1VSRiwgVUZMLCBVTEIsIFVCUiwgREZSLCBETEYsIERCTCwgRFJCXSA9IFswLCAxLCAyLCAzLCA0LCA1LCA2LCA3XTsKCgkJICAvLyBFZGdlcwoJCSAgW1VSLCBVRiwgVUwsIFVCLCBEUiwgREYsIERMLCBEQiwgRlIsIEZMLCBCTCwgQlJdID0gWzAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMV07CgoJCSAgLy8jIEhlbHBlcnMKCgkJICAvLyBuIGNob29zZSBrLCBpLmUuIHRoZSBiaW5vbWlhbCBjb2VmZmllY2llbnQKCQkgIENuayA9IGZ1bmN0aW9uKG4sIGspIHsKCQkgICAgdmFyIGksIGosIHM7CgkJICAgIGlmIChuIDwgaykgewoJCSAgICAgIHJldHVybiAwOwoJCSAgICB9CgkJICAgIGlmIChrID4gbiAvIDIpIHsKCQkgICAgICBrID0gbiAtIGs7CgkJICAgIH0KCQkgICAgcyA9IDE7CgkJICAgIGkgPSBuOwoJCSAgICBqID0gMTsKCQkgICAgd2hpbGUgKGkgIT09IG4gLSBrKSB7CgkJICAgICAgcyAqPSBpOwoJCSAgICAgIHMgLz0gajsKCQkgICAgICBpLS07CgkJICAgICAgaisrOwoJCSAgICB9CgkJICAgIHJldHVybiBzOwoJCSAgfTsKCgkJICAvLyBuIQoJCSAgZmFjdG9yaWFsID0gZnVuY3Rpb24obikgewoJCSAgICB2YXIgZiwgaSwgbSwgcmVmOwoJCSAgICBmID0gMTsKCQkgICAgZm9yIChpID0gbSA9IDIsIHJlZiA9IG47ICgyIDw9IHJlZiA/IG0gPD0gcmVmIDogbSA+PSByZWYpOyBpID0gMiA8PSByZWYgPyArK20gOiAtLW0pIHsKCQkgICAgICBmICo9IGk7CgkJICAgIH0KCQkgICAgcmV0dXJuIGY7CgkJICB9OwoKCQkgIC8vIE1heGltdW0gb2YgdHdvIHZhbHVlcwoJCSAgbWF4ID0gZnVuY3Rpb24oYSwgYikgewoJCSAgICBpZiAoYSA+IGIpIHsKCQkgICAgICByZXR1cm4gYTsKCQkgICAgfSBlbHNlIHsKCQkgICAgICByZXR1cm4gYjsKCQkgICAgfQoJCSAgfTsKCgkJICAvLyBSb3RhdGUgZWxlbWVudHMgYmV0d2VlbiBsIGFuZCByIGxlZnQgYnkgb25lIHBsYWNlCgkJICByb3RhdGVMZWZ0ID0gZnVuY3Rpb24oYXJyYXksIGwsIHIpIHsKCQkgICAgdmFyIGksIG0sIHJlZiwgcmVmMSwgdG1wOwoJCSAgICB0bXAgPSBhcnJheVtsXTsKCQkgICAgZm9yIChpID0gbSA9IHJlZiA9IGwsIHJlZjEgPSByIC0gMTsgKHJlZiA8PSByZWYxID8gbSA8PSByZWYxIDogbSA+PSByZWYxKTsgaSA9IHJlZiA8PSByZWYxID8gKyttIDogLS1tKSB7CgkJICAgICAgYXJyYXlbaV0gPSBhcnJheVtpICsgMV07CgkJICAgIH0KCQkgICAgcmV0dXJuIGFycmF5W3JdID0gdG1wOwoJCSAgfTsKCgkJICAvLyBSb3RhdGUgZWxlbWVudHMgYmV0d2VlbiBsIGFuZCByIHJpZ2h0IGJ5IG9uZSBwbGFjZQoJCSAgcm90YXRlUmlnaHQgPSBmdW5jdGlvbihhcnJheSwgbCwgcikgewoJCSAgICB2YXIgaSwgbSwgcmVmLCByZWYxLCB0bXA7CgkJICAgIHRtcCA9IGFycmF5W3JdOwoJCSAgICBmb3IgKGkgPSBtID0gcmVmID0gciwgcmVmMSA9IGwgKyAxOyAocmVmIDw9IHJlZjEgPyBtIDw9IHJlZjEgOiBtID49IHJlZjEpOyBpID0gcmVmIDw9IHJlZjEgPyArK20gOiAtLW0pIHsKCQkgICAgICBhcnJheVtpXSA9IGFycmF5W2kgLSAxXTsKCQkgICAgfQoJCSAgICByZXR1cm4gYXJyYXlbbF0gPSB0bXA7CgkJICB9OwoKCQkgIC8vIEdlbmVyYXRlIGEgZnVuY3Rpb24gdGhhdCBjb21wdXRlcyBwZXJtdXRhdGlvbiBpbmRpY2VzLgoKCQkgIC8vIFRoZSBwZXJtdXRhdGlvbiBpbmRleCBhY3R1YWxseSBlbmNvZGVzIHR3byBpbmRpY2VzOiBDb21iaW5hdGlvbiwKCQkgIC8vIGkuZS4gcG9zaXRpb25zIG9mIHRoZSBjdWJpZXMgc3RhcnQuLmVuZCAoQSkgYW5kIHRoZWlyIHJlc3BlY3RpdmUKCQkgIC8vIHBlcm11dGF0aW9uIChCKS4gVGhlIG1heGltdW0gdmFsdWUgZm9yIEIgaXMKCgkJICAvLyAgIG1heEIgPSAoZW5kIC0gc3RhcnQgKyAxKSEKCgkJICAvLyBhbmQgdGhlIGluZGV4IGlzIEEgKiBtYXhCICsgQgoJCSAgcGVybXV0YXRpb25JbmRleCA9IGZ1bmN0aW9uKGNvbnRleHQsIHN0YXJ0LCBlbmQsIGZyb21FbmQgPSBmYWxzZSkgewoJCSAgICB2YXIgaSwgbWF4QWxsLCBtYXhCLCBtYXhPdXIsIG91ciwgcGVybU5hbWU7CgkJICAgIG1heE91ciA9IGVuZCAtIHN0YXJ0OwoJCSAgICBtYXhCID0gZmFjdG9yaWFsKG1heE91ciArIDEpOwoJCSAgICBpZiAoY29udGV4dCA9PT0gJ2Nvcm5lcnMnKSB7CgkJICAgICAgbWF4QWxsID0gNzsKCQkgICAgICBwZXJtTmFtZSA9ICdjcCc7CgkJICAgIH0gZWxzZSB7CgkJICAgICAgbWF4QWxsID0gMTE7CgkJICAgICAgcGVybU5hbWUgPSAnZXAnOwoJCSAgICB9CgkJICAgIG91ciA9IChmdW5jdGlvbigpIHsKCQkgICAgICB2YXIgbSwgcmVmLCByZXN1bHRzOwoJCSAgICAgIHJlc3VsdHMgPSBbXTsKCQkgICAgICBmb3IgKGkgPSBtID0gMCwgcmVmID0gbWF4T3VyOyAoMCA8PSByZWYgPyBtIDw9IHJlZiA6IG0gPj0gcmVmKTsgaSA9IDAgPD0gcmVmID8gKyttIDogLS1tKSB7CgkJICAgICAgICByZXN1bHRzLnB1c2goMCk7CgkJICAgICAgfQoJCSAgICAgIHJldHVybiByZXN1bHRzOwoJCSAgICB9KSgpOwoJCSAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHsKCQkgICAgICB2YXIgYSwgYiwgYywgaiwgaywgbSwgbywgcCwgcGVybSwgcSwgcmVmLCByZWYxLCByZWYxMCwgcmVmMiwgcmVmMywgcmVmNCwgcmVmNSwgcmVmNiwgcmVmNywgcmVmOCwgcmVmOSwgdCwgdSwgdywgeCwgeSwgejsKCQkgICAgICBpZiAoaW5kZXggIT0gbnVsbCkgewoJCSAgICAgICAgZm9yIChpID0gbSA9IDAsIHJlZiA9IG1heE91cjsgKDAgPD0gcmVmID8gbSA8PSByZWYgOiBtID49IHJlZik7IGkgPSAwIDw9IHJlZiA/ICsrbSA6IC0tbSkgewoJCSAgICAgICAgICAvLyBSZXNldCBvdXIgdG8gW3N0YXJ0Li5lbmRdCgkJICAgICAgICAgIG91cltpXSA9IGkgKyBzdGFydDsKCQkgICAgICAgIH0KCQkgICAgICAgIGIgPSBpbmRleCAlIG1heEI7IC8vIHBlcm11dGF0aW9uCgkJICAgICAgICBhID0gaW5kZXggLyBtYXhCIHwgMDsgLy8gY29tYmluYXRpb24KCQkgICAgICAgIAoJCSAgICAgICAgLy8gSW52YWxpZGF0ZSBhbGwgZWRnZXMKCQkgICAgICAgIHBlcm0gPSB0aGlzW3Blcm1OYW1lXTsKCQkgICAgICAgIGZvciAoaSA9IG8gPSAwLCByZWYxID0gbWF4QWxsOyAoMCA8PSByZWYxID8gbyA8PSByZWYxIDogbyA+PSByZWYxKTsgaSA9IDAgPD0gcmVmMSA/ICsrbyA6IC0tbykgewoJCSAgICAgICAgICBwZXJtW2ldID0gLTE7CgkJICAgICAgICB9CgkJLy8gR2VuZXJhdGUgcGVybXV0YXRpb24gZnJvbSBpbmRleCBiCgkJICAgICAgICBmb3IgKGogPSBwID0gMSwgcmVmMiA9IG1heE91cjsgKDEgPD0gcmVmMiA/IHAgPD0gcmVmMiA6IHAgPj0gcmVmMik7IGogPSAxIDw9IHJlZjIgPyArK3AgOiAtLXApIHsKCQkgICAgICAgICAgayA9IGIgJSAoaiArIDEpOwoJCSAgICAgICAgICBiID0gYiAvIChqICsgMSkgfCAwOwoJCSAgICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgcm90YXRlUmlnaHRCeShvdXIsIDAsIGosIGspCgkJICAgICAgICAgIHdoaWxlIChrID4gMCkgewoJCSAgICAgICAgICAgIHJvdGF0ZVJpZ2h0KG91ciwgMCwgaik7CgkJICAgICAgICAgICAgay0tOwoJCSAgICAgICAgICB9CgkJICAgICAgICB9CgkJICAgICAgICAvLyBHZW5lcmF0ZSBjb21iaW5hdGlvbiBhbmQgc2V0IG91ciBlZGdlcwoJCSAgICAgICAgeCA9IG1heE91cjsKCQkgICAgICAgIGlmIChmcm9tRW5kKSB7CgkJICAgICAgICAgIGZvciAoaiA9IHEgPSAwLCByZWYzID0gbWF4QWxsOyAoMCA8PSByZWYzID8gcSA8PSByZWYzIDogcSA+PSByZWYzKTsgaiA9IDAgPD0gcmVmMyA/ICsrcSA6IC0tcSkgewoJCSAgICAgICAgICAgIGMgPSBDbmsobWF4QWxsIC0gaiwgeCArIDEpOwoJCSAgICAgICAgICAgIGlmIChhIC0gYyA+PSAwKSB7CgkJICAgICAgICAgICAgICBwZXJtW2pdID0gb3VyW21heE91ciAtIHhdOwoJCSAgICAgICAgICAgICAgYSAtPSBjOwoJCSAgICAgICAgICAgICAgeC0tOwoJCSAgICAgICAgICAgIH0KCQkgICAgICAgICAgfQoJCSAgICAgICAgfSBlbHNlIHsKCQkgICAgICAgICAgZm9yIChqID0gdCA9IHJlZjQgPSBtYXhBbGw7IChyZWY0IDw9IDAgPyB0IDw9IDAgOiB0ID49IDApOyBqID0gcmVmNCA8PSAwID8gKyt0IDogLS10KSB7CgkJICAgICAgICAgICAgYyA9IENuayhqLCB4ICsgMSk7CgkJICAgICAgICAgICAgaWYgKGEgLSBjID49IDApIHsKCQkgICAgICAgICAgICAgIHBlcm1bal0gPSBvdXJbeF07CgkJICAgICAgICAgICAgICBhIC09IGM7CgkJICAgICAgICAgICAgICB4LS07CgkJICAgICAgICAgICAgfQoJCSAgICAgICAgICB9CgkJICAgICAgICB9CgkJICAgICAgICByZXR1cm4gdGhpczsKCQkgICAgICB9IGVsc2UgewoJCSAgICAgICAgcGVybSA9IHRoaXNbcGVybU5hbWVdOwoJCSAgICAgICAgZm9yIChpID0gdSA9IDAsIHJlZjUgPSBtYXhPdXI7ICgwIDw9IHJlZjUgPyB1IDw9IHJlZjUgOiB1ID49IHJlZjUpOyBpID0gMCA8PSByZWY1ID8gKyt1IDogLS11KSB7CgkJICAgICAgICAgIG91cltpXSA9IC0xOwoJCSAgICAgICAgfQoJCSAgICAgICAgYSA9IGIgPSB4ID0gMDsKCQkgICAgICAgIC8vIENvbXB1dGUgdGhlIGluZGV4IGEgPCAoKG1heEFsbCArIDEpIGNob29zZSAobWF4T3VyICsgMSkpIGFuZAoJCSAgICAgICAgLy8gdGhlIHBlcm11dGF0aW9uCgkJICAgICAgICBpZiAoZnJvbUVuZCkgewoJCSAgICAgICAgICBmb3IgKGogPSB3ID0gcmVmNiA9IG1heEFsbDsgKHJlZjYgPD0gMCA/IHcgPD0gMCA6IHcgPj0gMCk7IGogPSByZWY2IDw9IDAgPyArK3cgOiAtLXcpIHsKCQkgICAgICAgICAgICBpZiAoKHN0YXJ0IDw9IChyZWY3ID0gcGVybVtqXSkgJiYgcmVmNyA8PSBlbmQpKSB7CgkJICAgICAgICAgICAgICBhICs9IENuayhtYXhBbGwgLSBqLCB4ICsgMSk7CgkJICAgICAgICAgICAgICBvdXJbbWF4T3VyIC0geF0gPSBwZXJtW2pdOwoJCSAgICAgICAgICAgICAgeCsrOwoJCSAgICAgICAgICAgIH0KCQkgICAgICAgICAgfQoJCSAgICAgICAgfSBlbHNlIHsKCQkgICAgICAgICAgZm9yIChqID0geSA9IDAsIHJlZjggPSBtYXhBbGw7ICgwIDw9IHJlZjggPyB5IDw9IHJlZjggOiB5ID49IHJlZjgpOyBqID0gMCA8PSByZWY4ID8gKyt5IDogLS15KSB7CgkJICAgICAgICAgICAgaWYgKChzdGFydCA8PSAocmVmOSA9IHBlcm1bal0pICYmIHJlZjkgPD0gZW5kKSkgewoJCSAgICAgICAgICAgICAgYSArPSBDbmsoaiwgeCArIDEpOwoJCSAgICAgICAgICAgICAgb3VyW3hdID0gcGVybVtqXTsKCQkgICAgICAgICAgICAgIHgrKzsKCQkgICAgICAgICAgICB9CgkJICAgICAgICAgIH0KCQkgICAgICAgIH0KCQkvLyBDb21wdXRlIHRoZSBpbmRleCBiIDwgKG1heE91ciArIDEpISBmb3IgdGhlIHBlcm11dGF0aW9uCgkJICAgICAgICBmb3IgKGogPSB6ID0gcmVmMTAgPSBtYXhPdXI7IChyZWYxMCA8PSAwID8geiA8PSAwIDogeiA+PSAwKTsgaiA9IHJlZjEwIDw9IDAgPyArK3ogOiAtLXopIHsKCQkgICAgICAgICAgayA9IDA7CgkJICAgICAgICAgIHdoaWxlIChvdXJbal0gIT09IHN0YXJ0ICsgaikgewoJCSAgICAgICAgICAgIHJvdGF0ZUxlZnQob3VyLCAwLCBqKTsKCQkgICAgICAgICAgICBrKys7CgkJICAgICAgICAgIH0KCQkgICAgICAgICAgYiA9IChqICsgMSkgKiBiICsgazsKCQkgICAgICAgIH0KCQkgICAgICAgIHJldHVybiBhICogbWF4QiArIGI7CgkJICAgICAgfQoJCSAgICB9OwoJCSAgfTsKCgkJICBJbmNsdWRlID0gewoJCSAgICAvLyBUaGUgdHdpc3Qgb2YgdGhlIDggY29ybmVycywgMCA8PSB0d2lzdCA8IDNeNy4gVGhlIG9yaWVudGF0aW9uIG9mCgkJICAgIC8vIHRoZSBEUkIgY29ybmVyIGlzIGZ1bGx5IGRldGVybWluZWQgYnkgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBvdGhlcgoJCSAgICAvLyBjb3JuZXJzLgoJCSAgICB0d2lzdDogZnVuY3Rpb24odHdpc3QpIHsKCQkgICAgICB2YXIgaSwgbSwgbywgb3JpLCBwYXJpdHksIHY7CgkJICAgICAgaWYgKHR3aXN0ICE9IG51bGwpIHsKCQkgICAgICAgIHBhcml0eSA9IDA7CgkJICAgICAgICBmb3IgKGkgPSBtID0gNjsgbSA+PSAwOyBpID0gLS1tKSB7CgkJICAgICAgICAgIG9yaSA9IHR3aXN0ICUgMzsKCQkgICAgICAgICAgdHdpc3QgPSAodHdpc3QgLyAzKSB8IDA7CgkJICAgICAgICAgIHRoaXMuY29baV0gPSBvcmk7CgkJICAgICAgICAgIHBhcml0eSArPSBvcmk7CgkJICAgICAgICB9CgkJICAgICAgICB0aGlzLmNvWzddID0gKDMgLSBwYXJpdHkgJSAzKSAlIDM7CgkJICAgICAgICByZXR1cm4gdGhpczsKCQkgICAgICB9IGVsc2UgewoJCSAgICAgICAgdiA9IDA7CgkJICAgICAgICBmb3IgKGkgPSBvID0gMDsgbyA8PSA2OyBpID0gKytvKSB7CgkJICAgICAgICAgIHYgPSAzICogdiArIHRoaXMuY29baV07CgkJICAgICAgICB9CgkJICAgICAgICByZXR1cm4gdjsKCQkgICAgICB9CgkJICAgIH0sCgkJICAgIC8vIFRoZSBmbGlwIG9mIHRoZSAxMiBlZGdlcywgMCA8PSBmbGlwIDwgMl4xMS4gVGhlIG9yaWVudGF0aW9uIG9mIHRoZQoJCSAgICAvLyBCUiBlZGdlIGlzIGZ1bGx5IGRldGVybWluZWQgYnkgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBvdGhlciBlZGdlcy4KCQkgICAgZmxpcDogZnVuY3Rpb24oZmxpcCkgewoJCSAgICAgIHZhciBpLCBtLCBvLCBvcmksIHBhcml0eSwgdjsKCQkgICAgICBpZiAoZmxpcCAhPSBudWxsKSB7CgkJICAgICAgICBwYXJpdHkgPSAwOwoJCSAgICAgICAgZm9yIChpID0gbSA9IDEwOyBtID49IDA7IGkgPSAtLW0pIHsKCQkgICAgICAgICAgb3JpID0gZmxpcCAlIDI7CgkJICAgICAgICAgIGZsaXAgPSBmbGlwIC8gMiB8IDA7CgkJICAgICAgICAgIHRoaXMuZW9baV0gPSBvcmk7CgkJICAgICAgICAgIHBhcml0eSArPSBvcmk7CgkJICAgICAgICB9CgkJICAgICAgICB0aGlzLmVvWzExXSA9ICgyIC0gcGFyaXR5ICUgMikgJSAyOwoJCSAgICAgICAgcmV0dXJuIHRoaXM7CgkJICAgICAgfSBlbHNlIHsKCQkgICAgICAgIHYgPSAwOwoJCSAgICAgICAgZm9yIChpID0gbyA9IDA7IG8gPD0gMTA7IGkgPSArK28pIHsKCQkgICAgICAgICAgdiA9IDIgKiB2ICsgdGhpcy5lb1tpXTsKCQkgICAgICAgIH0KCQkgICAgICAgIHJldHVybiB2OwoJCSAgICAgIH0KCQkgICAgfSwKCQkgICAgLy8gUGFyaXR5IG9mIHRoZSBjb3JuZXIgcGVybXV0YXRpb24KCQkgICAgY29ybmVyUGFyaXR5OiBmdW5jdGlvbigpIHsKCQkgICAgICB2YXIgaSwgaiwgbSwgbywgcmVmLCByZWYxLCByZWYyLCByZWYzLCBzOwoJCSAgICAgIHMgPSAwOwoJCSAgICAgIGZvciAoaSA9IG0gPSByZWYgPSBEUkIsIHJlZjEgPSBVUkYgKyAxOyAocmVmIDw9IHJlZjEgPyBtIDw9IHJlZjEgOiBtID49IHJlZjEpOyBpID0gcmVmIDw9IHJlZjEgPyArK20gOiAtLW0pIHsKCQkgICAgICAgIGZvciAoaiA9IG8gPSByZWYyID0gaSAtIDEsIHJlZjMgPSBVUkY7IChyZWYyIDw9IHJlZjMgPyBvIDw9IHJlZjMgOiBvID49IHJlZjMpOyBqID0gcmVmMiA8PSByZWYzID8gKytvIDogLS1vKSB7CgkJICAgICAgICAgIGlmICh0aGlzLmNwW2pdID4gdGhpcy5jcFtpXSkgewoJCSAgICAgICAgICAgIHMrKzsKCQkgICAgICAgICAgfQoJCSAgICAgICAgfQoJCSAgICAgIH0KCQkgICAgICByZXR1cm4gcyAlIDI7CgkJICAgIH0sCgkJICAgIC8vIFBhcml0eSBvZiB0aGUgZWRnZXMgcGVybXV0YXRpb24uIFBhcml0eSBvZiBjb3JuZXJzIGFuZCBlZGdlcyBhcmUKCQkgICAgLy8gdGhlIHNhbWUgaWYgdGhlIGN1YmUgaXMgc29sdmFibGUuCgkJICAgIGVkZ2VQYXJpdHk6IGZ1bmN0aW9uKCkgewoJCSAgICAgIHZhciBpLCBqLCBtLCBvLCByZWYsIHJlZjEsIHJlZjIsIHJlZjMsIHM7CgkJICAgICAgcyA9IDA7CgkJICAgICAgZm9yIChpID0gbSA9IHJlZiA9IEJSLCByZWYxID0gVVIgKyAxOyAocmVmIDw9IHJlZjEgPyBtIDw9IHJlZjEgOiBtID49IHJlZjEpOyBpID0gcmVmIDw9IHJlZjEgPyArK20gOiAtLW0pIHsKCQkgICAgICAgIGZvciAoaiA9IG8gPSByZWYyID0gaSAtIDEsIHJlZjMgPSBVUjsgKHJlZjIgPD0gcmVmMyA/IG8gPD0gcmVmMyA6IG8gPj0gcmVmMyk7IGogPSByZWYyIDw9IHJlZjMgPyArK28gOiAtLW8pIHsKCQkgICAgICAgICAgaWYgKHRoaXMuZXBbal0gPiB0aGlzLmVwW2ldKSB7CgkJICAgICAgICAgICAgcysrOwoJCSAgICAgICAgICB9CgkJICAgICAgICB9CgkJICAgICAgfQoJCSAgICAgIHJldHVybiBzICUgMjsKCQkgICAgfSwKCQkgICAgLy8gUGVybXV0YXRpb24gb2YgdGhlIHNpeCBjb3JuZXJzIFVSRiwgVUZMLCBVTEIsIFVCUiwgREZSLCBETEYKCQkgICAgVVJGdG9ETEY6IHBlcm11dGF0aW9uSW5kZXgoJ2Nvcm5lcnMnLCBVUkYsIERMRiksCgkJICAgIC8vIFBlcm11dGF0aW9uIG9mIHRoZSB0aHJlZSBlZGdlcyBVUiwgVUYsIFVMCgkJICAgIFVSdG9VTDogcGVybXV0YXRpb25JbmRleCgnZWRnZXMnLCBVUiwgVUwpLAoJCSAgICAvLyBQZXJtdXRhdGlvbiBvZiB0aGUgdGhyZWUgZWRnZXMgVUIsIERSLCBERgoJCSAgICBVQnRvREY6IHBlcm11dGF0aW9uSW5kZXgoJ2VkZ2VzJywgVUIsIERGKSwKCQkgICAgLy8gUGVybXV0YXRpb24gb2YgdGhlIHNpeCBlZGdlcyBVUiwgVUYsIFVMLCBVQiwgRFIsIERGCgkJICAgIFVSdG9ERjogcGVybXV0YXRpb25JbmRleCgnZWRnZXMnLCBVUiwgREYpLAoJCSAgICAvLyBQZXJtdXRhdGlvbiBvZiB0aGUgZXF1YXRvciBzbGljZSBlZGdlcyBGUiwgRkwsIEJMIGFuZCBCUgoJCSAgICBGUnRvQlI6IHBlcm11dGF0aW9uSW5kZXgoJ2VkZ2VzJywgRlIsIEJSLCB0cnVlKQoJCSAgfTsKCgkJICBmb3IgKGtleSBpbiBJbmNsdWRlKSB7CgkJICAgIHZhbHVlID0gSW5jbHVkZVtrZXldOwoJCSAgICBDdWJlLnByb3RvdHlwZVtrZXldID0gdmFsdWU7CgkJICB9CgoJCSAgY29tcHV0ZU1vdmVUYWJsZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGNvb3JkLCBzaXplKSB7CgkJICAgIHZhciBhcHBseSwgY3ViZSwgaSwgaW5uZXIsIGosIG0sIG1vdmUsIG8sIHAsIHJlZiwgcmVzdWx0czsKCQkgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB2YWxpZCB2YWx1ZXMgZm9yIHRoZSBjb29yZGluYXRlLCBzZXR0aW5nIGN1YmUncwoJCSAgICAvLyBzdGF0ZSBpbiBlYWNoIGl0ZXJhdGlvbi4gVGhlbiBhcHBseSBlYWNoIG9mIHRoZSAxOCBtb3ZlcyB0byB0aGUKCQkgICAgLy8gY3ViZSwgYW5kIGNvbXB1dGUgdGhlIHJlc3VsdGluZyBjb29yZGluYXRlLgoJCSAgICBhcHBseSA9IGNvbnRleHQgPT09ICdjb3JuZXJzJyA/ICdjb3JuZXJNdWx0aXBseScgOiAnZWRnZU11bHRpcGx5JzsKCQkgICAgY3ViZSA9IG5ldyBDdWJlOwoJCSAgICByZXN1bHRzID0gW107CgkJICAgIGZvciAoaSA9IG0gPSAwLCByZWYgPSBzaXplIC0gMTsgKDAgPD0gcmVmID8gbSA8PSByZWYgOiBtID49IHJlZik7IGkgPSAwIDw9IHJlZiA/ICsrbSA6IC0tbSkgewoJCSAgICAgIGN1YmVbY29vcmRdKGkpOwoJCSAgICAgIGlubmVyID0gW107CgkJICAgICAgZm9yIChqID0gbyA9IDA7IG8gPD0gNTsgaiA9ICsrbykgewoJCSAgICAgICAgbW92ZSA9IEN1YmUubW92ZXNbal07CgkJICAgICAgICBmb3IgKHAgPSAwOyBwIDw9IDI7ICsrcCkgewoJCSAgICAgICAgICBjdWJlW2FwcGx5XShtb3ZlKTsKCQkgICAgICAgICAgaW5uZXIucHVzaChjdWJlW2Nvb3JkXSgpKTsKCQkgICAgICAgIH0KCQkgICAgICAgIC8vIDR0aCBmYWNlIHR1cm4gcmVzdG9yZXMgdGhlIGN1YmUKCQkgICAgICAgIGN1YmVbYXBwbHldKG1vdmUpOwoJCSAgICAgIH0KCQkgICAgICByZXN1bHRzLnB1c2goaW5uZXIpOwoJCSAgICB9CgkJICAgIHJldHVybiByZXN1bHRzOwoJCSAgfTsKCgkJICAvLyBCZWNhdXNlIHdlIG9ubHkgaGF2ZSB0aGUgcGhhc2UgMiBVUnRvREYgY29vcmRpbmF0ZXMsIHdlIG5lZWQgdG8KCQkgIC8vIG1lcmdlIHRoZSBVUnRvVUwgYW5kIFVCdG9ERiBjb29yZGluYXRlcyB0byBVUnRvREYgaW4gdGhlIGJlZ2lubmluZwoJCSAgLy8gb2YgcGhhc2UgMi4KCQkgIG1lcmdlVVJ0b0RGID0gKGZ1bmN0aW9uKCkgewoJCSAgICB2YXIgYSwgYjsKCQkgICAgYSA9IG5ldyBDdWJlOwoJCSAgICBiID0gbmV3IEN1YmU7CgkJICAgIHJldHVybiBmdW5jdGlvbihVUnRvVUwsIFVCdG9ERikgewoJCSAgICAgIHZhciBpLCBtOwoJCSAgICAgIC8vIENvbGxpc2lvbnMgY2FuIGJlIGZvdW5kIGJlY2F1c2UgdW5zZXQgYXJlIHNldCB0byAtMQoJCSAgICAgIGEuVVJ0b1VMKFVSdG9VTCk7CgkJICAgICAgYi5VQnRvREYoVUJ0b0RGKTsKCQkgICAgICBmb3IgKGkgPSBtID0gMDsgbSA8PSA3OyBpID0gKyttKSB7CgkJICAgICAgICBpZiAoYS5lcFtpXSAhPT0gLTEpIHsKCQkgICAgICAgICAgaWYgKGIuZXBbaV0gIT09IC0xKSB7CgkJICAgICAgICAgICAgcmV0dXJuIC0xOyAvLyBjb2xsaXNpb24KCQkgICAgICAgICAgfSBlbHNlIHsKCQkgICAgICAgICAgICBiLmVwW2ldID0gYS5lcFtpXTsKCQkgICAgICAgICAgfQoJCSAgICAgICAgfQoJCSAgICAgIH0KCQkgICAgICByZXR1cm4gYi5VUnRvREYoKTsKCQkgICAgfTsKCQkgIH0pKCk7CgoJCSAgTl9UV0lTVCA9IDIxODc7IC8vIDNeNyBjb3JuZXIgb3JpZW50YXRpb25zCgoJCSAgTl9GTElQID0gMjA0ODsgLy8gMl4xMSBwb3NzaWJsZSBlZGdlIGZsaXBzCgoJCSAgTl9QQVJJVFkgPSAyOyAvLyAyIHBvc3NpYmxlIHBhcml0aWVzCgoJCSAgTl9GUnRvQlIgPSAxMTg4MDsgLy8gMTIhLygxMi00KSEgcGVybXV0YXRpb25zIG9mIEZSLi5CUiBlZGdlcwoKCQkgIE5fU0xJQ0UxID0gNDk1OyAvLyAoMTIgY2hvb3NlIDQpIHBvc3NpYmxlIHBvc2l0aW9ucyBvZiBGUi4uQlIgZWRnZXMKCgkJICBOX1NMSUNFMiA9IDI0OyAvLyA0ISBwZXJtdXRhdGlvbnMgb2YgRlIuLkJSIGVkZ2VzIGluIHBoYXNlIDIKCgkJICBOX1VSRnRvRExGID0gMjAxNjA7IC8vIDghLyg4LTYpISBwZXJtdXRhdGlvbnMgb2YgVVJGLi5ETEYgY29ybmVycwoKCQkgIAoJCSAgLy8gVGhlIFVSdG9ERiBtb3ZlIHRhYmxlIGlzIG9ubHkgY29tcHV0ZWQgZm9yIHBoYXNlIDIgYmVjYXVzZSB0aGUgZnVsbAoJCSAgLy8gdGFibGUgd291bGQgaGF2ZSA+NjUwMDAwIGVudHJpZXMKCQkgIE5fVVJ0b0RGID0gMjAxNjA7IC8vIDghLyg4LTYpISBwZXJtdXRhdGlvbiBvZiBVUi4uREYgZWRnZXMgaW4gcGhhc2UgMgoKCQkgIE5fVVJ0b1VMID0gMTMyMDsgLy8gMTIhLygxMi0zKSEgcGVybXV0YXRpb25zIG9mIFVSLi5VTCBlZGdlcwoKCQkgIE5fVUJ0b0RGID0gMTMyMDsgLy8gMTIhLygxMi0zKSEgcGVybXV0YXRpb25zIG9mIFVCLi5ERiBlZGdlcwoKCQkgIAoJCSAgLy8gVGhlIG1vdmUgdGFibGUgZm9yIHBhcml0eSBpcyBzbyBzbWFsbCB0aGF0IGl0J3MgaW5jbHVkZWQgaGVyZQoJCSAgQ3ViZS5tb3ZlVGFibGVzID0gewoJCSAgICBwYXJpdHk6IFtbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMCwgMSwgMSwgMCwgMSwgMSwgMCwgMSwgMSwgMCwgMV0sIFswLCAxLCAwLCAwLCAxLCAwLCAwLCAxLCAwLCAwLCAxLCAwLCAwLCAxLCAwLCAwLCAxLCAwXV0sCgkJICAgIHR3aXN0OiBudWxsLAoJCSAgICBmbGlwOiBudWxsLAoJCSAgICBGUnRvQlI6IG51bGwsCgkJICAgIFVSRnRvRExGOiBudWxsLAoJCSAgICBVUnRvREY6IG51bGwsCgkJICAgIFVSdG9VTDogbnVsbCwKCQkgICAgVUJ0b0RGOiBudWxsLAoJCSAgICBtZXJnZVVSdG9ERjogbnVsbAoJCSAgfTsKCgkJICAvLyBPdGhlciBtb3ZlIHRhYmxlcyBhcmUgY29tcHV0ZWQgb24gdGhlIGZseQoJCSAgbW92ZVRhYmxlUGFyYW1zID0gewoJCSAgICAvLyBuYW1lOiBbc2NvcGUsIHNpemVdCgkJICAgIHR3aXN0OiBbJ2Nvcm5lcnMnLCBOX1RXSVNUXSwKCQkgICAgZmxpcDogWydlZGdlcycsIE5fRkxJUF0sCgkJICAgIEZSdG9CUjogWydlZGdlcycsIE5fRlJ0b0JSXSwKCQkgICAgVVJGdG9ETEY6IFsnY29ybmVycycsIE5fVVJGdG9ETEZdLAoJCSAgICBVUnRvREY6IFsnZWRnZXMnLCBOX1VSdG9ERl0sCgkJICAgIFVSdG9VTDogWydlZGdlcycsIE5fVVJ0b1VMXSwKCQkgICAgVUJ0b0RGOiBbJ2VkZ2VzJywgTl9VQnRvREZdLAoJCSAgICBtZXJnZVVSdG9ERjogW10KCQkgIH07CgoJCSAgQ3ViZS5jb21wdXRlTW92ZVRhYmxlcyA9IGZ1bmN0aW9uKC4uLnRhYmxlcykgewoJCSAgICB2YXIgbGVuLCBtLCBuYW1lLCBzY29wZSwgc2l6ZSwgdGFibGVOYW1lOwoJCSAgICBpZiAodGFibGVzLmxlbmd0aCA9PT0gMCkgewoJCSAgICAgIHRhYmxlcyA9IChmdW5jdGlvbigpIHsKCQkgICAgICAgIHZhciByZXN1bHRzOwoJCSAgICAgICAgcmVzdWx0cyA9IFtdOwoJCSAgICAgICAgZm9yIChuYW1lIGluIG1vdmVUYWJsZVBhcmFtcykgewoJCSAgICAgICAgICByZXN1bHRzLnB1c2gobmFtZSk7CgkJICAgICAgICB9CgkJICAgICAgICByZXR1cm4gcmVzdWx0czsKCQkgICAgICB9KSgpOwoJCSAgICB9CgkJICAgIGZvciAobSA9IDAsIGxlbiA9IHRhYmxlcy5sZW5ndGg7IG0gPCBsZW47IG0rKykgewoJCSAgICAgIHRhYmxlTmFtZSA9IHRhYmxlc1ttXTsKCQkgICAgICBpZiAodGhpcy5tb3ZlVGFibGVzW3RhYmxlTmFtZV0gIT09IG51bGwpIHsKCQkgICAgICAgIC8vIEFscmVhZHkgY29tcHV0ZWQKCQkgICAgICAgIGNvbnRpbnVlOwoJCSAgICAgIH0KCQkgICAgICBpZiAodGFibGVOYW1lID09PSAnbWVyZ2VVUnRvREYnKSB7CgkJICAgICAgICB0aGlzLm1vdmVUYWJsZXMubWVyZ2VVUnRvREYgPSAoZnVuY3Rpb24oKSB7CgkJICAgICAgICAgIHZhciBVQnRvREYsIFVSdG9VTCwgbywgcmVzdWx0czsKCQkgICAgICAgICAgcmVzdWx0cyA9IFtdOwoJCSAgICAgICAgICBmb3IgKFVSdG9VTCA9IG8gPSAwOyBvIDw9IDMzNTsgVVJ0b1VMID0gKytvKSB7CgkJICAgICAgICAgICAgcmVzdWx0cy5wdXNoKChmdW5jdGlvbigpIHsKCQkgICAgICAgICAgICAgIHZhciBwLCByZXN1bHRzMTsKCQkgICAgICAgICAgICAgIHJlc3VsdHMxID0gW107CgkJICAgICAgICAgICAgICBmb3IgKFVCdG9ERiA9IHAgPSAwOyBwIDw9IDMzNTsgVUJ0b0RGID0gKytwKSB7CgkJICAgICAgICAgICAgICAgIHJlc3VsdHMxLnB1c2gobWVyZ2VVUnRvREYoVVJ0b1VMLCBVQnRvREYpKTsKCQkgICAgICAgICAgICAgIH0KCQkgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzMTsKCQkgICAgICAgICAgICB9KSgpKTsKCQkgICAgICAgICAgfQoJCSAgICAgICAgICByZXR1cm4gcmVzdWx0czsKCQkgICAgICAgIH0pKCk7CgkJICAgICAgfSBlbHNlIHsKCQkgICAgICAgIFtzY29wZSwgc2l6ZV0gPSBtb3ZlVGFibGVQYXJhbXNbdGFibGVOYW1lXTsKCQkgICAgICAgIHRoaXMubW92ZVRhYmxlc1t0YWJsZU5hbWVdID0gY29tcHV0ZU1vdmVUYWJsZShzY29wZSwgdGFibGVOYW1lLCBzaXplKTsKCQkgICAgICB9CgkJICAgIH0KCQkgICAgcmV0dXJuIHRoaXM7CgkJICB9OwoKCQkgIC8vIFBoYXNlIDE6IEFsbCBtb3ZlcyBhcmUgdmFsaWQKCQkgIGFsbE1vdmVzMSA9IFswLCAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgMTEsIDEyLCAxMywgMTQsIDE1LCAxNiwgMTddOwoKCQkgIC8vIFRoZSBsaXN0IG9mIG5leHQgdmFsaWQgcGhhc2UgMSBtb3ZlcyB3aGVuIHRoZSBnaXZlbiBmYWNlIHdhcyB0dXJuZWQKCQkgIC8vIGluIHRoZSBsYXN0IG1vdmUKCQkgIG5leHRNb3ZlczEgPSAoZnVuY3Rpb24oKSB7CgkJICAgIHZhciBmYWNlLCBsYXN0RmFjZSwgbSwgbmV4dCwgbywgcCwgcG93ZXIsIHJlc3VsdHM7CgkJICAgIHJlc3VsdHMgPSBbXTsKCQkgICAgZm9yIChsYXN0RmFjZSA9IG0gPSAwOyBtIDw9IDU7IGxhc3RGYWNlID0gKyttKSB7CgkJICAgICAgbmV4dCA9IFtdOwoJCS8vIERvbid0IGFsbG93IGNvbW11dGluZyBtb3ZlcywgZS5nLiBVIFUnLiBBbHNvIG1ha2Ugc3VyZSB0aGF0CgkJLy8gb3Bwb3NpdGUgZmFjZXMgYXJlIGFsd2F5cyBtb3ZlZCBpbiB0aGUgc2FtZSBvcmRlciwgaS5lLiBhbGxvdwoJCS8vIFUgRCBidXQgbm8gRCBVLiBUaGlzIGF2b2lkcyBzZXF1ZW5jZXMgbGlrZSBVIEQgVScuCgkJICAgICAgZm9yIChmYWNlID0gbyA9IDA7IG8gPD0gNTsgZmFjZSA9ICsrbykgewoJCSAgICAgICAgaWYgKGZhY2UgIT09IGxhc3RGYWNlICYmIGZhY2UgIT09IGxhc3RGYWNlIC0gMykgewoJCS8vIHNpbmdsZSwgZG91YmxlIG9yIGludmVyc2UgbW92ZQoJCSAgICAgICAgICBmb3IgKHBvd2VyID0gcCA9IDA7IHAgPD0gMjsgcG93ZXIgPSArK3ApIHsKCQkgICAgICAgICAgICBuZXh0LnB1c2goZmFjZSAqIDMgKyBwb3dlcik7CgkJICAgICAgICAgIH0KCQkgICAgICAgIH0KCQkgICAgICB9CgkJICAgICAgcmVzdWx0cy5wdXNoKG5leHQpOwoJCSAgICB9CgkJICAgIHJldHVybiByZXN1bHRzOwoJCSAgfSkoKTsKCgkJICAvLyBQaGFzZSAyOiBEb3VibGUgbW92ZXMgb2YgYWxsIGZhY2VzIHBsdXMgcXVhcnRlciBtb3ZlcyBvZiBVIGFuZCBECgkJICBhbGxNb3ZlczIgPSBbMCwgMSwgMiwgNCwgNywgOSwgMTAsIDExLCAxMywgMTZdOwoKCQkgIG5leHRNb3ZlczIgPSAoZnVuY3Rpb24oKSB7CgkJICAgIHZhciBmYWNlLCBsYXN0RmFjZSwgbGVuLCBtLCBuZXh0LCBvLCBwLCBwb3dlciwgcG93ZXJzLCByZXN1bHRzOwoJCSAgICByZXN1bHRzID0gW107CgkJICAgIGZvciAobGFzdEZhY2UgPSBtID0gMDsgbSA8PSA1OyBsYXN0RmFjZSA9ICsrbSkgewoJCSAgICAgIG5leHQgPSBbXTsKCQkgICAgICBmb3IgKGZhY2UgPSBvID0gMDsgbyA8PSA1OyBmYWNlID0gKytvKSB7CgkJICAgICAgICBpZiAoIShmYWNlICE9PSBsYXN0RmFjZSAmJiBmYWNlICE9PSBsYXN0RmFjZSAtIDMpKSB7CgkJICAgICAgICAgIGNvbnRpbnVlOwoJCSAgICAgICAgfQoJCSAgICAgICAgLy8gQWxsb3cgYWxsIG1vdmVzIG9mIFUgYW5kIEQgYW5kIGRvdWJsZSBtb3ZlcyBvZiBvdGhlcnMKCQkgICAgICAgIHBvd2VycyA9IGZhY2UgPT09IDAgfHwgZmFjZSA9PT0gMyA/IFswLCAxLCAyXSA6IFsxXTsKCQkgICAgICAgIGZvciAocCA9IDAsIGxlbiA9IHBvd2Vycy5sZW5ndGg7IHAgPCBsZW47IHArKykgewoJCSAgICAgICAgICBwb3dlciA9IHBvd2Vyc1twXTsKCQkgICAgICAgICAgbmV4dC5wdXNoKGZhY2UgKiAzICsgcG93ZXIpOwoJCSAgICAgICAgfQoJCSAgICAgIH0KCQkgICAgICByZXN1bHRzLnB1c2gobmV4dCk7CgkJICAgIH0KCQkgICAgcmV0dXJuIHJlc3VsdHM7CgkJICB9KSgpOwoKCQkgIC8vIDggdmFsdWVzIGFyZSBlbmNvZGVkIGluIG9uZSBudW1iZXIKCQkgIHBydW5pbmcgPSBmdW5jdGlvbih0YWJsZSwgaW5kZXgsIHZhbHVlKSB7CgkJICAgIHZhciBwb3MsIHNoaWZ0LCBzbG90OwoJCSAgICBwb3MgPSBpbmRleCAlIDg7CgkJICAgIHNsb3QgPSBpbmRleCA+PiAzOwoJCSAgICBzaGlmdCA9IHBvcyA8PCAyOwoJCSAgICBpZiAodmFsdWUgIT0gbnVsbCkgewoJCSAgICAgIC8vIFNldAoJCSAgICAgIHRhYmxlW3Nsb3RdICY9IH4oMHhGIDw8IHNoaWZ0KTsKCQkgICAgICB0YWJsZVtzbG90XSB8PSB2YWx1ZSA8PCBzaGlmdDsKCQkgICAgICByZXR1cm4gdmFsdWU7CgkJICAgIH0gZWxzZSB7CgkJICAgICAgLy8gR2V0CgkJICAgICAgcmV0dXJuICh0YWJsZVtzbG90XSAmICgweEYgPDwgc2hpZnQpKSA+Pj4gc2hpZnQ7CgkJICAgIH0KCQkgIH07CgoJCSAgY29tcHV0ZVBydW5pbmdUYWJsZSA9IGZ1bmN0aW9uKHBoYXNlLCBzaXplLCBjdXJyZW50Q29vcmRzLCBuZXh0SW5kZXgpIHsKCQkgICAgdmFyIGN1cnJlbnQsIGRlcHRoLCBkb25lLCBpbmRleCwgbGVuLCBtLCBtb3ZlLCBtb3ZlcywgbmV4dCwgbywgcmVmLCB0YWJsZTsKCQkgICAgLy8gSW5pdGlhbGl6ZSBhbGwgdmFsdWVzIHRvIDB4RgoJCSAgICB0YWJsZSA9IChmdW5jdGlvbigpIHsKCQkgICAgICB2YXIgbSwgcmVmLCByZXN1bHRzOwoJCSAgICAgIHJlc3VsdHMgPSBbXTsKCQkgICAgICBmb3IgKG0gPSAwLCByZWYgPSBNYXRoLmNlaWwoc2l6ZSAvIDgpIC0gMTsgKDAgPD0gcmVmID8gbSA8PSByZWYgOiBtID49IHJlZik7IDAgPD0gcmVmID8gKyttIDogLS1tKSB7CgkJICAgICAgICByZXN1bHRzLnB1c2goMHhGRkZGRkZGRik7CgkJICAgICAgfQoJCSAgICAgIHJldHVybiByZXN1bHRzOwoJCSAgICB9KSgpOwoJCSAgICBpZiAocGhhc2UgPT09IDEpIHsKCQkgICAgICBtb3ZlcyA9IGFsbE1vdmVzMTsKCQkgICAgfSBlbHNlIHsKCQkgICAgICBtb3ZlcyA9IGFsbE1vdmVzMjsKCQkgICAgfQoJCSAgICBkZXB0aCA9IDA7CgkJICAgIHBydW5pbmcodGFibGUsIDAsIGRlcHRoKTsKCQkgICAgZG9uZSA9IDE7CgkJICAgIC8vIEluIGVhY2ggaXRlcmF0aW9uLCB0YWtlIGVhY2ggc3RhdGUgZm91bmQgaW4gdGhlIHByZXZpb3VzIGRlcHRoIGFuZAoJCSAgICAvLyBjb21wdXRlIHRoZSBuZXh0IHN0YXRlLiBTdG9wIHdoZW4gYWxsIHN0YXRlcyBoYXZlIGJlZW4gYXNzaWduZWQgYQoJCSAgICAvLyBkZXB0aC4KCQkgICAgd2hpbGUgKGRvbmUgIT09IHNpemUpIHsKCQkgICAgICBmb3IgKGluZGV4ID0gbSA9IDAsIHJlZiA9IHNpemUgLSAxOyAoMCA8PSByZWYgPyBtIDw9IHJlZiA6IG0gPj0gcmVmKTsgaW5kZXggPSAwIDw9IHJlZiA/ICsrbSA6IC0tbSkgewoJCSAgICAgICAgaWYgKCEocHJ1bmluZyh0YWJsZSwgaW5kZXgpID09PSBkZXB0aCkpIHsKCQkgICAgICAgICAgY29udGludWU7CgkJICAgICAgICB9CgkJICAgICAgICBjdXJyZW50ID0gY3VycmVudENvb3JkcyhpbmRleCk7CgkJICAgICAgICBmb3IgKG8gPSAwLCBsZW4gPSBtb3Zlcy5sZW5ndGg7IG8gPCBsZW47IG8rKykgewoJCSAgICAgICAgICBtb3ZlID0gbW92ZXNbb107CgkJICAgICAgICAgIG5leHQgPSBuZXh0SW5kZXgoY3VycmVudCwgbW92ZSk7CgkJICAgICAgICAgIGlmIChwcnVuaW5nKHRhYmxlLCBuZXh0KSA9PT0gMHhGKSB7CgkJICAgICAgICAgICAgcHJ1bmluZyh0YWJsZSwgbmV4dCwgZGVwdGggKyAxKTsKCQkgICAgICAgICAgICBkb25lKys7CgkJICAgICAgICAgIH0KCQkgICAgICAgIH0KCQkgICAgICB9CgkJICAgICAgZGVwdGgrKzsKCQkgICAgfQoJCSAgICByZXR1cm4gdGFibGU7CgkJICB9OwoKCQkgIEN1YmUucHJ1bmluZ1RhYmxlcyA9IHsKCQkgICAgc2xpY2VUd2lzdDogbnVsbCwKCQkgICAgc2xpY2VGbGlwOiBudWxsLAoJCSAgICBzbGljZVVSRnRvRExGUGFyaXR5OiBudWxsLAoJCSAgICBzbGljZVVSdG9ERlBhcml0eTogbnVsbAoJCSAgfTsKCgkJICBwcnVuaW5nVGFibGVQYXJhbXMgPSB7CgkJICAgIC8vIG5hbWU6IFtwaGFzZSwgc2l6ZSwgY3VycmVudENvb3JkcywgbmV4dEluZGV4XQoJCSAgICBzbGljZVR3aXN0OiBbCgkJICAgICAgMSwKCQkgICAgICBOX1NMSUNFMSAqIE5fVFdJU1QsCgkJICAgICAgZnVuY3Rpb24oaW5kZXgpIHsKCQkgICAgICAgIHJldHVybiBbaW5kZXggJSBOX1NMSUNFMSwKCQkgICAgICBpbmRleCAvIE5fU0xJQ0UxIHwgMF07CgkJICAgICAgfSwKCQkgICAgICBmdW5jdGlvbihjdXJyZW50LAoJCSAgICAgIG1vdmUpIHsKCQkgICAgICAgIHZhciBuZXdTbGljZSwKCQkgICAgICBuZXdUd2lzdCwKCQkgICAgICBzbGljZSwKCQkgICAgICB0d2lzdDsKCQkgICAgICAgIFtzbGljZSwKCQkgICAgICB0d2lzdF0gPSBjdXJyZW50OwoJCSAgICAgICAgbmV3U2xpY2UgPSBDdWJlLm1vdmVUYWJsZXMuRlJ0b0JSW3NsaWNlICogMjRdW21vdmVdIC8gMjQgfCAwOwoJCSAgICAgICAgbmV3VHdpc3QgPSBDdWJlLm1vdmVUYWJsZXMudHdpc3RbdHdpc3RdW21vdmVdOwoJCSAgICAgICAgcmV0dXJuIG5ld1R3aXN0ICogTl9TTElDRTEgKyBuZXdTbGljZTsKCQkgICAgICB9CgkJICAgIF0sCgkJICAgIHNsaWNlRmxpcDogWwoJCSAgICAgIDEsCgkJICAgICAgTl9TTElDRTEgKiBOX0ZMSVAsCgkJICAgICAgZnVuY3Rpb24oaW5kZXgpIHsKCQkgICAgICAgIHJldHVybiBbaW5kZXggJSBOX1NMSUNFMSwKCQkgICAgICBpbmRleCAvIE5fU0xJQ0UxIHwgMF07CgkJICAgICAgfSwKCQkgICAgICBmdW5jdGlvbihjdXJyZW50LAoJCSAgICAgIG1vdmUpIHsKCQkgICAgICAgIHZhciBmbGlwLAoJCSAgICAgIG5ld0ZsaXAsCgkJICAgICAgbmV3U2xpY2UsCgkJICAgICAgc2xpY2U7CgkJICAgICAgICBbc2xpY2UsCgkJICAgICAgZmxpcF0gPSBjdXJyZW50OwoJCSAgICAgICAgbmV3U2xpY2UgPSBDdWJlLm1vdmVUYWJsZXMuRlJ0b0JSW3NsaWNlICogMjRdW21vdmVdIC8gMjQgfCAwOwoJCSAgICAgICAgbmV3RmxpcCA9IEN1YmUubW92ZVRhYmxlcy5mbGlwW2ZsaXBdW21vdmVdOwoJCSAgICAgICAgcmV0dXJuIG5ld0ZsaXAgKiBOX1NMSUNFMSArIG5ld1NsaWNlOwoJCSAgICAgIH0KCQkgICAgXSwKCQkgICAgc2xpY2VVUkZ0b0RMRlBhcml0eTogWwoJCSAgICAgIDIsCgkJICAgICAgTl9TTElDRTIgKiBOX1VSRnRvRExGICogTl9QQVJJVFksCgkJICAgICAgZnVuY3Rpb24oaW5kZXgpIHsKCQkgICAgICAgIHJldHVybiBbaW5kZXggJSAyLAoJCSAgICAgIChpbmRleCAvIDIgfCAwKSAlIE5fU0xJQ0UyLAoJCSAgICAgIChpbmRleCAvIDIgfCAwKSAvIE5fU0xJQ0UyIHwgMF07CgkJICAgICAgfSwKCQkgICAgICBmdW5jdGlvbihjdXJyZW50LAoJCSAgICAgIG1vdmUpIHsKCQkgICAgICAgIHZhciBVUkZ0b0RMRiwKCQkgICAgICBuZXdQYXJpdHksCgkJICAgICAgbmV3U2xpY2UsCgkJICAgICAgbmV3VVJGdG9ETEYsCgkJICAgICAgcGFyaXR5LAoJCSAgICAgIHNsaWNlOwoJCSAgICAgICAgW3Bhcml0eSwKCQkgICAgICBzbGljZSwKCQkgICAgICBVUkZ0b0RMRl0gPSBjdXJyZW50OwoJCSAgICAgICAgbmV3UGFyaXR5ID0gQ3ViZS5tb3ZlVGFibGVzLnBhcml0eVtwYXJpdHldW21vdmVdOwoJCSAgICAgICAgbmV3U2xpY2UgPSBDdWJlLm1vdmVUYWJsZXMuRlJ0b0JSW3NsaWNlXVttb3ZlXTsKCQkgICAgICAgIG5ld1VSRnRvRExGID0gQ3ViZS5tb3ZlVGFibGVzLlVSRnRvRExGW1VSRnRvRExGXVttb3ZlXTsKCQkgICAgICAgIHJldHVybiAobmV3VVJGdG9ETEYgKiBOX1NMSUNFMiArIG5ld1NsaWNlKSAqIDIgKyBuZXdQYXJpdHk7CgkJICAgICAgfQoJCSAgICBdLAoJCSAgICBzbGljZVVSdG9ERlBhcml0eTogWwoJCSAgICAgIDIsCgkJICAgICAgTl9TTElDRTIgKiBOX1VSdG9ERiAqIE5fUEFSSVRZLAoJCSAgICAgIGZ1bmN0aW9uKGluZGV4KSB7CgkJICAgICAgICByZXR1cm4gW2luZGV4ICUgMiwKCQkgICAgICAoaW5kZXggLyAyIHwgMCkgJSBOX1NMSUNFMiwKCQkgICAgICAoaW5kZXggLyAyIHwgMCkgLyBOX1NMSUNFMiB8IDBdOwoJCSAgICAgIH0sCgkJICAgICAgZnVuY3Rpb24oY3VycmVudCwKCQkgICAgICBtb3ZlKSB7CgkJICAgICAgICB2YXIgVVJ0b0RGLAoJCSAgICAgIG5ld1Bhcml0eSwKCQkgICAgICBuZXdTbGljZSwKCQkgICAgICBuZXdVUnRvREYsCgkJICAgICAgcGFyaXR5LAoJCSAgICAgIHNsaWNlOwoJCSAgICAgICAgW3Bhcml0eSwKCQkgICAgICBzbGljZSwKCQkgICAgICBVUnRvREZdID0gY3VycmVudDsKCQkgICAgICAgIG5ld1Bhcml0eSA9IEN1YmUubW92ZVRhYmxlcy5wYXJpdHlbcGFyaXR5XVttb3ZlXTsKCQkgICAgICAgIG5ld1NsaWNlID0gQ3ViZS5tb3ZlVGFibGVzLkZSdG9CUltzbGljZV1bbW92ZV07CgkJICAgICAgICBuZXdVUnRvREYgPSBDdWJlLm1vdmVUYWJsZXMuVVJ0b0RGW1VSdG9ERl1bbW92ZV07CgkJICAgICAgICByZXR1cm4gKG5ld1VSdG9ERiAqIE5fU0xJQ0UyICsgbmV3U2xpY2UpICogMiArIG5ld1Bhcml0eTsKCQkgICAgICB9CgkJICAgIF0KCQkgIH07CgoJCSAgQ3ViZS5jb21wdXRlUHJ1bmluZ1RhYmxlcyA9IGZ1bmN0aW9uKC4uLnRhYmxlcykgewoJCSAgICB2YXIgbGVuLCBtLCBuYW1lLCBwYXJhbXMsIHRhYmxlTmFtZTsKCQkgICAgaWYgKHRhYmxlcy5sZW5ndGggPT09IDApIHsKCQkgICAgICB0YWJsZXMgPSAoZnVuY3Rpb24oKSB7CgkJICAgICAgICB2YXIgcmVzdWx0czsKCQkgICAgICAgIHJlc3VsdHMgPSBbXTsKCQkgICAgICAgIGZvciAobmFtZSBpbiBwcnVuaW5nVGFibGVQYXJhbXMpIHsKCQkgICAgICAgICAgcmVzdWx0cy5wdXNoKG5hbWUpOwoJCSAgICAgICAgfQoJCSAgICAgICAgcmV0dXJuIHJlc3VsdHM7CgkJICAgICAgfSkoKTsKCQkgICAgfQoJCSAgICBmb3IgKG0gPSAwLCBsZW4gPSB0YWJsZXMubGVuZ3RoOyBtIDwgbGVuOyBtKyspIHsKCQkgICAgICB0YWJsZU5hbWUgPSB0YWJsZXNbbV07CgkJICAgICAgaWYgKHRoaXMucHJ1bmluZ1RhYmxlc1t0YWJsZU5hbWVdICE9PSBudWxsKSB7CgkJICAgICAgICAvLyBBbHJlYWR5IGNvbXB1dGVkCgkJICAgICAgICBjb250aW51ZTsKCQkgICAgICB9CgkJICAgICAgcGFyYW1zID0gcHJ1bmluZ1RhYmxlUGFyYW1zW3RhYmxlTmFtZV07CgkJICAgICAgdGhpcy5wcnVuaW5nVGFibGVzW3RhYmxlTmFtZV0gPSBjb21wdXRlUHJ1bmluZ1RhYmxlKC4uLnBhcmFtcyk7CgkJICAgIH0KCQkgICAgcmV0dXJuIHRoaXM7CgkJICB9OwoKCQkgIEN1YmUuaW5pdFNvbHZlciA9IGZ1bmN0aW9uKCkgewoJCSAgICBDdWJlLmNvbXB1dGVNb3ZlVGFibGVzKCk7CgkJICAgIHJldHVybiBDdWJlLmNvbXB1dGVQcnVuaW5nVGFibGVzKCk7CgkJICB9OwoKCQkgIEN1YmUucHJvdG90eXBlLnNvbHZlVXByaWdodCA9IGZ1bmN0aW9uKG1heERlcHRoID0gMjIpIHsKCQkgICAgdmFyIFN0YXRlLCBmcmVlU3RhdGVzLCBtb3ZlTmFtZXMsIHBoYXNlMSwgcGhhc2Uxc2VhcmNoLCBwaGFzZTIsIHBoYXNlMnNlYXJjaCwgc29sdXRpb24sIHN0YXRlOwoJCSAgICAvLyBOYW1lcyBmb3IgYWxsIG1vdmVzLCBpLmUuIFUsIFUyLCBVJywgRiwgRjIsIC4uLgoJCSAgICBtb3ZlTmFtZXMgPSAoZnVuY3Rpb24oKSB7CgkJICAgICAgdmFyIGZhY2UsIGZhY2VOYW1lLCBtLCBvLCBwb3dlciwgcG93ZXJOYW1lLCByZXN1bHQ7CgkJICAgICAgZmFjZU5hbWUgPSBbJ1UnLCAnUicsICdGJywgJ0QnLCAnTCcsICdCJ107CgkJICAgICAgcG93ZXJOYW1lID0gWycnLCAnMicsICInIl07CgkJICAgICAgcmVzdWx0ID0gW107CgkJICAgICAgZm9yIChmYWNlID0gbSA9IDA7IG0gPD0gNTsgZmFjZSA9ICsrbSkgewoJCSAgICAgICAgZm9yIChwb3dlciA9IG8gPSAwOyBvIDw9IDI7IHBvd2VyID0gKytvKSB7CgkJICAgICAgICAgIHJlc3VsdC5wdXNoKGZhY2VOYW1lW2ZhY2VdICsgcG93ZXJOYW1lW3Bvd2VyXSk7CgkJICAgICAgICB9CgkJICAgICAgfQoJCSAgICAgIHJldHVybiByZXN1bHQ7CgkJICAgIH0pKCk7CgkJICAgIFN0YXRlID0gY2xhc3MgU3RhdGUgewoJCSAgICAgIGNvbnN0cnVjdG9yKGN1YmUpIHsKCQkgICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDsKCQkgICAgICAgIHRoaXMubGFzdE1vdmUgPSBudWxsOwoJCSAgICAgICAgdGhpcy5kZXB0aCA9IDA7CgkJICAgICAgICBpZiAoY3ViZSkgewoJCSAgICAgICAgICB0aGlzLmluaXQoY3ViZSk7CgkJICAgICAgICB9CgkJICAgICAgfQoKCQkgICAgICBpbml0KGN1YmUpIHsKCQkgICAgICAgIC8vIFBoYXNlIDEgY29vcmRpbmF0ZXMKCQkgICAgICAgIHRoaXMuZmxpcCA9IGN1YmUuZmxpcCgpOwoJCSAgICAgICAgdGhpcy50d2lzdCA9IGN1YmUudHdpc3QoKTsKCQkgICAgICAgIHRoaXMuc2xpY2UgPSBjdWJlLkZSdG9CUigpIC8gTl9TTElDRTIgfCAwOwoJCSAgICAgICAgLy8gUGhhc2UgMiBjb29yZGluYXRlcwoJCSAgICAgICAgdGhpcy5wYXJpdHkgPSBjdWJlLmNvcm5lclBhcml0eSgpOwoJCSAgICAgICAgdGhpcy5VUkZ0b0RMRiA9IGN1YmUuVVJGdG9ETEYoKTsKCQkgICAgICAgIHRoaXMuRlJ0b0JSID0gY3ViZS5GUnRvQlIoKTsKCQkgICAgICAgIC8vIFRoZXNlIGFyZSBsYXRlciBtZXJnZWQgdG8gVVJ0b0RGIHdoZW4gcGhhc2UgMiBiZWdpbnMKCQkgICAgICAgIHRoaXMuVVJ0b1VMID0gY3ViZS5VUnRvVUwoKTsKCQkgICAgICAgIHRoaXMuVUJ0b0RGID0gY3ViZS5VQnRvREYoKTsKCQkgICAgICAgIHJldHVybiB0aGlzOwoJCSAgICAgIH0KCgkJICAgICAgc29sdXRpb24oKSB7CgkJICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHsKCQkgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LnNvbHV0aW9uKCkgKyBtb3ZlTmFtZXNbdGhpcy5sYXN0TW92ZV0gKyAnICc7CgkJICAgICAgICB9IGVsc2UgewoJCSAgICAgICAgICByZXR1cm4gJyc7CgkJICAgICAgICB9CgkJICAgICAgfQoKCQkgICAgICAvLyMgSGVscGVycwoJCSAgICAgIG1vdmUodGFibGUsIGluZGV4LCBtb3ZlKSB7CgkJICAgICAgICByZXR1cm4gQ3ViZS5tb3ZlVGFibGVzW3RhYmxlXVtpbmRleF1bbW92ZV07CgkJICAgICAgfQoKCQkgICAgICBwcnVuaW5nKHRhYmxlLCBpbmRleCkgewoJCSAgICAgICAgcmV0dXJuIHBydW5pbmcoQ3ViZS5wcnVuaW5nVGFibGVzW3RhYmxlXSwgaW5kZXgpOwoJCSAgICAgIH0KCgkJICAgICAgLy8jIFBoYXNlIDEKCgkJICAgICAgLy8gUmV0dXJuIHRoZSBuZXh0IHZhbGlkIHBoYXNlIDEgbW92ZXMgZm9yIHRoaXMgc3RhdGUKCQkgICAgICBtb3ZlczEoKSB7CgkJICAgICAgICBpZiAodGhpcy5sYXN0TW92ZSAhPT0gbnVsbCkgewoJCSAgICAgICAgICByZXR1cm4gbmV4dE1vdmVzMVt0aGlzLmxhc3RNb3ZlIC8gMyB8IDBdOwoJCSAgICAgICAgfSBlbHNlIHsKCQkgICAgICAgICAgcmV0dXJuIGFsbE1vdmVzMTsKCQkgICAgICAgIH0KCQkgICAgICB9CgoJCSAgICAgIC8vIENvbXB1dGUgdGhlIG1pbmltdW0gbnVtYmVyIG9mIG1vdmVzIHRvIHRoZSBlbmQgb2YgcGhhc2UgMQoJCSAgICAgIG1pbkRpc3QxKCkgewoJCSAgICAgICAgdmFyIGQxLCBkMjsKCQkgICAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBtb3ZlcyB0byB0aGUgZW5kIG9mIHBoYXNlIDEgd3J0LiB0aGUKCQkgICAgICAgIC8vIGNvbWJpbmF0aW9uIGZsaXAgYW5kIHNsaWNlIGNvb3JkaW5hdGVzIG9ubHkKCQkgICAgICAgIGQxID0gdGhpcy5wcnVuaW5nKCdzbGljZUZsaXAnLCBOX1NMSUNFMSAqIHRoaXMuZmxpcCArIHRoaXMuc2xpY2UpOwoJCSAgICAgICAgLy8gVGhlIGNvbWJpbmF0aW9uIG9mIHR3aXN0IGFuZCBzbGljZSBjb29yZGluYXRlcwoJCSAgICAgICAgZDIgPSB0aGlzLnBydW5pbmcoJ3NsaWNlVHdpc3QnLCBOX1NMSUNFMSAqIHRoaXMudHdpc3QgKyB0aGlzLnNsaWNlKTsKCQkgICAgICAgIC8vIFRoZSB0cnVlIG1pbmltYWwgZGlzdGFuY2UgaXMgdGhlIG1heGltdW0gb2YgdGhlc2UgdHdvCgkJICAgICAgICByZXR1cm4gbWF4KGQxLCBkMik7CgkJICAgICAgfQoKCQkgICAgICAvLyBDb21wdXRlIHRoZSBuZXh0IHBoYXNlIDEgc3RhdGUgZm9yIHRoZSBnaXZlbiBtb3ZlCgkJICAgICAgbmV4dDEobW92ZSkgewoJCSAgICAgICAgdmFyIG5leHQ7CgkJICAgICAgICBuZXh0ID0gZnJlZVN0YXRlcy5wb3AoKTsKCQkgICAgICAgIG5leHQucGFyZW50ID0gdGhpczsKCQkgICAgICAgIG5leHQubGFzdE1vdmUgPSBtb3ZlOwoJCSAgICAgICAgbmV4dC5kZXB0aCA9IHRoaXMuZGVwdGggKyAxOwoJCSAgICAgICAgbmV4dC5mbGlwID0gdGhpcy5tb3ZlKCdmbGlwJywgdGhpcy5mbGlwLCBtb3ZlKTsKCQkgICAgICAgIG5leHQudHdpc3QgPSB0aGlzLm1vdmUoJ3R3aXN0JywgdGhpcy50d2lzdCwgbW92ZSk7CgkJICAgICAgICBuZXh0LnNsaWNlID0gdGhpcy5tb3ZlKCdGUnRvQlInLCB0aGlzLnNsaWNlICogMjQsIG1vdmUpIC8gMjQgfCAwOwoJCSAgICAgICAgcmV0dXJuIG5leHQ7CgkJICAgICAgfQoKCQkgICAgICAvLyMgUGhhc2UgMgoKCQkgICAgICAvLyBSZXR1cm4gdGhlIG5leHQgdmFsaWQgcGhhc2UgMiBtb3ZlcyBmb3IgdGhpcyBzdGF0ZQoJCSAgICAgIG1vdmVzMigpIHsKCQkgICAgICAgIGlmICh0aGlzLmxhc3RNb3ZlICE9PSBudWxsKSB7CgkJICAgICAgICAgIHJldHVybiBuZXh0TW92ZXMyW3RoaXMubGFzdE1vdmUgLyAzIHwgMF07CgkJICAgICAgICB9IGVsc2UgewoJCSAgICAgICAgICByZXR1cm4gYWxsTW92ZXMyOwoJCSAgICAgICAgfQoJCSAgICAgIH0KCgkJICAgICAgLy8gQ29tcHV0ZSB0aGUgbWluaW11bSBudW1iZXIgb2YgbW92ZXMgdG8gdGhlIHNvbHZlZCBjdWJlCgkJICAgICAgbWluRGlzdDIoKSB7CgkJICAgICAgICB2YXIgZDEsIGQyLCBpbmRleDEsIGluZGV4MjsKCQkgICAgICAgIGluZGV4MSA9IChOX1NMSUNFMiAqIHRoaXMuVVJ0b0RGICsgdGhpcy5GUnRvQlIpICogTl9QQVJJVFkgKyB0aGlzLnBhcml0eTsKCQkgICAgICAgIGQxID0gdGhpcy5wcnVuaW5nKCdzbGljZVVSdG9ERlBhcml0eScsIGluZGV4MSk7CgkJICAgICAgICBpbmRleDIgPSAoTl9TTElDRTIgKiB0aGlzLlVSRnRvRExGICsgdGhpcy5GUnRvQlIpICogTl9QQVJJVFkgKyB0aGlzLnBhcml0eTsKCQkgICAgICAgIGQyID0gdGhpcy5wcnVuaW5nKCdzbGljZVVSRnRvRExGUGFyaXR5JywgaW5kZXgyKTsKCQkgICAgICAgIHJldHVybiBtYXgoZDEsIGQyKTsKCQkgICAgICB9CgoJCSAgICAgIC8vIEluaXRpYWxpemUgcGhhc2UgMiBjb29yZGluYXRlcwoJCSAgICAgIGluaXQyKHRvcCA9IHRydWUpIHsKCQkgICAgICAgIGlmICh0aGlzLnBhcmVudCA9PT0gbnVsbCkgewoJCSAgICAgICAgICByZXR1cm47CgkJICAgICAgICB9CgkJICAgICAgICAvLyBGb3Igb3RoZXIgc3RhdGVzLCB0aGUgcGhhc2UgMiBzdGF0ZSBpcyBjb21wdXRlZCBiYXNlZCBvbgoJCSAgICAgICAgLy8gcGFyZW50J3Mgc3RhdGUuCgkJICAgICAgICAvLyBBbHJlYWR5IGFzc2lnbmVkIGZvciB0aGUgaW5pdGlhbCBzdGF0ZQoJCSAgICAgICAgdGhpcy5wYXJlbnQuaW5pdDIoZmFsc2UpOwoJCSAgICAgICAgdGhpcy5VUkZ0b0RMRiA9IHRoaXMubW92ZSgnVVJGdG9ETEYnLCB0aGlzLnBhcmVudC5VUkZ0b0RMRiwgdGhpcy5sYXN0TW92ZSk7CgkJICAgICAgICB0aGlzLkZSdG9CUiA9IHRoaXMubW92ZSgnRlJ0b0JSJywgdGhpcy5wYXJlbnQuRlJ0b0JSLCB0aGlzLmxhc3RNb3ZlKTsKCQkgICAgICAgIHRoaXMucGFyaXR5ID0gdGhpcy5tb3ZlKCdwYXJpdHknLCB0aGlzLnBhcmVudC5wYXJpdHksIHRoaXMubGFzdE1vdmUpOwoJCSAgICAgICAgdGhpcy5VUnRvVUwgPSB0aGlzLm1vdmUoJ1VSdG9VTCcsIHRoaXMucGFyZW50LlVSdG9VTCwgdGhpcy5sYXN0TW92ZSk7CgkJICAgICAgICB0aGlzLlVCdG9ERiA9IHRoaXMubW92ZSgnVUJ0b0RGJywgdGhpcy5wYXJlbnQuVUJ0b0RGLCB0aGlzLmxhc3RNb3ZlKTsKCQkgICAgICAgIGlmICh0b3ApIHsKCQkgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgaW5pdGlhbCBwaGFzZSAyIHN0YXRlLiBHZXQgdGhlIFVSdG9ERiBjb29yZGluYXRlCgkJICAgICAgICAgIC8vIGJ5IG1lcmdpbmcgVVJ0b1VMIGFuZCBVQnRvREYKCQkgICAgICAgICAgcmV0dXJuIHRoaXMuVVJ0b0RGID0gdGhpcy5tb3ZlKCdtZXJnZVVSdG9ERicsIHRoaXMuVVJ0b1VMLCB0aGlzLlVCdG9ERik7CgkJICAgICAgICB9CgkJICAgICAgfQoKCQkgICAgICAvLyBDb21wdXRlIHRoZSBuZXh0IHBoYXNlIDIgc3RhdGUgZm9yIHRoZSBnaXZlbiBtb3ZlCgkJICAgICAgbmV4dDIobW92ZSkgewoJCSAgICAgICAgdmFyIG5leHQ7CgkJICAgICAgICBuZXh0ID0gZnJlZVN0YXRlcy5wb3AoKTsKCQkgICAgICAgIG5leHQucGFyZW50ID0gdGhpczsKCQkgICAgICAgIG5leHQubGFzdE1vdmUgPSBtb3ZlOwoJCSAgICAgICAgbmV4dC5kZXB0aCA9IHRoaXMuZGVwdGggKyAxOwoJCSAgICAgICAgbmV4dC5VUkZ0b0RMRiA9IHRoaXMubW92ZSgnVVJGdG9ETEYnLCB0aGlzLlVSRnRvRExGLCBtb3ZlKTsKCQkgICAgICAgIG5leHQuRlJ0b0JSID0gdGhpcy5tb3ZlKCdGUnRvQlInLCB0aGlzLkZSdG9CUiwgbW92ZSk7CgkJICAgICAgICBuZXh0LnBhcml0eSA9IHRoaXMubW92ZSgncGFyaXR5JywgdGhpcy5wYXJpdHksIG1vdmUpOwoJCSAgICAgICAgbmV4dC5VUnRvREYgPSB0aGlzLm1vdmUoJ1VSdG9ERicsIHRoaXMuVVJ0b0RGLCBtb3ZlKTsKCQkgICAgICAgIHJldHVybiBuZXh0OwoJCSAgICAgIH0KCgkJICAgIH07CgkJICAgIHNvbHV0aW9uID0gbnVsbDsKCQkgICAgcGhhc2Uxc2VhcmNoID0gZnVuY3Rpb24oc3RhdGUpIHsKCQkgICAgICB2YXIgZGVwdGgsIG0sIHJlZiwgcmVzdWx0czsKCQkgICAgICBkZXB0aCA9IDA7CgkJICAgICAgcmVzdWx0cyA9IFtdOwoJCSAgICAgIGZvciAoZGVwdGggPSBtID0gMSwgcmVmID0gbWF4RGVwdGg7ICgxIDw9IHJlZiA/IG0gPD0gcmVmIDogbSA+PSByZWYpOyBkZXB0aCA9IDEgPD0gcmVmID8gKyttIDogLS1tKSB7CgkJICAgICAgICBwaGFzZTEoc3RhdGUsIGRlcHRoKTsKCQkgICAgICAgIGlmIChzb2x1dGlvbiAhPT0gbnVsbCkgewoJCSAgICAgICAgICBicmVhazsKCQkgICAgICAgIH0KCQkgICAgICAgIHJlc3VsdHMucHVzaChkZXB0aCsrKTsKCQkgICAgICB9CgkJICAgICAgcmV0dXJuIHJlc3VsdHM7CgkJICAgIH07CgkJICAgIHBoYXNlMSA9IGZ1bmN0aW9uKHN0YXRlLCBkZXB0aCkgewoJCSAgICAgIHZhciBsZW4sIG0sIG1vdmUsIG5leHQsIHJlZiwgcmVmMSwgcmVzdWx0czsKCQkgICAgICBpZiAoZGVwdGggPT09IDApIHsKCQkgICAgICAgIGlmIChzdGF0ZS5taW5EaXN0MSgpID09PSAwKSB7CgkJICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBzdGFydCBwaGFzZSAyIHdpdGggYSBwaGFzZSAyIG1vdmUgYXMgdGhlCgkJICAgICAgICAgIC8vIGxhc3QgbW92ZSBpbiBwaGFzZSAxLCBiZWNhdXNlIHBoYXNlIDIgd291bGQgdGhlbiByZXBlYXQgdGhlCgkJICAgICAgICAgIC8vIHNhbWUgbW92ZS4KCQkgICAgICAgICAgaWYgKHN0YXRlLmxhc3RNb3ZlID09PSBudWxsIHx8IChyZWYgPSBzdGF0ZS5sYXN0TW92ZSwgaW5kZXhPZi5jYWxsKGFsbE1vdmVzMiwgcmVmKSA8IDApKSB7CgkJICAgICAgICAgICAgcmV0dXJuIHBoYXNlMnNlYXJjaChzdGF0ZSk7CgkJICAgICAgICAgIH0KCQkgICAgICAgIH0KCQkgICAgICB9IGVsc2UgaWYgKGRlcHRoID4gMCkgewoJCSAgICAgICAgaWYgKHN0YXRlLm1pbkRpc3QxKCkgPD0gZGVwdGgpIHsKCQkgICAgICAgICAgcmVmMSA9IHN0YXRlLm1vdmVzMSgpOwoJCSAgICAgICAgICByZXN1bHRzID0gW107CgkJICAgICAgICAgIGZvciAobSA9IDAsIGxlbiA9IHJlZjEubGVuZ3RoOyBtIDwgbGVuOyBtKyspIHsKCQkgICAgICAgICAgICBtb3ZlID0gcmVmMVttXTsKCQkgICAgICAgICAgICBuZXh0ID0gc3RhdGUubmV4dDEobW92ZSk7CgkJICAgICAgICAgICAgcGhhc2UxKG5leHQsIGRlcHRoIC0gMSk7CgkJICAgICAgICAgICAgZnJlZVN0YXRlcy5wdXNoKG5leHQpOwoJCSAgICAgICAgICAgIGlmIChzb2x1dGlvbiAhPT0gbnVsbCkgewoJCSAgICAgICAgICAgICAgYnJlYWs7CgkJICAgICAgICAgICAgfSBlbHNlIHsKCQkgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh2b2lkIDApOwoJCSAgICAgICAgICAgIH0KCQkgICAgICAgICAgfQoJCSAgICAgICAgICByZXR1cm4gcmVzdWx0czsKCQkgICAgICAgIH0KCQkgICAgICB9CgkJICAgIH07CgkJICAgIHBoYXNlMnNlYXJjaCA9IGZ1bmN0aW9uKHN0YXRlKSB7CgkJICAgICAgdmFyIGRlcHRoLCBtLCByZWYsIHJlc3VsdHM7CgkJICAgICAgLy8gSW5pdGlhbGl6ZSBwaGFzZSAyIGNvb3JkaW5hdGVzCgkJICAgICAgc3RhdGUuaW5pdDIoKTsKCQkgICAgICByZXN1bHRzID0gW107CgkJICAgICAgZm9yIChkZXB0aCA9IG0gPSAxLCByZWYgPSBtYXhEZXB0aCAtIHN0YXRlLmRlcHRoOyAoMSA8PSByZWYgPyBtIDw9IHJlZiA6IG0gPj0gcmVmKTsgZGVwdGggPSAxIDw9IHJlZiA/ICsrbSA6IC0tbSkgewoJCSAgICAgICAgcGhhc2UyKHN0YXRlLCBkZXB0aCk7CgkJICAgICAgICBpZiAoc29sdXRpb24gIT09IG51bGwpIHsKCQkgICAgICAgICAgYnJlYWs7CgkJICAgICAgICB9CgkJICAgICAgICByZXN1bHRzLnB1c2goZGVwdGgrKyk7CgkJICAgICAgfQoJCSAgICAgIHJldHVybiByZXN1bHRzOwoJCSAgICB9OwoJCSAgICBwaGFzZTIgPSBmdW5jdGlvbihzdGF0ZSwgZGVwdGgpIHsKCQkgICAgICB2YXIgbGVuLCBtLCBtb3ZlLCBuZXh0LCByZWYsIHJlc3VsdHM7CgkJICAgICAgaWYgKGRlcHRoID09PSAwKSB7CgkJICAgICAgICBpZiAoc3RhdGUubWluRGlzdDIoKSA9PT0gMCkgewoJCSAgICAgICAgICByZXR1cm4gc29sdXRpb24gPSBzdGF0ZS5zb2x1dGlvbigpOwoJCSAgICAgICAgfQoJCSAgICAgIH0gZWxzZSBpZiAoZGVwdGggPiAwKSB7CgkJICAgICAgICBpZiAoc3RhdGUubWluRGlzdDIoKSA8PSBkZXB0aCkgewoJCSAgICAgICAgICByZWYgPSBzdGF0ZS5tb3ZlczIoKTsKCQkgICAgICAgICAgcmVzdWx0cyA9IFtdOwoJCSAgICAgICAgICBmb3IgKG0gPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBtIDwgbGVuOyBtKyspIHsKCQkgICAgICAgICAgICBtb3ZlID0gcmVmW21dOwoJCSAgICAgICAgICAgIG5leHQgPSBzdGF0ZS5uZXh0Mihtb3ZlKTsKCQkgICAgICAgICAgICBwaGFzZTIobmV4dCwgZGVwdGggLSAxKTsKCQkgICAgICAgICAgICBmcmVlU3RhdGVzLnB1c2gobmV4dCk7CgkJICAgICAgICAgICAgaWYgKHNvbHV0aW9uICE9PSBudWxsKSB7CgkJICAgICAgICAgICAgICBicmVhazsKCQkgICAgICAgICAgICB9IGVsc2UgewoJCSAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHZvaWQgMCk7CgkJICAgICAgICAgICAgfQoJCSAgICAgICAgICB9CgkJICAgICAgICAgIHJldHVybiByZXN1bHRzOwoJCSAgICAgICAgfQoJCSAgICAgIH0KCQkgICAgfTsKCQkgICAgZnJlZVN0YXRlcyA9IChmdW5jdGlvbigpIHsKCQkgICAgICB2YXIgbSwgcmVmLCByZXN1bHRzOwoJCSAgICAgIHJlc3VsdHMgPSBbXTsKCQkgICAgICBmb3IgKG0gPSAwLCByZWYgPSBtYXhEZXB0aCArIDE7ICgwIDw9IHJlZiA/IG0gPD0gcmVmIDogbSA+PSByZWYpOyAwIDw9IHJlZiA/ICsrbSA6IC0tbSkgewoJCSAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyBTdGF0ZSk7CgkJICAgICAgfQoJCSAgICAgIHJldHVybiByZXN1bHRzOwoJCSAgICB9KSgpOwoJCSAgICBzdGF0ZSA9IGZyZWVTdGF0ZXMucG9wKCkuaW5pdCh0aGlzKTsKCQkgICAgcGhhc2Uxc2VhcmNoKHN0YXRlKTsKCQkgICAgZnJlZVN0YXRlcy5wdXNoKHN0YXRlKTsKCQkgICAgLy8gVHJpbSB0aGUgdHJhaWxpbmcgc3BhY2UKCQkgICAgaWYgKHNvbHV0aW9uLmxlbmd0aCA+IDApIHsKCQkgICAgICBzb2x1dGlvbiA9IHNvbHV0aW9uLnN1YnN0cmluZygwLCBzb2x1dGlvbi5sZW5ndGggLSAxKTsKCQkgICAgfQoJCSAgICByZXR1cm4gc29sdXRpb247CgkJICB9OwoKCQkgIGZhY2VOdW1zID0gewoJCSAgICBVOiAwLAoJCSAgICBSOiAxLAoJCSAgICBGOiAyLAoJCSAgICBEOiAzLAoJCSAgICBMOiA0LAoJCSAgICBCOiA1CgkJICB9OwoKCQkgIGZhY2VOYW1lcyA9IHsKCQkgICAgMDogJ1UnLAoJCSAgICAxOiAnUicsCgkJICAgIDI6ICdGJywKCQkgICAgMzogJ0QnLAoJCSAgICA0OiAnTCcsCgkJICAgIDU6ICdCJwoJCSAgfTsKCgkJICBDdWJlLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKG1heERlcHRoID0gMjIpIHsKCQkgICAgdmFyIGNsb25lLCBsZW4sIG0sIG1vdmUsIHJlZiwgcm90YXRpb24sIHNvbHV0aW9uLCB1cHJpZ2h0LCB1cHJpZ2h0U29sdXRpb247CgkJICAgIGNsb25lID0gdGhpcy5jbG9uZSgpOwoJCSAgICB1cHJpZ2h0ID0gY2xvbmUudXByaWdodCgpOwoJCSAgICBjbG9uZS5tb3ZlKHVwcmlnaHQpOwoJCSAgICByb3RhdGlvbiA9IG5ldyBDdWJlKCkubW92ZSh1cHJpZ2h0KS5jZW50ZXI7CgkJICAgIHVwcmlnaHRTb2x1dGlvbiA9IGNsb25lLnNvbHZlVXByaWdodChtYXhEZXB0aCk7CgkJICAgIHNvbHV0aW9uID0gW107CgkJICAgIHJlZiA9IHVwcmlnaHRTb2x1dGlvbi5zcGxpdCgnICcpOwoJCSAgICBmb3IgKG0gPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBtIDwgbGVuOyBtKyspIHsKCQkgICAgICBtb3ZlID0gcmVmW21dOwoJCSAgICAgIHNvbHV0aW9uLnB1c2goZmFjZU5hbWVzW3JvdGF0aW9uW2ZhY2VOdW1zW21vdmVbMF1dXV0pOwoJCSAgICAgIGlmIChtb3ZlLmxlbmd0aCA+IDEpIHsKCQkgICAgICAgIHNvbHV0aW9uW3NvbHV0aW9uLmxlbmd0aCAtIDFdICs9IG1vdmVbMV07CgkJICAgICAgfQoJCSAgICB9CgkJICAgIHJldHVybiBzb2x1dGlvbi5qb2luKCcgJyk7CgkJICB9OwoKCQkgIEN1YmUuc2NyYW1ibGUgPSBmdW5jdGlvbigpIHsKCQkgICAgcmV0dXJuIEN1YmUuaW52ZXJzZShDdWJlLnJhbmRvbSgpLnNvbHZlKCkpOwoJCSAgfTsKCgkJfSkuY2FsbChzb2x2ZSk7CgkJcmV0dXJuIHNvbHZlOwoJfQoKCXZhciBjdWJlanM7Cgl2YXIgaGFzUmVxdWlyZWRDdWJlanM7CgoJZnVuY3Rpb24gcmVxdWlyZUN1YmVqcyAoKSB7CgkJaWYgKGhhc1JlcXVpcmVkQ3ViZWpzKSByZXR1cm4gY3ViZWpzOwoJCWhhc1JlcXVpcmVkQ3ViZWpzID0gMTsKCQljdWJlanMgPSByZXF1aXJlQ3ViZSgpOwoJCXJlcXVpcmVTb2x2ZSgpOwoJCXJldHVybiBjdWJlanM7Cgl9CgoJdmFyIGN1YmVqc0V4cG9ydHMgPSByZXF1aXJlQ3ViZWpzKCk7Cgl2YXIgQ3ViZSA9IC8qQF9fUFVSRV9fKi9nZXREZWZhdWx0RXhwb3J0RnJvbUNqcyhjdWJlanNFeHBvcnRzKTsKCglzZWxmLm9ubWVzc2FnZSA9IGFzeW5jIChldmVudCkgPT4gewoJICAgIGNvbnN0IHsgaW5pdGlhbFN0YXRlU3RyaW5nIH0gPSBldmVudC5kYXRhOwoJICAgIHRyeSB7CgkgICAgICAgIGF3YWl0IEN1YmUuaW5pdFNvbHZlcigpOwoJICAgICAgICBjb25zdCBjdWJlID0gQ3ViZS5mcm9tU3RyaW5nKGluaXRpYWxTdGF0ZVN0cmluZyk7CgkgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gYXdhaXQgY3ViZS5zb2x2ZSgpOwoJICAgICAgICAKCSAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHNvbHV0aW9uIH0pOwoJICAgIH0gY2F0Y2ggKGVycm9yKSB7CgkgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTsKCSAgICB9Cgl9OwoKfSkoKTsKLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3ViZVdvcmtlci5qcy5tYXAKCg==');
	/* eslint-enable */

	const cubeWorker = new WorkerFactory();

	cubeWorker.onerror = (event) => {
	  console.error("Error loading worker:", event);
	};

	async function solveCube(initialStateString) {

	  await Cube.initSolver();

	  const cube = Cube.fromString(initialStateString);

	  if (cube.isSolved()) {
	    const prevButton = document.querySelector(".btn--prev");
	    const nextButton = document.querySelector(".btn--next");
	    if (prevButton) prevButton.style.opacity = "0";
	    if (nextButton) nextButton.style.opacity = "0";
	    return "";
	  }

	  const timeoutPromise = () => new Promise((resolve, reject) =>
	    setTimeout(() => {
	      reject(new Error("Could not find a solution. The state must be invalid. Resetting the Cube."));
	    }, 6000)
	  );

	  let solution;
	  try {
	    const workerPromise = new Promise((resolve, reject) => {
	      cubeWorker.postMessage({ initialStateString });
	      cubeWorker.onmessage = (event) => {
	        if (event.data.error) {
	          reject(new Error(event.data.error));
	        } else {
	          resolve(event.data.solution);
	        }
	      };
	      cubeWorker.onerror = (event) => {
	        console.error("Error from worker's internal execution (main thread):", event);
	        reject(new Error(`Worker execution error: ${event.message}`));
	      };
	    });

	    solution = await Promise.race([timeoutPromise(), workerPromise]);
	  } catch (error) {
	    console.error("Error during cube solving:", error.message);
	    throw error; // Re-throw the error to be handled by the caller
	  }

	  if (solution) {
	    return solution;
	  } else {
	    console.error(
	      "Could not find a solution. The state must be invalid."
	    );
	  }
	}

	const STATE = {
	  Menu: 0,
	  Playing: 1,
	  Complete: 2,
	  Prefs: 4,
	  Theme: 5,
	};
	localStorage.removeItem("theCube_playing");
	localStorage.removeItem("theCube_savedState");
	localStorage.removeItem("theCube_time");
	localStorage.removeItem("theCube_preferences");
	localStorage.removeItem("theCube_theme");

	const BUTTONS = {
	  Menu: ["prefs"],
	  Playing: ["back"],
	  Complete: [],
	  Prefs: ["back", "theme"],
	  Theme: ["back", "reset"],
	  None: [],
	};

	const SHOW = true;
	const HIDE = false;
	let solutionSteps = "";
	let scramble = [];
	let presentIndex = 0;

	class Game {
	  is3Dsetup = false;

	  constructor() {
	    this.setup2DCube();
	    this.gameClickHandler = null;
	  }

	  setup2DCube() {
	    const FACE_COLORS = {
	      U: "#fff7ff", // white (Top)
	      D: "#ffef48", // yellow (Bottom)
	      F: "#ef3923", // red (Front)
	      R: "#41aac8", // blue (Right)
	      B: "#ff8c0a", // orange (Back)
	      L: "#82ca38", // green (Left)
	    };

	    let selectedColor = null;
	    let currentFace = "F";

	    const cubeState = {
	      U: [
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	        "#fff7ff",
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	      ],
	      D: [
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	        "#ffef48",
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	      ],
	      F: [
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	        "#ef3923",
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	      ],
	      B: [
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	        "#ff8c0a",
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	      ],
	      L: [
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#82ca38",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	      ],
	      R: [
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	        "#41aac8",
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	      ],
	    };

	    const adjacentFaces = {
	      F: { top: "U", bottom: "D", left: "L", right: "R" },
	      B: { top: "U", bottom: "D", left: "R", right: "L" },
	      L: { top: "U", bottom: "D", left: "B", right: "F" },
	      R: { top: "U", bottom: "D", left: "F", right: "B" },
	      U: { top: "B", bottom: "F", left: "L", right: "R" },
	      D: { top: "F", bottom: "B", left: "L", right: "R" },
	    };

	    const colorButtons = document.getElementById("colorButtons");
	    const face = document.getElementById("face");
	    const faceSelector = document.getElementById("faceSelector");
	    const printButton = document.getElementById("printButton");
	    const output = document.getElementById("output");

	    // Create color selector buttons
	    Object.entries(FACE_COLORS).forEach(([label, color], i) => {
	      const btn = document.createElement("button");
	      btn.title = label;
	      btn.style.backgroundColor = color;
	      btn.style.width = "30px";
	      btn.style.height = "30px";
	      btn.style.border = "2px solid white";
	      btn.style.marginRight = "5px";
	      btn.style.cursor = "pointer";

	      btn.addEventListener("click", () => {
	        selectedColor = color;
	        [...colorButtons.children].forEach((b) => (b.style.outline = "none"));
	        btn.style.outline = "2px solid white";
	      });
	      cubeState[label][4] = color;

	      colorButtons.appendChild(btn);
	    });

	    // Create 9 cuboids (face tiles)
	    const cuboids = [];
	    for (let i = 0; i < 9; i++) {
	      const div = document.createElement("div");
	      div.style.width = "50px";
	      div.style.height = "50px";
	      div.style.backgroundColor = "#555";
	      div.style.cursor = "pointer";
	      div.style.border = "1px solid #999";
	      div.addEventListener("click", (event) => {
	        if (i == 4) {
	          event.preventDefault();
	          return;
	        }
	        if (selectedColor) {
	          div.style.backgroundColor = selectedColor;
	          cubeState[currentFace][i] = selectedColor;
	        }
	      });
	      cuboids.push(div);
	      face.appendChild(div);
	    }

	    const convertStateForSolver = (state) => {
	      const colorToFaceLetter = {};
	      Object.entries(FACE_COLORS).forEach(([face, color]) => {
	        // The solver expects single-letter face names (U, D, L, R, F, B)
	        colorToFaceLetter[color] = face.charAt(0);
	      });

	      // The solver expects the faces in FRUDLB order.
	      const faceOrder = ["U", "R", "F", "D", "L", "B"];

	      const data = faceOrder
	        .map((faceLetter) =>
	          state[faceLetter]
	            .map((hexColor) => colorToFaceLetter[hexColor] || "X") // 'X' for gray/unassigned
	            .join("")
	        )
	        .join("");

	      return data;
	    };

	    // Face change logic with validation
	    faceSelector.addEventListener("change", (event) => {
	      const newFace = event.target.value;
	      currentFace = newFace;
	      cubeState[currentFace].forEach((color, i) => {
	        cuboids[i].style.backgroundColor = color;
	      });
	      updateSurroundingFaces();
	    });

	    // Print/validate cube state
	    printButton.addEventListener("click", async () => {
	      console.log("printButton clicked");
	      printButton.disabled = true;
	      output.style.display = "block";
	      const allColors = Object.values(cubeState).flat();
	      const usedColors = new Set(allColors);
	      usedColors.delete("#555");

	      if (usedColors.size !== 6) {
	        output.textContent = `❌ Cube must use exactly 6 colors.\nUsed: ${[
          ...usedColors,
        ].join(", ")}`;
	        output.style.opacity = 1;
	        printButton.disabled = false;
	        return;
	      }

	      const colorCounts = {};
	      for (const color of allColors) {
	        if (color === "#555") continue;
	        colorCounts[color] = (colorCounts[color] || 0) + 1;
	      }

	      const overused = Object.entries(colorCounts).filter(
	        ([color, count]) => count > 9
	      );
	      if (overused.length > 0) {
	        const msgs = overused.map(
	          ([color, count]) => `${color} used ${count} times`
	        );
	        output.textContent =
	          `❌ Each color can only appear up to 9 times.\n` + msgs.join("\n");
	        output.style.opacity = 1;
	        printButton.disabled = false;
	        return;
	      }

	      const solverString = convertStateForSolver(cubeState);

	      try {
	        const solution = await solveCube(solverString);

	        if (solution && typeof solution === "string") {
	          solutionSteps = solution;
	          output.textContent += `\nSolution: ${solution}`;

	          // Use the game's scrambler and controls to animate the solution.
	          if (!this.is3Dsetup) {
	            output.style.opacity = 0;
	            this.setup3DCube();
	          } else {
	            output.style.opacity = 0;
	            this.cube.reset();
	            this.cube.init();
	            this.scrambleInitLogic();

	            const customCube = document.querySelector("#custom-cube");
	            if (customCube) customCube.style.display = "none";

	            const mainUi = document.querySelector("#main-ui");
	            if (mainUi) mainUi.style.display = "block";
	          }
	        } else {
	          output.textContent += "\n❌ No solution found.";
	          printButton.disabled = false;
	        }
	      } catch (error) {
	        console.log("error1",error);
	        output.textContent = `❌ ${error.message}`;
	        output.style.opacity = 1;
	        printButton.disabled = false;
	        setTimeout(() => {
	          window.location.reload();
	        }, 3000);
	      }
	    });

	    // Initialize face with default face data
	    cubeState[currentFace].forEach((color, i) => {
	      cuboids[i].style.backgroundColor = color;
	    });

	    function createStrip(id) {
	      const container = document.getElementById(id);
	      container.innerHTML = "";
	      for (let i = 0; i < 9; i++) {
	        const tile = document.createElement("div");
	        tile.style.width = "30px";
	        tile.style.height = "30px";
	        tile.style.border = "1px solid #888";
	        tile.style.backgroundColor = "#222";
	        tile.style.display = "inline-block";
	        container.appendChild(tile);
	      }
	    }

	    function updateSurroundingFaces() {
	      const adj = adjacentFaces[currentFace];

	      function updateStrip(stripId, faceKey) {
	        const container = document.getElementById(stripId);
	        const tiles = container.children;
	        const colors = cubeState[faceKey];

	        for (let i = 0; i < 9; i++) {
	          tiles[i].style.backgroundColor = colors[i];
	        }
	      }

	      updateStrip("adj-top", adj.top);
	      updateStrip("adj-bottom", adj.bottom);
	      updateStrip("adj-left", adj.left);
	      updateStrip("adj-right", adj.right);
	    }

	    createStrip("adj-top");
	    createStrip("adj-bottom");
	    createStrip("adj-left");
	    createStrip("adj-right");
	    updateSurroundingFaces();
	  }

	  setup3DCube() {
	    this.is3Dsetup = true;
	    const customCube = document.querySelector("#custom-cube");
	    customCube.style.display = "none";
	    const mainUi = document.querySelector("#main-ui");
	    mainUi.style.display = "block";
	    this.dom = {
	      ui: document.querySelector(".ui"),
	      game: document.querySelector(".ui__game"),
	      back: document.querySelector(".ui__background"),
	      prefs: document.querySelector(".ui__prefs"),
	      theme: document.querySelector(".ui__theme"),
	      texts: {
	        title: document.querySelector(".text--title"),
	        note: document.querySelector(".text--note"),
	        complete: document.querySelector(".text--complete"),
	        best: document.querySelector(".text--best-time"),
	        theme: document.querySelector(".text--theme"),
	        step: document.querySelector(".text--step"),
	      },
	      buttons: {
	        prefs: document.querySelector(".btn--prefs"),
	        back: document.querySelector(".btn--back"),
	        reset: document.querySelector(".btn--reset"),
	        theme: document.querySelector(".btn--theme"),
	        next: document.querySelector(".btn--next"),
	        prev: document.querySelector(".btn--prev"),
	        home: document.querySelector(".btn--home"),
	      },
	    };

	    this.world = new World(this);
	    this.cube = new Cube$1(this);
	    this.controls = new Controls(this);
	    this.scrambler = new Scrambler(this);
	    this.transition = new Transition(this);
	    this.preferences = new Preferences(this);
	    this.storage = new Storage(this);
	    this.confetti = new Confetti(this);
	    this.themes = new Themes(this);
	    this.themeEditor = new ThemeEditor(this);

	    this.state = STATE.Menu;
	    this.newGame = false;
	    this.saved = false;

	    this.storage.init();
	    this.preferences.init();
	    this.cube.init();
	    this.transition.init();

	    this.storage.loadGame();
	    this.initActions();

	    setTimeout(() => {
	      this.transition.float();
	      this.transition.cube(SHOW);

	      setTimeout(() => this.transition.title(SHOW), 700);
	      setTimeout(
	        () => this.transition.buttons(BUTTONS.Menu, BUTTONS.None),
	        1000
	      );
	    }, 500);
	  }

	  initActions() {
	    this.scrambleInitLogic();
	    this.doubleClickEvent();

	    this.controls.onMove = () => {
	      if (this.newGame) {
	        this.newGame = false;
	      }
	    };

	    this.dom.buttons.back.onclick = (event) => {
	      if (this.transition.activeTransitions > 0) return;

	      if (this.state === STATE.Playing) {
	        this.game(HIDE);
	      } else if (this.state === STATE.Prefs) {
	        this.prefs(HIDE);
	      } else if (this.state === STATE.Theme) {
	        this.theme(HIDE);
	      }
	    };

	    this.dom.buttons.reset.onclick = (event) => {
	      if (this.state === STATE.Theme) {
	        this.themeEditor.resetTheme();
	      }
	    };

	    this.dom.buttons.prefs.onclick = (event) => this.prefs(SHOW);

	    this.dom.buttons.theme.onclick = (event) => this.theme(SHOW);

	    this.controls.onSolved = () => this.complete(SHOW);

	  }

	  clickEvent = (event, tappedTwice) => {
	    if (this.transition.activeTransitions > 0) return;
	    if (this.state === STATE.Playing) return;

	    if (this.state === STATE.Menu) {
	      if (!tappedTwice) {
	        return false;
	      }

	      this.game(SHOW);
	    } else if (this.state === STATE.Complete) {
	      this.complete(HIDE);
	    }
	    return true;
	  }

	  doubleClickEvent() {
	    // Remove the previous click handler if it exists to prevent duplicates.
	    if (this.gameClickHandler) {
	      this.dom.game.removeEventListener("click", this.gameClickHandler, false);
	      this.gameClickHandler = null;
	    }

	    setTimeout(() => {
	      let tappedTwice = false;
	      this.gameClickHandler = (event) => {
	        if (!this.clickEvent(event, tappedTwice)) {
	          tappedTwice = true;
	          setTimeout(() => (tappedTwice = false), 300);
	        }
	      };
	      this.dom.game.addEventListener("click", this.gameClickHandler, false);
	    }, 2000);
	  }

	  homeButtonEvent() {
	    this.dom.buttons.home.onclick = (event) => {
	      // const customCube = document.querySelector("#custom-cube");
	      // if (customCube) customCube.style.display = "flex";

	      // const mainUi = document.querySelector("#main-ui");
	      // if (mainUi) mainUi.style.display = "none";

	      // this.dom.buttons.home.style.display = "none";
	      // printButton.disabled = false;\
	      window.location.reload();
	    };
	  }

	  scrambleInitLogic() {
	    console.log("solution steps", solutionSteps);
	    const solutionStepsArray = this.getNewOutput(solutionSteps);
	    this.solutionStepsArray = solutionStepsArray;
	    scramble = this._getScrambleFromSolution(solutionSteps);
	    this.scramble = scramble;
	    this.controls.disable(); // Disable controls before scrambling
	    this.scrambler.scramble(scramble);
	    this.controls.scrambleCube(() => {
	      console.log("scramble complete");
	      setTimeout(() => {
	        this.controls.enable(); // Re-enable controls after scrambling is complete
	        this.doubleClickEvent();
	        // this.prevButtonEvent();
	        // this.nextButtonEvent();
	      }, 2500);
	    });

	  }

	  _getScrambleFromSolution(solution) {
	    const moves = solution.split(" ");
	    const reversedAndInvertedMoves = moves.reverse().map((move) => {
	      if (move.endsWith("'")) {
	        return move.slice(0, -1);
	      }
	      if (move.endsWith("2")) {
	        return move;
	      }
	      return `${move}'`;
	    });
	    return reversedAndInvertedMoves.join(" ");
	  }
	  getNewOutput(sol) {
	    // The solution string is space-separated, so we can just split it.
	    // return sol.split(' ').filter(move => move !== '');
	    let newData = [];
	    [...sol].map((data, index) => {
	      let st = "";
	      if (
	        data == "R" ||
	        data == "U" ||
	        data == "F" ||
	        data == "L" ||
	        data == "D" ||
	        data == "B"
	      ) {
	        st = st + data;
	        if (sol[index + 1] == `'` || sol[index + 1] == "2")
	          st = st + sol[index + 1];
	        newData.push(st);
	      }
	    });
	    return newData;
	  }

	  nextButtonEvent() {
	    const solutionStepsArray = this.solutionStepsArray;

	    this.dom.buttons.next.onclick = (event) => {
	      if (presentIndex >= solutionStepsArray.length) {
	        this.dom.buttons.next.style.pointerEvents = "none";
	        this.dom.buttons.next.style.opacity = "0.5";
	        this.dom.buttons.prev.style.pointerEvents = "none";
	        this.dom.buttons.prev.style.opacity = "0.5";

	        this.dom.texts.step.style.opacity = 0;

	        setTimeout(() => {
	          this.complete(SHOW);
	        }, 500);
	        return;
	      }
	      this.dom.buttons.prev.style.pointerEvents = "none";
	      this.dom.buttons.prev.style.opacity = "0.5";
	      this.dom.buttons.next.style.pointerEvents = "none";
	      this.dom.buttons.next.style.opacity = "0.5";
	      const presentStep = solutionStepsArray[presentIndex++];
	      const totalSteps = solutionStepsArray.length;

	      const prevStep = solutionStepsArray[presentIndex - 2] || "-";
	      const currStep = solutionStepsArray[presentIndex - 1] || "Start";
	      const nextStep = solutionStepsArray[presentIndex] || "-";
	      this.dom.texts.step.querySelector(
	        "span"
	      ).textContent = `(STEPS: ${presentIndex}/${totalSteps})   |    Prev: ${prevStep}    |    Current: ${currStep}    |    Next: ${nextStep}`;

	      this.controls.disable();
	      this.scrambler.scramble(presentStep);
	      this.controls.scrambleCube(() => {
	        this.controls.enable();
	        this.dom.buttons.prev.style.pointerEvents = "all";
	        this.dom.buttons.prev.style.opacity = "1";
	        this.dom.buttons.next.style.pointerEvents = "all";
	        this.dom.buttons.next.style.opacity = "1";
	      });
	    };

	    // this.dom.buttons.next.addEventListener("click", this.nextButtonHandler, false);
	  }

	  prevButtonEvent() {
	    const solutionStepsArray = this.solutionStepsArray;

	    this.dom.buttons.prev.onclick = (event) => {
	      if (presentIndex <= 0) {
	        this.dom.buttons.prev.style.pointerEvents = "none";
	        this.dom.buttons.prev.style.opacity = "0.5";
	        return;
	      }
	      this.dom.buttons.prev.style.pointerEvents = "none";
	      this.dom.buttons.prev.style.opacity = "0.5";
	      this.dom.buttons.next.style.pointerEvents = "none";
	      this.dom.buttons.next.style.opacity = "0.5";

	      presentIndex--;
	      const totalSteps = solutionStepsArray.length;
	      const presentStep = solutionStepsArray[presentIndex];
	      const invertedStep = this._getScrambleFromSolution(presentStep);

	      const prevStep = solutionStepsArray[presentIndex - 2] || "-";
	      const currStep = solutionStepsArray[presentIndex - 1] || "Start";
	      const nextStep = solutionStepsArray[presentIndex] || "-";
	      this.dom.texts.step.querySelector(
	        "span"
	      ).textContent = `(${presentIndex}/${totalSteps}) Prev: ${prevStep} | Current: ${currStep} | Next: ${nextStep}`;

	      this.controls.disable();
	      this.scrambler.scramble(invertedStep);
	      this.controls.scrambleCube(() => {
	        this.controls.enable();
	        this.dom.buttons.prev.style.pointerEvents = "all";
	        this.dom.buttons.prev.style.opacity = "1";
	        this.dom.buttons.next.style.pointerEvents = "all";
	        this.dom.buttons.next.style.opacity = "1";
	      });
	    };

	    // this.dom.buttons.prev.addEventListener("click", this.prevButtonHandler, false);
	  }

	  game(show) {
	    if (show) {
	      if (!this.saved) {
	        presentIndex = 0; // Reset for new solution
	        this.dom.buttons.next.style.pointerEvents = "all";
	        this.dom.buttons.next.style.opacity = "1";
	        this.dom.buttons.prev.style.pointerEvents = "none";
	        this.dom.buttons.prev.style.opacity = "0.5";
	        const totalSteps = this.solutionStepsArray.length;
	        this.dom.texts.step.querySelector(
	          "span"
	        ).textContent = `(0/${totalSteps}) Prev: - | Current: Start | Next: ${this.solutionStepsArray[0] || "-"
        }`;
	        setTimeout(() => {
	          this.nextButtonEvent();
	          this.prevButtonEvent();
	        }, 1500);
	      }

	      const duration = this.saved
	        ? 0
	        : this.scrambler.converted.length * (this.controls.flipSpeeds[0] + 10);

	      this.state = STATE.Playing;
	      this.saved = true;

	      this.transition.buttons(BUTTONS.None, BUTTONS.Menu);

	      this.transition.zoom(STATE.Playing, duration);
	      this.dom.buttons.home.style.display = "none";
	      this.transition.title(HIDE);
	      this.dom.texts.step.style.opacity = 1;

	      setTimeout(() => {
	        this.controls.enable();
	      }, this.transition.durations.zoom);
	    } else {
	      this.state = STATE.Menu;

	      this.transition.buttons(BUTTONS.Menu, BUTTONS.Playing);

	      this.transition.zoom(STATE.Menu, 0);

	      this.controls.disable();
	      this.dom.texts.step.style.opacity = 0;
	      this.dom.texts.step.querySelector("span").textContent = "";

	      setTimeout(
	        () => this.transition.title(SHOW),
	        this.transition.durations.zoom - 1000
	      );

	      this.playing = false;
	      this.controls.disable();
	    }
	  }

	  prefs(show) {
	    if (show) {
	      if (this.transition.activeTransitions > 0) return;

	      this.state = STATE.Prefs;

	      this.transition.buttons(BUTTONS.Prefs, BUTTONS.Menu);

	      this.transition.title(HIDE);
	      this.transition.cube(HIDE);

	      setTimeout(() => this.transition.preferences(SHOW), 1000);
	    } else {
	      this.cube.resize();

	      this.state = STATE.Menu;

	      this.transition.buttons(BUTTONS.Menu, BUTTONS.Prefs);

	      this.transition.preferences(HIDE);

	      setTimeout(() => this.transition.cube(SHOW), 500);
	      setTimeout(() => this.transition.title(SHOW), 1200);
	    }
	  }

	  theme(show) {
	    this.themeEditor.colorPicker(show);

	    if (show) {
	      if (this.transition.activeTransitions > 0) return;

	      this.cube.loadFromData(States["3"]["checkerboard"]);

	      this.themeEditor.setHSL(null, false);

	      this.state = STATE.Theme;

	      this.transition.buttons(BUTTONS.Theme, BUTTONS.Prefs);

	      this.transition.preferences(HIDE);

	      setTimeout(() => this.transition.cube(SHOW, true), 500);
	      setTimeout(() => this.transition.theming(SHOW), 1000);
	    } else {
	      this.state = STATE.Prefs;

	      this.transition.buttons(BUTTONS.Prefs, BUTTONS.Theme);

	      this.transition.cube(HIDE, true);
	      this.transition.theming(HIDE);

	      setTimeout(() => this.transition.preferences(SHOW), 1000);
	      setTimeout(() => {
	        // JSON.parse(
	        // localStorage.getItem("theCube_savedState")
	        // );

	        {
	          this.cube.resize(true);
	          return;
	        }
	      }, 1500);
	    }
	  }

	  complete(show) {
	    if (this.completeTimeout) {
	      clearTimeout(this.completeTimeout);
	      this.completeTimeout = null;
	    }

	    if (show) {
	      // Hide the prev/next buttons when the cube is solved
	      this.dom.buttons.prev.style.opacity = "0";
	      this.dom.buttons.next.style.opacity = "0";
	      this.transition.buttons(BUTTONS.Complete, BUTTONS.Playing);

	      this.state = STATE.Complete;
	      this.saved = false;

	      this.controls.disable();
	      this.storage.clearGame();
	      this.transition.zoom(STATE.Menu, 0);
	      this.transition.elevate(SHOW);

	      setTimeout(() => {
	        this.transition.complete(SHOW, this.bestTime);
	        this.confetti.start();

	        this.completeTimeout = setTimeout(() => {
	          this.complete(HIDE);
	        }, 4000);
	      }, 1000);
	    } else {
	      this.state = STATE.Menu;
	      this.saved = false;
	      this.transition.complete(HIDE, this.bestTime);
	      this.transition.cube(HIDE);
	      if (this.gameClickHandler) {
	        this.dom.game.removeEventListener("click", this.gameClickHandler, false);
	        this.gameClickHandler = null;
	      }

	      if (this.nextButtonHandler) {
	        // this.dom.buttons.next.removeEventListener("click", this.nextButtonHandler, false);
	        this.nextButtonHandler = null;
	      }

	      if (this.prevButtonHandler) {
	        // this.dom.buttons.prev.removeEventListener("click", this.prevButtonHandler, false);
	        this.prevButtonHandler = null;
	      }
	      setTimeout(() => {
	        this.cube.reset();
	        this.confetti.stop();
	        this.transition.elevate(HIDE);
	        this.transition.buttons(BUTTONS.Menu, BUTTONS.Complete);
	        this.transition.cube(SHOW);
	        this.scrambleInitLogic();
	        this.dom.buttons.home.style.display = "flex"; // Make home button visible
	        this.homeButtonEvent();
	        this.transition.title(SHOW);
	      }, 1000);

	      return false;
	    }
	  }
	}

	window.game = new Game();

})();
